/**
 * Descender / nav probe.
 *
 * Scrolls to a given normalised position inside #journey, then reports the
 * geometry of whichever copy block is currently revealed and crops a shot of
 * the copy column so the glyphs can be inspected directly.
 *
 *   node scripts/probe-clip.mjs --url http://localhost:5181 --w 1440 --h 900 --p 0.99
 */
import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

function findLocalChromium() {
  const root = join(homedir(), 'AppData/Local/ms-playwright')
  const builds = readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
  for (const b of builds) {
    const exe = join(root, b, 'chrome-win64/chrome.exe')
    if (existsSync(exe)) return exe
  }
  return undefined
}

const url = arg('url', 'http://localhost:5181')
const width = Number(arg('w', 1440))
const height = Number(arg('h', 900))
const p = Number(arg('p', 0.99))
const outDir = arg('out', 'screens/probe')

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: findLocalChromium(),
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width, height } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)

// Scroll to `p` through the journey's scroll range. Lenis intercepts wheel
// input but not programmatic scrollTo on window, which ScrollTrigger still
// observes, so drive the raw scroll position and let a few frames settle.
await page.evaluate((frac) => {
  const s = document.querySelector('#journey')
  if (!s) return
  const top = s.offsetTop
  const range = s.offsetHeight - window.innerHeight
  window.scrollTo(0, top + range * frac)
}, p)
await page.waitForTimeout(2500)

const out = await page.evaluate(() => {
  const rows = []
  const blocks = [
    ...document.querySelectorAll('.hero-headline'),
    ...document.querySelectorAll('.journey-copy'),
  ]
  for (const block of blocks) {
    const isJourney = block.classList.contains('journey-copy')
    const opacity = Number(getComputedStyle(block).opacity)
    if (isJourney && opacity < 0.5) continue
    const h = isJourney ? block.querySelector('.journey-headline') : block
    if (!h) continue
    const hs = getComputedStyle(h)
    for (const clip of h.querySelectorAll('.line-clip')) {
      const inner = clip.firstElementChild
      if (!inner) continue
      const cb = clip.getBoundingClientRect()
      const ib = inner.getBoundingClientRect()
      const cs = getComputedStyle(clip)
      rows.push({
        text: inner.textContent,
        opacity: opacity.toFixed(2),
        fontSize: hs.fontSize,
        lineHeight: hs.lineHeight,
        padBottom: cs.paddingBottom,
        // room between the inner line box bottom and the clipping (padding) edge
        slackPx: (cb.bottom - ib.bottom).toFixed(1),
        transform: getComputedStyle(inner).transform,
      })
    }
  }
  const ul = document.querySelector('.hero-nav-links')
  const compact = document.querySelector('.hero-nav-compact')
  return {
    scrollY: Math.round(window.scrollY),
    rows,
    navLinksDisplay: ul ? getComputedStyle(ul).display : null,
    navCompactDisplay: compact ? getComputedStyle(compact).display : null,
    docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    canvasCount: document.querySelectorAll('canvas').length,
  }
})

console.log(JSON.stringify({ width, height, p, ...out, errors }, null, 2))

const col = page.locator('.journey-copy-col')
if (await col.count()) {
  await col.first().screenshot({ path: join(outDir, `copy-${width}x${height}-p${p}.png`), timeout: 120000 })
}
await page.screenshot({ path: join(outDir, `full-${width}x${height}-p${p}.png`), timeout: 120000 })

await browser.close()
