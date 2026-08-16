/**
 * Paint-cost A/B.
 *
 * Runs the same scripted scroll several times in one browser session, each time
 * with a different CSS override switched on, and reports frame health for each.
 * Everything expensive on this page that is *not* WebGL is a compositing cost —
 * a blur, a blend mode, an SVG filter — and those are invisible to a JS
 * profiler, so the only way to attribute them is to take them away and measure
 * again. Same session for every variant, so machine load cancels out.
 *
 *   node scripts/probe-paint.mjs [--url ...] [--passes 1]
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
const URL = argOf('--url', 'http://localhost:4180')
const PASSES = Number(argOf('--passes', 1))
// Optional: confine the pass to one region of the page. A whole-page traversal
// takes minutes on a software rasteriser, and when the question is about one
// section that time buys nothing but noise from the other seven.
const FROM = argOf('--from', null)
const TO = argOf('--to', null)

const VARIANTS = [
  { label: 'baseline', css: '' },
  { label: 'no ingress panel', css: '.research-ingress{display:none!important}' },
  {
    label: 'no header surface',
    css: '.site-header{transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
  },
  { label: 'no capabilities grain', css: '.capabilities-grain{display:none!important}' },
]

const RECORDER = `
  window.__f = []
  window.__long = []
  let last = performance.now()
  const tick = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)) })
      .observe({ entryTypes: ['longtask'] })
  } catch {}
  window.__reset = () => { window.__f = []; window.__long = [] }
  window.__stats = () => {
    const s = [...window.__f].sort((a, b) => a - b)
    const at = (p) => Math.round(s[Math.floor(s.length * p)] ?? 0)
    return {
      n: s.length, med: at(0.5), p90: at(0.9), p99: at(0.99),
      over50: window.__f.filter((d) => d > 50).length,
      long: window.__long.length,
      longMs: window.__long.reduce((a, b) => a + b, 0),
    }
  }
`

const browser = await chromium.launch({
  executablePath: await findLocalChromium(),
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text'],
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.addInitScript(RECORDER)
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(3000)

const range = await page.evaluate(
  ([from, to]) => {
    const y = (id, edge) => {
      const el = document.getElementById(id)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return Math.round((edge === 'top' ? r.top : r.bottom) + window.scrollY)
    }
    return {
      start: from ? Math.max(0, y(from, 'top') - window.innerHeight) : 0,
      end: to ? y(to, 'bottom') : document.documentElement.scrollHeight,
    }
  },
  [FROM, TO],
)

const scrollPass = async () => {
  await page.evaluate((y) => {
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
  }, range.start)
  await page.waitForTimeout(700)
  await page.mouse.move(720, 450)
  await page.evaluate(() => window.__reset())
  const steps = Math.ceil((range.end - range.start) / 110)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 110)
    await page.waitForTimeout(8)
  }
  await page.waitForTimeout(300)
  return page.evaluate(() => window.__stats())
}

// One warm pass first, so no variant pays for the page's first traversal.
await scrollPass()

console.log('\nvariant              med   p90   p99  >50ms  longtasks')
for (let pass = 0; pass < PASSES; pass++) {
  for (const v of VARIANTS) {
    await page.evaluate((css) => {
      document.getElementById('__ab')?.remove()
      if (!css) return
      const s = document.createElement('style')
      s.id = '__ab'
      s.textContent = css
      document.head.appendChild(s)
    }, v.css)
    await page.waitForTimeout(300)
    const r = await scrollPass()
    console.log(
      v.label.padEnd(20) +
        String(r.med).padStart(4) +
        String(r.p90).padStart(6) +
        String(r.p99).padStart(6) +
        String(r.over50).padStart(7) +
        ('  ' + r.long + ' / ' + Math.round(r.longMs) + 'ms').padStart(16),
    )
  }
}

await browser.close()
