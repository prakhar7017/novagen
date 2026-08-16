/**
 * React commit counter.
 *
 * Installs a minimal DevTools hook before React boots and records every commit
 * with the component names that actually re-rendered in it. Unlike frame timing
 * this is deterministic — the same scroll produces the same counts on any
 * machine — so it is the right instrument for "is something re-rendering that
 * should not be".
 *
 *   node scripts/probe-renders.mjs [--url ...]
 */
import { chromium } from '@playwright/test'
import { readdir, access } from 'node:fs/promises'
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
        /* next */
      }
    }
  } catch {
    /* default */
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (f, d) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : d
}
const URL = argOf('--url', 'http://localhost:5180')

const HOOK = `
  window.__commits = 0
  window.__renders = {}
  window.__mark = () => ({ commits: window.__commits, renders: { ...(window.__rc || {}) } })

  const nameOf = (fiber) => {
    const t = fiber.type
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous'
    if (typeof t === 'object' && t) return t.displayName || t.name || null
    return null
  }

  // React only walks fibers it re-rendered, so a traversal of the committed
  // tree filtered on \`actualDuration\` would need a profiling build. The
  // alternation between current and alternate is enough here: a fiber that was
  // re-rendered in this commit has a lane recorded on it.
  const walk = (fiber, seen) => {
    while (fiber) {
      if (fiber.actualDuration !== undefined && fiber.actualDuration > 0) {
        const n = nameOf(fiber)
        if (n) seen.add(n)
      }
      if (fiber.child) walk(fiber.child, seen)
      fiber = fiber.sibling
    }
  }

  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: false,
    supportsFiber: true,
    renderers: new Map(),
    inject() { return 1 },
    onCommitFiberRoot(_id, root) {
      window.__commits++
      try {
        const seen = new Set()
        walk(root.current, seen)
        for (const n of seen) window.__renders[n] = (window.__renders[n] || 0) + 1
      } catch {}
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    on() {}, off() {}, sub() { return () => {} },
    checkDCE() {},
  }
`

const browser = await chromium.launch({
  executablePath: await findLocalChromium(),
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.addInitScript(HOOK)
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2800)

const atMount = await page.evaluate(() => window.__mark())

await page.mouse.move(720, 450)
const height = await page.evaluate(() => document.documentElement.scrollHeight)
for (let i = 0; i < Math.ceil(height / 110); i++) {
  await page.mouse.wheel(0, 110)
  await page.waitForTimeout(8)
}
await page.waitForTimeout(400)

const after = await page.evaluate(() => window.__mark())

console.log('\ncommits   mount=%d  scroll=%d', atMount.commits, after.commits - atMount.commits)
const rows = Object.keys(after.renders)
  .map((k) => [k, (after.renders[k] ?? 0) - (atMount.renders[k] ?? 0), atMount.renders[k] ?? 0])
  .filter(([, s, m]) => s + m > 0)
  .sort((a, b) => b[1] - a[1])
console.log('\n  scroll  mount  component')
for (const [name, s, m] of rows.slice(0, 30)) {
  console.log(String(s).padStart(8) + String(m).padStart(7) + '  ' + name)
}

await browser.close()
