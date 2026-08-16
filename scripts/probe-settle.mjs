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
const DURATIONS = argOf('--durations', '').split(',').filter(Boolean).map(Number)

const SAMPLER = `
  window.__rec = []
  window.__recOn = false
  const tick = () => {
    if (window.__recOn) window.__rec.push([Math.round(performance.now()), window.scrollY])
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  window.__start = () => { window.__rec = []; window.__recOn = true }
  window.__stop = () => { window.__recOn = false; return window.__rec }
`

const GPU_ARGS = args.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({ executablePath: await findLocalChromium(), args: GPU_ARGS })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.addInitScript(SAMPLER)
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(3000)
await page.mouse.move(720, 450)

const target = await page.evaluate(() => {
  const el = document.getElementById('technology')
  return Math.round(el.getBoundingClientRect().top + window.scrollY + 200)
})
while ((await page.evaluate(() => window.scrollY)) < target) {
  await page.mouse.wheel(0, 400)
  await page.waitForTimeout(6)
}
await page.waitForTimeout(2000)

async function burst(label) {
  await page.evaluate(() => window.__start())
  const t0 = Date.now()
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(10)
  }
  const inputEnd = Date.now() - t0
  await page.waitForTimeout(3000)
  const rec = await page.evaluate(() => window.__stop())

  const base = rec[0][0]
  const rel = rec.map(([t, y]) => [t - base, y])
  const final = rel[rel.length - 1][1]
  let settled = 0
  for (let i = rel.length - 1; i >= 0; i--) {
    if (Math.abs(rel[i][1] - final) > 0.5) {
      settled = rel[i][0]
      break
    }
  }
  const yStart = rel[0][1]
  const yAtInput = rel.find(([t]) => t >= inputEnd)?.[1] ?? yStart
  const travelled = final - yStart
  console.log(
    String(label).padEnd(9) +
      'coasts ' + String(Math.round(settled - inputEnd)).padStart(5) + 'ms after input' +
      ' | ' + String(Math.round(final - yAtInput)).padStart(4) + 'px (' +
      String(Math.round(((final - yAtInput) / travelled) * 100)).padStart(2) + '%) with no input' +
      ' | travelled ' + Math.round(travelled) + 'px',
  )
  await page.evaluate((t) => {
    if (window.__lenis) window.__lenis.scrollTo(t, { immediate: true })
    else window.scrollTo(0, t)
  }, target)
  await page.waitForTimeout(1200)
}

if (!DURATIONS.length) {
  await burst('current')
} else {
  for (const d of DURATIONS) {
    const ok = await page.evaluate((dd) => {
      if (!window.__lenis) return false
      window.__lenis.options.duration = dd
      return true
    }, d)
    if (!ok) {
      console.log('no __lenis handle on this build — sweep needs the dev server')
      break
    }
    await burst('d=' + d)
  }
}

await browser.close()
