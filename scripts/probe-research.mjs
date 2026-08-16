/**
 * Visual verification harness for Section 06 — Research.
 *
 * Drives a real Chromium at each required viewport, walks the
 * Capabilities → Research handoff, screenshots each study, optionally sweeps
 * the lead study's pointer spotlight, and reports the layout facts the
 * acceptance criteria care about (section height in vh, image share of the
 * row, type sizes, overflow, console errors). Run with the dev server already
 * listening.
 *
 *   node scripts/probe-research.mjs [--url http://localhost:5180]
 *        [--out screens/res] [--only 1440x900] [--reduced] [--hover] [--touch]
 */
import { chromium } from '@playwright/test'
import { mkdir, readdir, access } from 'node:fs/promises'
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
const OUT = argOf('--out', 'screens/res')
const ONLY = argOf('--only', null)
const REDUCED = args.includes('--reduced')
const HOVER = args.includes('--hover')
const TOUCH = args.includes('--touch')

const SHOT_TIMEOUT = 90000
const missed = []

async function safeShot(page, path, label) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.screenshot({ timeout: SHOT_TIMEOUT, path })
      return true
    } catch (err) {
      if (attempt === 2) {
        missed.push(`${label}: ${err.name}`)
        return false
      }
      await page.waitForTimeout(1200)
    }
  }
}

const VIEWPORTS = [
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1600x1000', width: 1600, height: 1000 },
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '390x844', width: 390, height: 844 },
  { label: '360x800', width: 360, height: 800 },
]

await mkdir(OUT, { recursive: true })

const executablePath = await findLocalChromium()
console.log(`chromium: ${executablePath ?? '(playwright default)'}\n`)

const browser = await chromium.launch({
  executablePath,
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
    reducedMotion: REDUCED ? 'reduce' : 'no-preference',
    hasTouch: TOUCH,
    isMobile: TOUCH,
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`UNCAUGHT: ${e.message}`))

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2200)

  const dir = join(OUT, vp.label + (REDUCED ? '-reduced' : ''))
  await mkdir(dir, { recursive: true })

  const geo = await page.evaluate(() => {
    const s = document.getElementById('research')
    if (!s) return null
    return {
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
      vh: window.innerHeight,
    }
  })

  if (!geo) {
    console.log(`${vp.label.padEnd(10)} NO RESEARCH SECTION`)
    await ctx.close()
    continue
  }

  const goto = async (y, settle = 750) => {
    await page.evaluate((target) => {
      const l = window.__lenis
      if (l) l.scrollTo(target, { immediate: true })
      else window.scrollTo(0, target)
    }, y)
    await page.waitForTimeout(settle)
  }

  // ── The Capabilities → Research handoff, sampled where it happens ────────
  await goto(geo.top - geo.vh * 1.5)
  await safeShot(page, join(dir, '00a-modules.png'), `${vp.label}/modules`)

  await goto(geo.top - geo.vh * 1.05)
  await safeShot(page, join(dir, '00b-settle.png'), `${vp.label}/settle`)

  await goto(geo.top - geo.vh * 0.72)
  await safeShot(page, join(dir, '00c-rising.png'), `${vp.label}/rising`)

  await goto(geo.top - geo.vh * 0.42)
  await safeShot(page, join(dir, '00d-bone.png'), `${vp.label}/bone`)
  // The header's treatment has to have flipped by here: this is Bone under the
  // fixed header, and Bone type on Bone is invisible.
  const surfaceAtBone = await page.evaluate(() => document.documentElement.dataset.surface)

  // ── The section itself ───────────────────────────────────────────────────
  const anchors = await page.evaluate((top) => {
    const at = (sel) => {
      const el = document.querySelector(sel)
      return el ? el.getBoundingClientRect().top + window.scrollY : null
    }
    return {
      header: top,
      lead: at('.research-study--lead'),
      second: at('.research-study--second'),
      figure: at('.research-study--figure'),
      footer: at('.research-footer'),
    }
  }, geo.top)

  await goto(geo.top)
  await safeShot(page, join(dir, '01-header.png'), `${vp.label}/header`)

  for (const [name, y] of [
    ['02-study-01', anchors.lead],
    ['03-study-02', anchors.second],
    ['04-study-03', anchors.figure],
    ['05-footer', anchors.footer],
  ]) {
    if (y == null) continue
    // Centre each block rather than align its top edge: what matters is
    // whether the whole study composes, not where it starts. The settle is
    // generous because each study's entrance runs for about 1.1s and a shot
    // taken during it reports a half-drawn rule as a layout fault.
    await goto(Math.max(0, y - geo.vh * 0.16), 1600)
    await safeShot(page, join(dir, `${name}.png`), `${vp.label}/${name}`)
  }

  // Reverse pass — nothing may be left half-revealed going back up.
  await goto(geo.top - geo.vh * 0.5)
  await safeShot(page, join(dir, '06-reverse.png'), `${vp.label}/reverse`)

  // ── Spotlight sweep ──────────────────────────────────────────────────────
  if (HOVER && !REDUCED) {
    if (anchors.lead != null) await goto(anchors.lead - geo.vh * 0.16)
    const box = await page.evaluate(() => {
      const el = document.querySelector('.study-frame--lead')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    })
    if (box) {
      // Two positions on the readouts and one on bare biology: the region has
      // to work where there is nothing to activate as well.
      for (const [name, fx, fy] of [
        ['a', 0.62, 0.26],
        ['b', 0.44, 0.62],
        ['c', 0.8, 0.72],
      ]) {
        await page.mouse.move(box.x + box.w * fx, box.y + box.h * fy, { steps: 12 })
        await page.waitForTimeout(520)
        await safeShot(page, join(dir, `spot-${name}.png`), `${vp.label}/spot-${name}`)
      }
      // Fast exit — the state must not stick.
      await page.mouse.move(box.x - 240, box.y - 240, { steps: 2 })
      await page.waitForTimeout(600)
      await safeShot(page, join(dir, 'spot-off.png'), `${vp.label}/spot-off`)
    }
  }

  // ── Measurements ─────────────────────────────────────────────────────────
  const metrics = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height) }
    }
    const fontOf = (sel) => {
      const el = document.querySelector(sel)
      return el ? Math.round(parseFloat(getComputedStyle(el).fontSize)) : null
    }
    const s = document.getElementById('research')
    const row = box('.research-study--lead')
    const img = box('.study-frame--lead')
    return {
      vh: Math.round((s.offsetHeight / window.innerHeight) * 100),
      px: s.offsetHeight,
      headline: fontOf('.research-headline'),
      title: fontOf('.study-title'),
      summary: fontOf('.study-summary'),
      lead: box('.research-lead')?.w ?? null,
      leadImagePct: row && img ? Math.round((img.w / row.w) * 100) : null,
      leadImage: img,
      figure: box('.study-figure'),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      canvasInSection: document.querySelectorAll('#research canvas').length,
      surface: document.documentElement.dataset.surface,
      // Any title line wider than the clip box that hides its overflow
      clipped: [...document.querySelectorAll('.research .line-clip')].filter(
        (el) => el.scrollWidth > el.clientWidth + 1,
      ).length,
    }
  })

  console.log(
    `${vp.label.padEnd(10)} ${metrics.vh}vh (${metrics.px}px) ` +
      `h2=${metrics.headline} h3=${metrics.title} body=${metrics.summary} ` +
      `img=${metrics.leadImage?.w}x${metrics.leadImage?.h} (${metrics.leadImagePct}% of row) ` +
      `fig=${metrics.figure?.w}x${metrics.figure?.h} lead=${metrics.lead}px ` +
      `surface@bone=${surfaceAtBone} ` +
      `errors=${errors.length}` +
      (metrics.overflowX ? '  << HORIZONTAL OVERFLOW' : '') +
      (metrics.clipped ? `  << ${metrics.clipped} CLIPPED LINES` : '') +
      (metrics.canvasInSection ? '  << CANVAS IN SECTION' : ''),
  )
  for (const e of errors.slice(0, 6)) console.log(`    ! ${e}`)
  totalErrors += errors.length

  await ctx.close()
}

await browser.close()
console.log(`\nDone. Total console errors: ${totalErrors}`)
if (missed.length) {
  console.log(`Screenshots the compositor never returned (${missed.length}):`)
  for (const m of missed) console.log(`    - ${m}`)
}
