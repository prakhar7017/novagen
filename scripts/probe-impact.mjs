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
      }
    }
  } catch {
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : dflt
}

const URL = argOf('--url', 'http://localhost:5180')
const OUT = argOf('--out', 'screens/imp')
const ONLY = argOf('--only', null)
const REDUCED = args.includes('--reduced')
const REVERSE = args.includes('--reverse')
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

const STATES = [
  ['14.8M', 0.2],
  ['72x', 0.46],
  ['91pct', 0.82],
  ['exit', 0.985],
]

await mkdir(OUT, { recursive: true })

const executablePath = await findLocalChromium()
console.log(`chromium: ${executablePath ?? '(playwright default)'}\n`)

const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath,
  args: GPU_ARGS,
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
    const s = document.getElementById('impact')
    if (!s) return null
    return {
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
      vh: window.innerHeight,
      flowing: s.classList.contains('impact--flow'),
    }
  })

  if (!geo) {
    console.log(`${vp.label.padEnd(10)} NO IMPACT SECTION`)
    await ctx.close()
    continue
  }

  const goto = async (y, settle = 800) => {
    await page.evaluate((target) => {
      const l = window.__lenis
      if (l) l.scrollTo(target, { immediate: true })
      else window.scrollTo(0, target)
    }, y)
    await page.waitForTimeout(settle)
  }

  await goto(geo.top - geo.vh * 1.15)
  await safeShot(page, join(dir, '00a-research.png'), `${vp.label}/research`)

  await goto(geo.top - geo.vh * 0.62)
  await safeShot(page, join(dir, '00b-detach.png'), `${vp.label}/detach`)

  await goto(geo.top - geo.vh * 0.2)
  await safeShot(page, join(dir, '00c-invert.png'), `${vp.label}/invert`)
  const surfaceAtHandoff = await page.evaluate(
    () => document.documentElement.dataset.surface,
  )

  const IN_VH = 36
  const STORY_VH = geo.height / geo.vh - 100 / 100 - IN_VH / 100
  const at = (p) => geo.top + geo.vh * (IN_VH / 100) + geo.vh * STORY_VH * p

  if (geo.flowing) {
    const anchors = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('.impact-metric--flow')]
      const human = document.querySelector('.impact-human')
      return {
        blocks: blocks.map((b) => b.getBoundingClientRect().top + window.scrollY),
        human: human ? human.getBoundingClientRect().top + window.scrollY : null,
      }
    })
    await goto(geo.top)
    await safeShot(page, join(dir, '01-header.png'), `${vp.label}/header`)
    for (let i = 0; i < anchors.blocks.length; i++) {
      await goto(Math.max(0, anchors.blocks[i] - geo.vh * 0.1), 1500)
      await safeShot(page, join(dir, `0${i + 2}-${STATES[i][0]}.png`), `${vp.label}/${i}`)
    }
    if (anchors.human != null) {
      await goto(Math.max(0, anchors.human - geo.vh * 0.14), 1400)
      await safeShot(page, join(dir, '05-human.png'), `${vp.label}/human`)
    }
  } else {
    await goto(geo.top)
    await safeShot(page, join(dir, '01-header.png'), `${vp.label}/header`)

    for (const [name, p] of STATES) {
      await goto(at(p), 1400)
      await safeShot(page, join(dir, `0${STATES.findIndex((s) => s[0] === name) + 2}-${name}.png`), `${vp.label}/${name}`)
    }

    if (REVERSE) {
      for (const [name, p] of [...STATES].reverse()) {
        await goto(at(p), 1400)
        await safeShot(page, join(dir, `rev-${name}.png`), `${vp.label}/rev-${name}`)
      }
      await goto(at(0.57), 1400)
      await safeShot(page, join(dir, 'rev-between.png'), `${vp.label}/between`)
    }
  }

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
    const s = document.getElementById('impact')
    const visible = [...document.querySelectorAll('.impact-metric')]
      .map((el, i) => ({ i, o: parseFloat(getComputedStyle(el).opacity) }))
      .filter((m) => m.o > 0.5)
      .map((m) => m.i)
    return {
      vh: Math.round((s.offsetHeight / window.innerHeight) * 100),
      px: s.offsetHeight,
      headline: fontOf('.impact-headline'),
      metric: fontOf('.impact-metric-figure'),
      desc: fontOf('.impact-metric-description'),
      metricBox: box('.impact-metrics') ?? box('.impact-metric--flow'),
      figureBox: box('.impact-metric-figure'),
      human: box('.impact-human-frame'),
      arc: box('.impact-arc'),
      visible,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      canvasInSection: document.querySelectorAll('#impact canvas').length,
      surface: document.documentElement.dataset.surface,
      progress: window.__scrollProgress
        ? {
            i: +window.__scrollProgress.impact.toFixed(3),
            e: +window.__scrollProgress.impactExit.toFixed(3),
          }
        : null,
      clipped: [...document.querySelectorAll('.impact .line-clip')].filter(
        (el) => el.scrollWidth > el.clientWidth + 1,
      ).length,
    }
  })

  console.log(
    `${vp.label.padEnd(10)} ${metrics.vh}vh (${metrics.px}px) ` +
      `h2=${metrics.headline} metric=${metrics.metric} desc=${metrics.desc} ` +
      `figure=${metrics.figureBox?.w}x${metrics.figureBox?.h} ` +
      `col=${metrics.metricBox?.w} human=${metrics.human?.w}x${metrics.human?.h} ` +
      `arc=${metrics.arc?.w} vis=[${metrics.visible}] ` +
      `surf@handoff=${surfaceAtHandoff} p=${JSON.stringify(metrics.progress)} ` +
      `errors=${errors.length}` +
      (metrics.overflowX ? '  << HORIZONTAL OVERFLOW' : '') +
      (metrics.clipped ? `  << ${metrics.clipped} CLIPPED LINES` : '') +
      (metrics.canvasInSection ? '  << CANVAS IN SECTION' : '') +
      (metrics.visible.length > 1 ? '  << MULTIPLE METRICS VISIBLE' : ''),
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
