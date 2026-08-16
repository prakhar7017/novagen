/**
 * Frame-health probe.
 *
 * Measures what the main thread is actually doing rather than what it looks
 * like it is doing: per-frame deltas from a rAF loop inside the page, long
 * tasks from PerformanceObserver, and React render counts from a dev-only
 * counter. Reports the loader window and a scripted full-page scroll
 * separately, because they starve for different reasons.
 *
 *   node scripts/probe-jank.mjs [--url ...] [--label baseline] [--gpu]
 */
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
        /* next */
      }
    }
  } catch {
    /* default */
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (f, d) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : d
}
const URL = argOf('--url', 'http://localhost:5180')
const LABEL = argOf('--label', 'run')

/** Installed before any app code runs, so the loader window is covered too. */
const RECORDER = `
  window.__frames = []
  window.__long = []
  window.__marks = {}
  let last = performance.now()
  const tick = (t) => {
    window.__frames.push(t - last)
    last = t
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long.push(Math.round(e.duration))
    }).observe({ entryTypes: ['longtask'] })
  } catch {}
  window.__slice = (from) => {
    const f = window.__frames.slice(from)
    const sorted = [...f].sort((a, b) => a - b)
    const at = (p) => Math.round(sorted[Math.floor(sorted.length * p)] ?? 0)
    return {
      n: f.length,
      median: at(0.5),
      p90: at(0.9),
      p99: at(0.99),
      worst: Math.round(sorted[sorted.length - 1] ?? 0),
      over50: f.filter((d) => d > 50).length,
      over100: f.filter((d) => d > 100).length,
    }
  }
`

const executablePath = await findLocalChromium()
// Software rasterisation is opt-in. Forcing SwiftShader makes every frame
// GPU-bound in a way no reader's machine is, which buries the costs that are
// actually worth finding; `--swiftshader` puts it back for a machine with no
// usable GPU.
const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath,
  args: GPU_ARGS,
})

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
await ctx.addInitScript(RECORDER)
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })

// ── Window 1: the loader ────────────────────────────────────────────────────
await page.waitForTimeout(2400)
const loader = await page.evaluate(() => window.__slice(0))
const mountMark = await page.evaluate(() => window.__frames.length)

// ── Window 2: a scripted scroll through the whole page ──────────────────────
// Driven by real wheel deltas rather than scrollTo, so Lenis, ScrollTrigger and
// every scrubbed timeline run the way they do for a reader.
await page.mouse.move(720, 450)
const height = await page.evaluate(() => document.documentElement.scrollHeight)
const steps = Math.ceil(height / 110)
for (let i = 0; i < steps; i++) {
  await page.mouse.wheel(0, 110)
  await page.waitForTimeout(8)
}
await page.waitForTimeout(400)

const scroll = await page.evaluate((from) => window.__slice(from), mountMark)
const longTasks = await page.evaluate(() => ({
  count: window.__long.length,
  total: window.__long.reduce((a, b) => a + b, 0),
  worst: Math.max(0, ...window.__long),
}))
const renders = await page.evaluate(() => window.__renders ?? null)

const fmt = (s) =>
  `n=${String(s.n).padStart(4)} med=${String(s.median).padStart(3)}ms ` +
  `p90=${String(s.p90).padStart(4)} p99=${String(s.p99).padStart(4)} ` +
  `worst=${String(s.worst).padStart(4)} >50ms=${String(s.over50).padStart(4)} >100ms=${s.over100}`

console.log(`\n── ${LABEL} ──`)
console.log(`loader  ${fmt(loader)}`)
console.log(`scroll  ${fmt(scroll)}`)
console.log(
  `longtasks count=${longTasks.count} total=${longTasks.total}ms worst=${longTasks.worst}ms`,
)
if (renders) console.log('renders', JSON.stringify(renders))
if (errors.length) console.log('errors', errors.slice(0, 3))

await browser.close()
