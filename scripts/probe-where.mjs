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
      }
    }
  } catch {
  }
  return undefined
}

const args = process.argv.slice(2)
const argOf = (f, d) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : d
}
const URL = argOf('--url', 'http://localhost:4180')

const RECORDER = `
  window.__s = []
  let last = performance.now()
  const tick = (t) => {
    window.__s.push([Math.round(window.scrollY), Math.round(t - last)])
    last = t
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  window.__reset = () => { window.__s = [] }
`

const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath: await findLocalChromium(),
  args: GPU_ARGS,
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await ctx.addInitScript(RECORDER)
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(3000)

const IDS = ['hero','journey','innovation','technology','capabilities','research','impact','cta']
const bounds = await page.evaluate((ids) =>
  ids.map((id) => {
    const el = document.getElementById(id)
    const r = el.getBoundingClientRect()
    return { id, top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY) }
  }), IDS)

await page.mouse.move(720, 450)
const height = await page.evaluate(() => document.documentElement.scrollHeight)
const steps = Math.ceil(height / 110)
await page.evaluate(() => window.__reset())

for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(8) }
await page.waitForTimeout(400)
const samples = await page.evaluate(() => window.__s)

const sectionAt = (y) => {
  const mid = y + 450
  for (const b of bounds) if (mid >= b.top && mid < b.bottom) return b.id
  return bounds[bounds.length - 1].id
}

const buckets = new Map(IDS.map((id) => [id, []]))
for (const [y, d] of samples) buckets.get(sectionAt(y))?.push(d)

console.log('\nsection        frames   med    p90   worst  >50ms  >100ms')
for (const id of IDS) {
  const f = buckets.get(id)
  if (!f.length) { console.log(id.padEnd(14) + '     — '); continue }
  const s = [...f].sort((a, b) => a - b)
  const at = (p) => s[Math.floor(s.length * p)] ?? 0
  console.log(
    id.padEnd(14) +
      String(f.length).padStart(6) +
      String(at(0.5)).padStart(6) +
      String(at(0.9)).padStart(7) +
      String(s[s.length - 1]).padStart(8) +
      String(f.filter((d) => d > 50).length).padStart(7) +
      String(f.filter((d) => d > 100).length).padStart(8),
  )
}

console.log('\nboundary                    frames   med   worst  >100ms')
for (let i = 1; i < bounds.length; i++) {
  const edge = bounds[i].top
  const f = samples.filter(([y]) => Math.abs(y + 450 - edge) < 500).map(([, d]) => d)
  if (!f.length) continue
  const s = [...f].sort((a, b) => a - b)
  console.log(
    (bounds[i - 1].id + ' → ' + bounds[i].id).padEnd(28) +
      String(f.length).padStart(6) +
      String(s[Math.floor(s.length / 2)]).padStart(6) +
      String(s[s.length - 1]).padStart(8) +
      String(f.filter((d) => d > 100).length).padStart(8),
  )
}

await browser.close()
