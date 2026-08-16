/**
 * Global experience verification harness.
 *
 * Walks the whole page rather than one section: loader, then each section
 * boundary, checking navigation state, the surface the header sits on,
 * horizontal overflow and console health at every required viewport.
 *
 *   node scripts/probe-global.mjs [--url ...] [--out screens/global]
 *        [--only 1440x900] [--reduced] [--menu] [--back]
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
        /* next build */
      }
    }
  } catch {
    /* fall through to the Playwright default */
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (f, d) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : d
}
const URL = argOf('--url', 'http://localhost:5180')
const OUT = argOf('--out', 'screens/global')
const ONLY = argOf('--only', null)
const REDUCED = args.includes('--reduced')
const MENU = args.includes('--menu')
const BACK = args.includes('--back')

const VIEWPORTS = [
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1600x1000', width: 1600, height: 1000 },
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '768x1024', width: 768, height: 1024, touch: true },
  { label: '430x932', width: 430, height: 932, touch: true },
  { label: '390x844', width: 390, height: 844, touch: true },
  { label: '375x812', width: 375, height: 812, touch: true },
  { label: '360x800', width: 360, height: 800, touch: true },
]

const SECTIONS = [
  'hero',
  'journey',
  'innovation',
  'technology',
  'capabilities',
  'research',
  'impact',
  'cta',
]

await mkdir(OUT, { recursive: true })
const executablePath = await findLocalChromium()
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

const shot = async (page, path) => {
  try {
    await page.screenshot({ path, timeout: 60000 })
  } catch {
    /* the compositor occasionally never returns one; not worth failing over */
  }
}

for (const vp of VIEWPORTS) {
  if (ONLY && vp.label !== ONLY) continue

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: REDUCED ? 'reduce' : 'no-preference',
    hasTouch: !!vp.touch,
    isMobile: !!vp.touch,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push('UNCAUGHT: ' + e.message))
  page.on('requestfailed', (r) => errors.push('REQFAIL ' + r.url()))

  const dir = join(OUT, vp.label + (REDUCED ? '-reduced' : ''))
  await mkdir(dir, { recursive: true })

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(340)
  await shot(page, join(dir, '00-loader.png'))
  await page.waitForTimeout(2600)

  const missing = await page.evaluate(
    (ids) => ids.filter((id) => !document.getElementById(id)),
    SECTIONS,
  )

  const notes = []
  for (const id of SECTIONS) {
    if (missing.includes(id)) continue
    await page.evaluate((sid) => {
      const el = document.getElementById(sid)
      const y = el.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.25
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
    }, id)
    await page.waitForTimeout(900)
    const state = await page.evaluate(() => {
      const h = document.querySelector('.site-header')
      const active = [...document.querySelectorAll('.site-nav-link[aria-current]')].map((a) =>
        a.textContent.trim(),
      )
      return {
        surface: document.documentElement.dataset.surface ?? '?',
        scrolled: h ? h.hasAttribute('data-scrolled') : null,
        active,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      }
    })
    notes.push(
      id +
        '[' +
        state.surface +
        (state.scrolled ? ',bar' : '') +
        ',' +
        (state.active.length ? state.active.join('+') : '-') +
        ']' +
        (state.overflowX ? ' OVERFLOW' : ''),
    )
    await shot(page, join(dir, SECTIONS.indexOf(id) + 1 + '-' + id + '.png'))
  }

  let menuNote = ''
  if (MENU && vp.width <= 768) {
    await page.evaluate(() => {
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
      else window.scrollTo(0, 0)
    })
    await page.waitForTimeout(500)
    const toggle = page.locator('.site-menu-toggle')
    if (await toggle.count()) {
      await toggle.click()
      await page.waitForTimeout(900)
      await shot(page, join(dir, '90-menu.png'))
      const read = () =>
        page.evaluate(() => ({
          expanded: document.querySelector('.site-menu-toggle').getAttribute('aria-expanded'),
          locked: document.documentElement.classList.contains('is-scroll-locked'),
          focus: document.activeElement.className || document.activeElement.tagName,
        }))
      const open = await read()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(800)
      const closed = await read()
      menuNote =
        ' menu[open=' +
        open.expanded +
        ' lock=' +
        open.locked +
        ' focus=' +
        open.focus +
        ' | esc open=' +
        closed.expanded +
        ' lock=' +
        closed.locked +
        ' focus=' +
        closed.focus +
        ']'
    } else {
      menuNote = ' menu[NO TOGGLE]'
    }
  }

  if (BACK) {
    for (const id of [...SECTIONS].reverse()) {
      if (missing.includes(id)) continue
      await page.evaluate((sid) => {
        const el = document.getElementById(sid)
        const y = el.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.25
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true })
        else window.scrollTo(0, y)
      }, id)
      await page.waitForTimeout(700)
      await shot(page, join(dir, 'back-' + id + '.png'))
    }
  }

  console.log(
    vp.label.padEnd(10) +
      ' ' +
      notes.join(' ') +
      menuNote +
      (missing.length ? '  << MISSING: ' + missing.join(',') : '') +
      '  errors=' +
      errors.length,
  )
  for (const e of errors.slice(0, 5)) console.log('    ! ' + e)
  totalErrors += errors.length
  await ctx.close()
}

await browser.close()
console.log('\nTotal console errors: ' + totalErrors)
