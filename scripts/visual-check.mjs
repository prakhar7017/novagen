/**
 * Visual verification harness for the Biological Journey.
 *
 * Drives a real Chromium at each required viewport, jumps to exact journey
 * progress values, screenshots each biological state, and reports console
 * errors. Run with the dev server already listening.
 *
 *   node scripts/visual-check.mjs [--url http://localhost:5180] [--out dir]
 */
import { chromium } from '@playwright/test'
import { mkdir, readdir, access } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'

/**
 * Playwright pins one browser build; this machine has other builds already
 * downloaded. Reuse the newest local Chromium rather than pulling another
 * ~150MB, falling back to Playwright's own resolution if none is found.
 */
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
        /* try the next build */
      }
    }
  } catch {
    /* no local cache — let Playwright decide */
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : dflt
}

const URL = argOf('--url', 'http://localhost:5180')
const OUT = argOf('--out', 'screens')
const ONLY = argOf('--only', null) // viewport label filter

// Headless WebGL runs on SwiftShader here, so frames are ~10x slower than on a
// real GPU and the compositor needs a generous window to hand back a frame.
const SHOT_TIMEOUT = 90000

/**
 * A screenshot that fails is a harness problem, not a page problem: SwiftShader
 * occasionally cannot hand back a composited frame at the larger viewports.
 * Record it and keep sweeping rather than aborting the whole run.
 */
const missedShots = []
async function safeShot(page, path, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.screenshot({ timeout: SHOT_TIMEOUT, path })
      return true
    } catch (err) {
      if (attempt === 2) {
        missedShots.push(`${label}: ${err.name}`)
        return false
      }
      await page.waitForTimeout(1500)
    }
  }
}

const VIEWPORTS = [
  { label: '1600x1000', width: 1600, height: 1000 },
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '390x844', width: 390, height: 844 },
  { label: '360x800', width: 360, height: 800 },
]

/** Journey progress values worth inspecting — one per biological state. */
const STOPS = [
  ['00-organism', 0.04],
  ['01-destabilise', 0.2],
  ['02-cluster', 0.31],
  ['03-push', 0.44],
  ['04-nucleus', 0.52],
  ['05-particles', 0.62],
  ['06-signal', 0.75],
  ['07-network', 0.86],
  ['08-candidate', 0.99],
]

await mkdir(OUT, { recursive: true })

const executablePath = await findLocalChromium()
console.log(`chromium: ${executablePath ?? '(playwright default)'}\n`)

const browser = await chromium.launch({
  executablePath,
  // Headless Chromium needs SwiftShader to expose a WebGL context
  args: [
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--disable-lcd-text',
  ],
})
let totalErrors = 0

for (const vp of VIEWPORTS) {
  if (ONLY && vp.label !== ONLY) continue

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`UNCAUGHT: ${e.message}`))

  // Vite's HMR socket means the page never reaches networkidle
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Let fonts, textures and the entrance timeline settle
  await page.waitForTimeout(3500)

  const dir = join(OUT, vp.label)
  await mkdir(dir, { recursive: true })

  await safeShot(page, join(dir, 'hero.png'), `${vp.label}/hero`)

  // Measure the layout facts that the acceptance criteria care about
  const metrics = await page.evaluate(() => {
    const h1 = document.querySelector('.hero-headline')
    const green = h1?.querySelector('span[style*="bio-green"]')
    const clip = h1?.querySelector('.line-clip')
    return {
      docOverflowX: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      headlineWidth: h1 ? Math.round(h1.getBoundingClientRect().width) : null,
      // Does the widest headline line actually fit inside its clip box?
      lineScrollW: clip ? clip.scrollWidth : null,
      lineClientW: clip ? clip.clientWidth : null,
      greenWordRight: green ? Math.round(green.getBoundingClientRect().right) : null,
      canvasCount: document.querySelectorAll('canvas').length,
    }
  })

  // Walk the journey
  const journeyTop = await page.evaluate(() => {
    const s = document.getElementById('journey')
    return s ? s.getBoundingClientRect().top + window.scrollY : null
  })
  const journeyHeight = await page.evaluate(() => {
    const s = document.getElementById('journey')
    return s ? s.offsetHeight : null
  })

  if (journeyTop != null) {
    for (const [name, p] of STOPS) {
      await page.evaluate(
        ([top, height, prog]) => {
          const y = top + (height - window.innerHeight) * prog
          const l = window.__lenis
          if (l) l.scrollTo(y, { immediate: true })
          else window.scrollTo(0, y)
        },
        [journeyTop, journeyHeight, p],
      )
      await page.waitForTimeout(700)
      await safeShot(page, join(dir, `${name}.png`), `${vp.label}/${name}`)
    }

    // Reverse scrub — states must rebuild correctly going backward
    for (const [name, p] of [...STOPS].reverse().slice(0, 4)) {
      await page.evaluate(
        ([top, height, prog]) => {
          const y = top + (height - window.innerHeight) * prog
          const l = window.__lenis
          if (l) l.scrollTo(y, { immediate: true })
          else window.scrollTo(0, y)
        },
        [journeyTop, journeyHeight, p],
      )
      await page.waitForTimeout(500)
      await safeShot(page, join(dir, `rev-${name}.png`), `${vp.label}/rev-${name}`)
    }
  }

  const overflowFlag = metrics.docOverflowX ? '  << HORIZONTAL OVERFLOW' : ''
  const clipFlag =
    metrics.lineScrollW && metrics.lineClientW && metrics.lineScrollW > metrics.lineClientW + 1
      ? '  << HEADLINE CLIPPED'
      : ''

  console.log(
    `${vp.label.padEnd(10)} canvases=${metrics.canvasCount} ` +
      `headline=${metrics.headlineWidth}px line=${metrics.lineScrollW}/${metrics.lineClientW} ` +
      `greenRight=${metrics.greenWordRight} errors=${errors.length}` +
      overflowFlag +
      clipFlag,
  )
  for (const e of errors.slice(0, 6)) console.log(`    ! ${e}`)
  totalErrors += errors.length

  await ctx.close()
}

await browser.close()
console.log(`\nDone. Total console errors: ${totalErrors}`)
if (missedShots.length) {
  console.log(`Screenshots the compositor never returned (${missedShots.length}):`)
  for (const m of missedShots) console.log(`    - ${m}`)
}
