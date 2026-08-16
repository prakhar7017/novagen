import { chromium } from '@playwright/test'
import { readdir, access } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

async function findLocalChromium() {
  const root = join(homedir(), 'AppData', 'Local', 'ms-playwright')
  try {
    const dirs = (await readdir(root))
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    for (const d of dirs) {
      const exe = join(root, d, 'chrome-win64', 'chrome.exe')
      try {
        await access(exe)
        return exe
      } catch {
      }
    }
  } catch {
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (f, d) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : d
}
const URL = argOf('--url', 'http://localhost:5180')

const HOOK = `
  window.__gl = { link: 0, compile: 0, bufferData: 0, resize: 0, sizes: [] }
  const realGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = realGetContext.call(this, type, ...rest)
    if (ctx && /webgl/.test(type) && !ctx.__hooked) {
      ctx.__hooked = true
      const wrap = (name, key) => {
        const fn = ctx[name]
        if (typeof fn !== 'function') return
        ctx[name] = function (...a) {
          window.__gl[key]++
          return fn.apply(this, a)
        }
      }
      wrap('linkProgram', 'link')
      wrap('compileShader', 'compile')
      wrap('bufferData', 'bufferData')
      // The drawing buffer only changes size when someone assigns to the
      // canvas's width/height, so that is where a resize is observable.
      const canvas = this
      let w = canvas.width
      let h = canvas.height
      const check = () => {
        if (canvas.width !== w || canvas.height !== h) {
          w = canvas.width
          h = canvas.height
          window.__gl.resize++
          if (window.__gl.sizes.length < 30) window.__gl.sizes.push(w + 'x' + h)
        }
        requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    }
    return ctx
  }
`

const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath: await findLocalChromium(),
  args: GPU_ARGS,
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.addInitScript(HOOK)
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2800)

const afterMount = await page.evaluate(() => ({ ...window.__gl, sizes: [...window.__gl.sizes] }))

await page.mouse.move(720, 450)
const height = await page.evaluate(() => document.documentElement.scrollHeight)
for (let i = 0; i < Math.ceil(height / 110); i++) {
  await page.mouse.wheel(0, 110)
  await page.waitForTimeout(8)
}
await page.waitForTimeout(400)

const afterScroll = await page.evaluate(() => ({ ...window.__gl, sizes: [...window.__gl.sizes] }))

const delta = (k) => afterScroll[k] - afterMount[k]
console.log('\nat mount   link=%d compile=%d bufferData=%d resize=%d',
  afterMount.link, afterMount.compile, afterMount.bufferData, afterMount.resize)
console.log('in scroll  link=%d compile=%d bufferData=%d resize=%d',
  delta('link'), delta('compile'), delta('bufferData'), delta('resize'))
console.log('sizes     ', afterScroll.sizes.join(' '))

await browser.close()
