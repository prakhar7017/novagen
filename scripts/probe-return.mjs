/**
 * Scroll-return probe.
 *
 * Reproduces "scroll down to the Journey, scroll back to the top" and reports
 * whether the Hero restores to the same state it had on first paint.
 *
 *   node scripts/probe-return.mjs --url http://localhost:5181
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
const outDir = arg('out', 'screens/return')
mkdirSync(outDir, { recursive: true })

const SNAPSHOT = () => {
  const pick = (sel) => {
    const el = document.querySelector(sel)
    if (!el) return { sel, missing: true }
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      sel,
      opacity: +cs.opacity,
      filter: cs.filter,
      transform: cs.transform,
      top: Math.round(r.top),
      left: Math.round(r.left),
      w: Math.round(r.width),
      h: Math.round(r.height),
    }
  }
  return {
    scrollY: Math.round(window.scrollY),
    hero: window.__scrollProgress ? window.__scrollProgress.hero : null,
    journey: window.__scrollProgress ? window.__scrollProgress.journey : null,
    els: [
      pick('.hero-headline'),
      pick('.hero-headline .line-clip > span'),
      pick('.hero-body'),
      pick('[data-organism-wrap]'),
      pick('[data-organism-wrap] img'),
    ],
    // ScrollTrigger pin state
    pinSpacer: document.querySelectorAll('.pin-spacer').length,
    triggers: (window.ScrollTrigger?.getAll() ?? []).map((t) => ({
      id: t.vars.trigger?.id ?? t.trigger?.id ?? '?',
      progress: +t.progress.toFixed(4),
      start: Math.round(t.start),
      end: Math.round(t.end),
      pin: !!t.vars.pin,
      tlTime: t.animation ? +t.animation.time().toFixed(4) : null,
      tlDur: t.animation ? +t.animation.duration().toFixed(4) : null,
      tlProgress: t.animation ? +t.animation.progress().toFixed(4) : null,
    })),
    globalChildren: (window.gsap?.globalTimeline.getChildren(false, true, true) ?? []).map(
      (a) => ({
        kind: a.constructor?.name,
        time: +a.time().toFixed(3),
        dur: +a.duration().toFixed(3),
        prog: +a.progress().toFixed(3),
        paused: a.paused(),
        st: !!a.scrollTrigger,
        targets: (a.targets?.() ?? [])
          .map((t) => (t?.className || t?.tagName || typeof t))
          .slice(0, 2),
      }),
    ),
    tweensOnHeadline: (window.gsap?.getTweensOf(
      document.querySelector('.hero-headline .line-clip > span'),
    ) ?? []).map((tw) => ({
      to: JSON.stringify({ yPercent: tw.vars.yPercent, opacity: tw.vars.opacity }),
      startAt: JSON.stringify(tw.vars.startAt ?? null),
      immediateRender: tw.vars.immediateRender,
      startTime: +tw.startTime().toFixed(3),
      progress: +tw.progress().toFixed(3),
      initted: !!tw._initted,
      parentDur: tw.parent ? +tw.parent.duration().toFixed(3) : null,
      parentTime: tw.parent ? +tw.parent.time().toFixed(3) : null,
    })),
  }
}

// Software rasterisation is opt-in. Forcing SwiftShader makes every frame
// GPU-bound in a way no reader's machine is, which buries the costs that are
// actually worth finding; `--swiftshader` puts it back for a machine with no
// usable GPU.
const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath: findLocalChromium(),
  args: GPU_ARGS,
})
const page = await browser.newPage({
  viewport: { width: Number(arg('w', 1440)), height: Number(arg('h', 900)) },
})
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(`${e.message}\n${(e.stack ?? '').split('\n').slice(1, 6).join('\n')}`))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)

const before = await page.evaluate(SNAPSHOT)
await page.screenshot({ path: join(outDir, '1-initial.png'), timeout: 120000 })

// Scroll down into the Journey the way a user would, then all the way back.
async function lenisTo(y, immediate) {
  await page.evaluate(
    ([target, imm]) => {
      const l = window.__lenis
      if (l) l.scrollTo(target, { immediate: imm })
      else window.scrollTo(0, target)
    },
    [y, immediate],
  )
}

await lenisTo(3000, false)
await page.waitForTimeout(2500)
const atJourney = await page.evaluate(SNAPSHOT)
await page.screenshot({ path: join(outDir, '2-journey.png'), timeout: 120000 })

await lenisTo(0, false)
await page.waitForTimeout(4000)
const after = await page.evaluate(SNAPSHOT)
await page.screenshot({ path: join(outDir, '3-returned.png'), timeout: 120000 })

const summarise = (label, s) => {
  console.log(`\n=== ${label}  scrollY=${s.scrollY}  hero=${s.hero?.toFixed(4)}`)
  for (const e of s.els) {
    console.log(`  ${e.sel.padEnd(34)} op=${e.opacity} filter=${e.filter}  ${e.transform}`)
  }
  console.log('  tweens on the headline span:')
  for (const t of s.tweensOnHeadline) {
    console.log(
      `    to=${t.to} startAt=${t.startAt} imm=${t.immediateRender} ` +
        `st=${t.startTime} prog=${t.progress} initted=${t.initted} ` +
        `parent=${t.parentTime}/${t.parentDur}`,
    )
  }
}
summarise('BEFORE', before)
summarise('AT JOURNEY', atJourney)
summarise('AFTER', after)
if (errors.length) console.log('\nerrors:', errors)

await browser.close()
