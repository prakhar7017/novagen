/**
 * Reduced-motion verification.
 *
 * With prefers-reduced-motion: reduce the Journey must fall back to normal
 * document flow: no tall pinned stage, every state's copy readable at once,
 * no scroll-driven animation. Run with the dev server listening.
 *
 *   node scripts/probe-reduced.mjs --url http://localhost:5181
 */
import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { readdirSync, existsSync, mkdirSync } from 'node:fs'

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i === -1 ? d : process.argv[i + 1]
}

function findLocalChromium() {
  const root = join(homedir(), 'AppData/Local/ms-playwright')
  for (const b of readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))) {
    const exe = join(root, b, 'chrome-win64/chrome.exe')
    if (existsSync(exe)) return exe
  }
  return undefined
}

const url = arg('url', 'http://localhost:5181')
const outDir = arg('out', 'screens/reduced')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: findLocalChromium(),
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})

for (const vp of [
  { label: '1440x900', width: 1440, height: 900 },
  { label: '390x844', width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const info = await page.evaluate(() => {
    const j = document.querySelector('#journey')
    const headlines = [...document.querySelectorAll('#journey h2')].map((h) => ({
      text: h.textContent,
      opacity: getComputedStyle(h.closest('[class*="copy"], section, article') ?? h).opacity,
    }))
    // Anything sticky/pinned left over?
    const sticky = [...document.querySelectorAll('#journey *')].filter((el) => {
      const p = getComputedStyle(el).position
      return p === 'sticky' || p === 'fixed'
    }).length
    return {
      matchesReduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      journeyExists: !!j,
      journeyHeightPx: j ? j.offsetHeight : null,
      viewportH: window.innerHeight,
      heightInVh: j ? +(j.offsetHeight / window.innerHeight).toFixed(2) : null,
      stickyDescendants: sticky,
      headlineCount: headlines.length,
      headlines: headlines.map((h) => h.text),
      canvasCount: document.querySelectorAll('canvas').length,
      docHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      svgDiagrams: document.querySelectorAll('#journey svg').length,
    }
  })

  console.log(JSON.stringify({ vp: vp.label, ...info, errors }, null, 2))

  await page.screenshot({
    path: join(outDir, `reduced-${vp.label}-top.png`),
    timeout: 120000,
  })
  await page.evaluate(() => {
    const j = document.querySelector('#journey')
    if (j) window.scrollTo(0, j.offsetTop)
  })
  await page.waitForTimeout(800)
  await page.screenshot({
    path: join(outDir, `reduced-${vp.label}-journey.png`),
    timeout: 120000,
  })
  await ctx.close()
}

await browser.close()
