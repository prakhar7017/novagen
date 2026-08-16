import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { homedir } from 'node:os'

const exe = join(
  homedir(),
  'AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe',
)

// Software rasterisation is opt-in. Forcing SwiftShader makes every frame
// GPU-bound in a way no reader's machine is, which buries the costs that are
// actually worth finding; `--swiftshader` puts it back for a machine with no
// usable GPU.
const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath: exe,
  args: GPU_ARGS,
})

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[uncaught] ${e.message}`))

console.log('goto...')
await page.goto('http://localhost:5180', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)

const info = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  let gl = null
  let renderer = 'none'
  if (c) {
    gl = c.getContext('webgl2') || c.getContext('webgl')
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown'
    }
  }
  return {
    canvases: document.querySelectorAll('canvas').length,
    canvasSize: c ? `${c.width}x${c.height}` : null,
    hasGL: !!gl,
    renderer,
    contextLost: c && gl ? gl.isContextLost() : null,
    heroExists: !!document.getElementById('hero'),
    journeyExists: !!document.getElementById('journey'),
    journeyHeight: document.getElementById('journey')?.offsetHeight ?? null,
    bodyHeight: document.body.scrollHeight,
    headlineText: document.querySelector('.hero-headline')?.textContent ?? null,
  }
})
console.log(JSON.stringify(info, null, 2))

// Measure how long a single frame actually takes
const frameMs = await page.evaluate(
  () =>
    new Promise((res) => {
      const t0 = performance.now()
      let n = 0
      const tick = () => {
        n++
        if (n >= 10) res((performance.now() - t0) / 10)
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }),
)
console.log(`avg frame: ${frameMs.toFixed(1)} ms`)

console.log('\nconsole:')
for (const l of logs.slice(0, 25)) console.log(' ', l)

console.log('\nscreenshot with 120s timeout...')
try {
  await page.screenshot({ path: 'screens/_probe.png', timeout: 120000 })
  console.log('screenshot OK')
} catch (e) {
  console.log('screenshot FAILED:', e.message.split('\n')[0])
}

await browser.close()
