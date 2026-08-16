/**
 * Visual verification harness for Section 08 — Final CTA / Closing Vision.
 *
 * Drives a real Chromium at each required viewport, walks the Impact → CTA
 * handoff, samples the four frames §58 names (Impact ending, transition
 * midpoint, resolved CTA, footer), scrubs backward, and reports the layout facts
 * that decide whether the section passes: headline size and overflow, whether
 * the CTA is above the fold, cell diameter, footer height, whether the Impact
 * network was actually released, and console errors. Run with the dev server
 * already listening.
 *
 *   node scripts/probe-cta.mjs [--url http://localhost:5180]
 *        [--out screens/cta] [--only 1440x900] [--reduced] [--reverse]
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
const OUT = argOf('--out', 'screens/cta')
const ONLY = argOf('--only', null)
const REDUCED = args.includes('--reduced')
const REVERSE = args.includes('--reverse')
const TOUCH = args.includes('--touch')
const SHOT_TIMEOUT = 90000

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

/** Jump to an absolute scroll position through Lenis, then let it settle. */
async function goTo(page, y) {
  await page.evaluate((target) => {
    const l = window.__lenis
    if (l) l.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
  }, y)
  await page.waitForTimeout(650)
}

/** Everything worth knowing about the closing frame, measured in the page. */
async function measure(page) {
  return page.evaluate(() => {
    const px = (n) => Math.round(n * 10) / 10
    const cta = document.getElementById('cta')
    const footer = document.querySelector('.site-footer')
    const headline = document.querySelector('.cta-headline')
    const action = document.querySelector('.cta-action')
    const lead = document.querySelector('.cta-lead')
    const label = document.querySelector('.cta-label')
    const brand = document.querySelector('.cta-brand')
    const drawn = document.querySelector('.cta-cell')

    const vis = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        top: px(r.top),
        bottom: px(r.bottom),
        left: px(r.left),
        right: px(r.right),
        opacity: px(Number(cs.opacity)),
        inView: r.top < innerHeight && r.bottom > 0,
        aboveFold: r.bottom <= innerHeight + 1 && r.top >= -1,
      }
    }

    // Two separate failures, and the second is the one that actually happens.
    // `lineOverflow` catches a line clipped by .line-clip's overflow:hidden;
    // `wrapped` catches an authored line the browser broke into two, which is
    // how "human" ends up alone on a line (§46) without overflowing anything.
    let lineOverflow = 0
    let widestLine = null
    let renderedLines = 0
    const wrapped = []
    for (const span of document.querySelectorAll('.cta-headline .line-clip > span')) {
      const over = span.scrollWidth - span.clientWidth
      if (over > lineOverflow) {
        lineOverflow = over
        widestLine = span.textContent
      }
      const rects = span.getClientRects().length
      renderedLines += rects
      if (rects > 1) wrapped.push(span.textContent)
    }

    const progress = window.__scrollProgress ?? {}
    const store = window.__experience?.getState?.() ?? {}

    return {
      scrollY: Math.round(scrollY),
      docHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,

      ctaVh: cta ? px((cta.offsetHeight / innerHeight) * 100) : null,
      footerPx: footer ? px(footer.offsetHeight) : null,

      headlineFontPx: headline ? px(parseFloat(getComputedStyle(headline).fontSize)) : null,
      headlineLines: document.querySelectorAll('.cta-headline .line-clip').length,
      headlineWidth: headline ? px(headline.getBoundingClientRect().width) : null,
      lineOverflow: px(lineOverflow),
      widestLine,
      renderedLines,
      wrapped,

      label: vis(label),
      headline: vis(headline),
      lead: vis(lead),
      action: vis(action),
      brand: vis(brand),
      drawnCell: drawn ? px(drawn.getBoundingClientRect().width) : null,

      // No scientific HUD may survive into this section (§28).
      hudLeaks: [...document.querySelectorAll('#cta *')]
        .map((el) => el.childElementCount === 0 && el.textContent?.trim())
        .filter((t) => t && /SIGNAL_|LOCUS|CONFIDENCE|CELL COUNT|\d{2,}%/.test(t)),

      progress: {
        impact: px(progress.impact ?? 0),
        impactExit: px(progress.impactExit ?? 0),
        ctaForm: px(progress.ctaForm ?? 0),
        ctaDepart: px(progress.ctaDepart ?? 0),
      },
      store: {
        currentSection: store.currentSection,
        canvasActive: store.canvasActive,
        impactStage: store.impactStage,
        ctaArmed: store.ctaArmed,
      },
    }
  })
}

const exe = await findLocalChromium()
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

await mkdir(OUT, { recursive: true })

const targets = ONLY ? VIEWPORTS.filter((v) => v.label === ONLY) : VIEWPORTS

for (const vp of targets) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: REDUCED ? 'reduce' : 'no-preference',
    hasTouch: TOUCH,
    isMobile: TOUCH,
  })
  const page = await context.newPage()

  const logs = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`)
  })
  page.on('pageerror', (e) => logs.push(`[uncaught] ${e.message}`))

  await page.goto(URL, { waitUntil: 'domcontentloaded' })
  // The Hero's pin-spacer is not created until the loader hands over, and it
  // adds a viewport to the document. Measuring anchors before that puts every
  // frame in this run a screen too high — and does it intermittently, which is
  // worse than doing it always.
  await page.waitForTimeout(6500)

  const suffix = REDUCED ? '-reduced' : ''
  const tag = `${vp.label}${suffix}`

  // Anchors are expressed relative to the closing section's own top and resolved
  // against the live layout rather than against a position captured once:
  // several sections above this one are pinned, and a pin-spacer created
  // mid-run moves every absolute figure underneath it.
  const ANCHORS = [
    // Impact's last resolved frame — 91%, before the collapse.
    ['impactEnd', -1.55],
    // The handoff: `impact` reaches 1 and `ctaForm` leaves 0 on the same frame.
    ['handoff', -1.0],
    ['middle', -0.5],
    ['resolved', 0],
  ]

  const seek = async (offsetVh) => {
    // Iterated rather than computed once: a jump of several thousand pixels can
    // itself change the layout underneath, and the second pass lands exactly.
    for (let i = 0; i < 3; i++) {
      const y = await page.evaluate((off) => {
        const cta = document.getElementById('cta')
        const max = document.documentElement.scrollHeight - innerHeight
        const target = cta.getBoundingClientRect().top + scrollY + off * innerHeight
        return Math.max(0, Math.min(max, target))
      }, offsetVh)
      await goTo(page, y)
    }
  }

  console.log(`
━━━ ${tag} ━━━`)

  const frames = []
  for (const [name, off] of ANCHORS) {
    await seek(off)
    const m = await measure(page)
    frames.push([name, m])
    await safeShot(page, join(OUT, `${tag}-${name}.png`), `${tag}/${name}`)
  }

  // The footer, at the very end of the document.
  await goTo(page, await page.evaluate(() => document.documentElement.scrollHeight))
  frames.push(['footer', await measure(page)])
  await safeShot(page, join(OUT, `${tag}-footer.png`), `${tag}/footer`)

  for (const [name, m] of frames) {
    console.log(
      `  ${name.padEnd(10)} y=${String(m.scrollY).padStart(6)}  ` +
        `form=${m.progress.ctaForm} depart=${m.progress.ctaDepart} impact=${m.progress.impact}  ` +
        `armed=${m.store.ctaArmed} impactStage=${m.store.impactStage} canvas=${m.store.canvasActive} ` +
        `sec=${m.store.currentSection}`,
    )
  }

  const resolved = frames.find(([n]) => n === 'resolved')[1]
  console.log(
    `  layout     section=${resolved.ctaVh}vh footer=${resolved.footerPx}px ` +
      `headline=${resolved.headlineFontPx}px authored=${resolved.headlineLines} ` +
      `rendered=${resolved.renderedLines} ` +
      `overflow(h)=${resolved.horizontalOverflow} overflow(line)=${resolved.lineOverflow}` +
      (resolved.wrapped.length ? `  WRAPPED ${JSON.stringify(resolved.wrapped)}` : ''),
  )
  console.log(
    `  fold       label=${resolved.label?.aboveFold} headline=${resolved.headline?.aboveFold} ` +
      `lead=${resolved.lead?.aboveFold} cta=${resolved.action?.aboveFold} ` +
      `brand=${resolved.brand?.aboveFold}` +
      (resolved.drawnCell ? `  drawnCell=${resolved.drawnCell}px` : ''),
  )
  if (resolved.hudLeaks.length) console.log(`  HUD LEAK   ${JSON.stringify(resolved.hudLeaks)}`)

  if (REVERSE) {
    await seek(-1.4)
    const back = await measure(page)
    console.log(
      `  reverse    form=${back.progress.ctaForm} impact=${back.progress.impact} ` +
        `impactStage=${back.store.impactStage} armed=${back.store.ctaArmed}`,
    )
  }

  if (logs.length) {
    console.log('  console:')
    for (const l of logs.slice(0, 8)) console.log(`    ${l}`)
  } else {
    console.log('  console:   clean')
  }

  await context.close()
}

if (missed.length) {
  console.log('\nmissed screenshots:')
  for (const m of missed) console.log(' ', m)
}

await browser.close()
