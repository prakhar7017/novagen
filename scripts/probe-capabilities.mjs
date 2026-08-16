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
const OUT = argOf('--out', 'screens/cap')
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

const MODULES = ['spatial', 'protein', 'ai', 'genomic']

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
    const s = document.getElementById('capabilities')
    if (!s) return null
    return {
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
      vh: window.innerHeight,
    }
  })

  if (!geo) {
    console.log(`${vp.label.padEnd(10)} NO CAPABILITIES SECTION`)
    await ctx.close()
    continue
  }

  const goto = async (y, settle = 700) => {
    await page.evaluate((target) => {
      const l = window.__lenis
      if (l) l.scrollTo(target, { immediate: true })
      else window.scrollTo(0, target)
    }, y)
    await page.waitForTimeout(settle)
  }

  await goto(geo.top - geo.vh * 1.4)
  await safeShot(page, join(dir, '00a-candidate.png'), `${vp.label}/candidate`)

  await goto(geo.top - geo.vh * 0.9)
  await safeShot(page, join(dir, '00b-handoff.png'), `${vp.label}/handoff`)

  await goto(geo.top - geo.vh * 0.62)
  await safeShot(page, join(dir, '00c-signal.png'), `${vp.label}/signal`)

  await goto(geo.top - geo.vh * 0.35)
  await safeShot(page, join(dir, '01-arrive.png'), `${vp.label}/arrive`)

  await goto(geo.top)
  await safeShot(page, join(dir, '02-header.png'), `${vp.label}/header`)

  await goto(geo.top + geo.height - geo.vh * 1.35)
  await safeShot(page, join(dir, '03-grid.png'), `${vp.label}/grid`)

  await goto(geo.top + geo.height - geo.vh)
  await safeShot(page, join(dir, '04-exit.png'), `${vp.label}/exit`)

  if (HOVER && !REDUCED) {
    for (const id of MODULES) {
      const box = await page.evaluate((sel) => {
        const el = document.querySelector(`.cap-module--${sel} .cap-visual`)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      }, id)
      if (!box) continue

      await page.evaluate((sel) => {
        const el = document.querySelector(`.cap-module--${sel}`)
        const r = el.getBoundingClientRect()
        const l = window.__lenis
        const target = window.scrollY + r.top - (window.innerHeight - r.height) / 2
        if (l) l.scrollTo(target, { immediate: true })
        else window.scrollTo(0, target)
      }, id)
      await page.waitForTimeout(700)

      const b = await page.evaluate((sel) => {
        const el = document.querySelector(`.cap-module--${sel} .cap-visual`)
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, w: r.width, h: r.height }
      }, id)

      for (const [name, fx, fy] of [
        ['a', 0.28, 0.4],
        ['b', 0.55, 0.6],
        ['c', 0.8, 0.35],
      ]) {
        await page.mouse.move(b.x + b.w * fx, b.y + b.h * fy, { steps: 12 })
        await page.waitForTimeout(520)
        await safeShot(page, join(dir, `hover-${id}-${name}.png`), `${vp.label}/hover-${id}`)
      }

      await page.mouse.move(b.x + 4, b.y + 4, { steps: 2 })
      await page.mouse.move(b.x - 220, b.y - 220, { steps: 2 })
      await page.waitForTimeout(700)
      await safeShot(page, join(dir, `hover-${id}-off.png`), `${vp.label}/off-${id}`)
    }
  }

  const metrics = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height) }
    }
    const s = document.getElementById('capabilities')
    const modules = [...document.querySelectorAll('.cap-module')].map((el) => {
      const r = el.getBoundingClientRect()
      const v = el.querySelector('.cap-visual')?.getBoundingClientRect()
      return {
        id: el.dataset.capability,
        w: Math.round(r.width),
        h: Math.round(r.height),
        visualPct: v ? Math.round((v.height / r.height) * 100) : null,
      }
    })
    const cs = getComputedStyle(document.querySelector('.capabilities-headline'))
    return {
      vh: Math.round((s.offsetHeight / window.innerHeight) * 100),
      grid: box('.capabilities-grid'),
      headline: Math.round(parseFloat(cs.fontSize)),
      lead: box('.capabilities-lead')?.w ?? null,
      modules,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      svgCount: document.querySelectorAll('.capabilities svg').length,
      canvasCount: document.querySelectorAll('.capabilities canvas').length,
      hoverCapable: matchMedia('(hover: hover) and (pointer: fine)').matches,
      netActive: document.querySelector('.cap-network-svg')?.dataset.active ?? 'n/a',
      locus: document.querySelector('.cap-readout--genomic .cap-readout-val')?.textContent,
      cells: document.querySelector('.cap-readout--spatial .cap-readout-val')?.textContent,
    }
  })

  totalErrors += errors.length

  console.log(
    `${vp.label.padEnd(10)} ${String(metrics.vh).padStart(3)}vh  ` +
      `grid ${String(metrics.grid?.w).padStart(4)}px  h2 ${String(metrics.headline).padStart(2)}px  ` +
      `lead ${String(metrics.lead).padStart(3)}px  ` +
      `overflow:${metrics.overflowX ? 'YES' : 'no'}  svg:${metrics.svgCount} canvas:${metrics.canvasCount}  ` +
      `hover:${metrics.hoverCapable ? 'y' : 'n'} net:${metrics.netActive} locus:${metrics.locus} cells:${metrics.cells}  ` +
      `errors:${errors.length}`,
  )
  console.log(
    '           ' +
      metrics.modules
        .map((m) => `${m.id} ${m.w}x${m.h} (vis ${m.visualPct}%)`)
        .join('  ·  '),
  )
  for (const e of errors.slice(0, 4)) console.log(`           ! ${e.slice(0, 150)}`)

  await ctx.close()
}

await browser.close()

if (missed.length) {
  console.log(`\nmissed screenshots: ${missed.length}`)
  for (const m of missed) console.log(`  ${m}`)
}
console.log(`\ntotal console errors: ${totalErrors}`)
