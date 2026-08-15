/**
 * Visual verification harness for Section 04 — Technology.
 *
 * Drives a real Chromium at each required viewport, jumps to exact pipeline
 * progress values, screenshots every stage plus the Innovation handoff, and
 * reports console errors and the layout facts the acceptance criteria care
 * about. Run with the dev server already listening.
 *
 *   node scripts/probe-technology.mjs [--url http://localhost:5180] [--out screens/tech]
 *                                     [--only 1440x900] [--reverse]
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
const OUT = argOf('--out', 'screens/tech')
const ONLY = argOf('--only', null)
const REVERSE = args.includes('--reverse')
const REDUCED = args.includes('--reduced')

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

/** Pipeline progress values worth inspecting — one per stage, plus the ends. */
const STOPS = [
  ['00-sample', 0.06],
  ['01-map', 0.28],
  ['02-interpret', 0.48],
  ['03-predict', 0.68],
  ['04-validate', 0.9],
  ['05-exit', 0.99],
]

/** Ingress positions, as a fraction of the ingress scroll window. */
const INGRESS_STOPS = [
  ['i0-approach', -0.55],
  ['i1-open', 0.3],
  ['i2-dark', 0.72],
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
  })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`UNCAUGHT: ${e.message}`))

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2500)

  const dir = join(OUT, vp.label + (REDUCED ? '-reduced' : ''))
  await mkdir(dir, { recursive: true })

  const geo = await page.evaluate(() => {
    const s = document.getElementById('technology')
    if (!s) return null
    return {
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
      vh: window.innerHeight,
      docHeight: document.body.scrollHeight,
    }
  })

  if (!geo) {
    console.log(`${vp.label.padEnd(10)} NO TECHNOLOGY SECTION`)
    await ctx.close()
    continue
  }

  // Mirrors technologyTimeline: the story starts 65% into the ingress and ends
  // when the section's bottom reaches the viewport's.
  const ingressPx = (geo.vh * 36) / 100
  const startY = geo.top + ingressPx * 0.65
  const endY = geo.top + geo.height - geo.vh
  const at = (p) => startY + (endY - startY) * p

  const goto = async (y, settle = 650) => {
    await page.evaluate((target) => {
      const l = window.__lenis
      if (l) l.scrollTo(target, { immediate: true })
      else window.scrollTo(0, target)
    }, y)
    await page.waitForTimeout(settle)
  }

  for (const [name, f] of INGRESS_STOPS) {
    await goto(geo.top + ingressPx * f)
    await safeShot(page, join(dir, `${name}.png`), `${vp.label}/${name}`)
  }

  const readings = []
  for (const [name, p] of STOPS) {
    await goto(at(p))
    await safeShot(page, join(dir, `${name}.png`), `${vp.label}/${name}`)
    readings.push(
      await page.evaluate(() => {
        const prog = window.__scrollProgress ?? {}
        const active = document.querySelector('.technology-pipeline-node.is-active')
        const copy = [...document.querySelectorAll('.technology-stage-copy')]
          .map((el, i) => [i, Number(getComputedStyle(el).opacity)])
          .filter(([, o]) => o > 0.5)
          .map(([i]) => i)
        return {
          tech: Number((prog.technology ?? 0).toFixed(3)),
          ingress: Number((prog.techIngress ?? 0).toFixed(2)),
          stage: active?.querySelector('.technology-pipeline-label')?.textContent ?? '-',
          visibleCopies: copy,
          fill: getComputedStyle(document.querySelector('.technology-pipeline') ?? document.body)
            .getPropertyValue('--tech-fill')
            .trim(),
        }
      }),
    )
  }

  if (REVERSE) {
    for (const [name, p] of [...STOPS].reverse()) {
      await goto(at(p), 500)
      await safeShot(page, join(dir, `rev-${name}.png`), `${vp.label}/rev-${name}`)
    }
  }

  const metrics = await page.evaluate(() => {
    const s = document.getElementById('technology')
    const h2 = document.querySelector('.technology-headline')
    const rail = document.querySelector('.technology-pipeline')
    const copy = document.querySelector('.technology-stage-copy')
    const meta = document.querySelector('.technology-meta')
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      }
    }
    return {
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      canvases: document.querySelectorAll('canvas').length,
      sectionVh: Math.round((s.offsetHeight / window.innerHeight) * 100),
      headlinePx: h2 ? Math.round(parseFloat(getComputedStyle(h2).fontSize)) : null,
      headline: box(h2),
      rail: box(rail),
      copy: box(copy),
      meta: box(meta),
      surface: document.documentElement.dataset.surface,
    }
  })

  console.log(
    `${vp.label.padEnd(10)} section=${metrics.sectionVh}vh headline=${metrics.headlinePx}px ` +
      `rail=${metrics.rail?.w}px canvases=${metrics.canvases} surface=${metrics.surface} ` +
      `errors=${errors.length}${metrics.overflowX ? '  << HORIZONTAL OVERFLOW' : ''}`,
  )
  console.log(
    `           headline=${JSON.stringify(metrics.headline)} copy=${JSON.stringify(metrics.copy)}`,
  )
  console.log(`           meta=${JSON.stringify(metrics.meta)} rail=${JSON.stringify(metrics.rail)}`)
  for (const r of readings) {
    console.log(
      `           p=${String(r.tech).padEnd(6)} ingress=${r.ingress} stage=${String(r.stage).padEnd(10)} copies=[${r.visibleCopies}] fill=${r.fill}`,
    )
  }
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
