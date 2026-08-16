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
const URL = argOf('--url', 'http://localhost:5180')
const TOP = Number(argOf('--top', 24))

const GPU_ARGS = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--disable-lcd-text']
  : ['--disable-lcd-text']

const browser = await chromium.launch({
  executablePath: await findLocalChromium(),
  args: GPU_ARGS,
})
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(2600)

const cdp = await ctx.newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
await cdp.send('Profiler.start')

await page.mouse.move(720, 450)
const height = await page.evaluate(() => document.documentElement.scrollHeight)
for (let i = 0; i < Math.ceil(height / 110); i++) {
  await page.mouse.wheel(0, 110)
  await page.waitForTimeout(8)
}
await page.waitForTimeout(400)

const { profile } = await cdp.send('Profiler.stop')

const byId = new Map(profile.nodes.map((n) => [n.id, n]))
const self = new Map()
const total = profile.timeDeltas.reduce((a, b) => a + Math.max(0, b), 0)

for (let i = 0; i < profile.samples.length; i++) {
  const node = byId.get(profile.samples[i])
  if (!node) continue
  const dt = Math.max(0, profile.timeDeltas[i] ?? 0)
  const cf = node.callFrame
  const file = (cf.url || '').split('/').slice(-1)[0].split('?')[0]
  const key = (cf.functionName || '(anonymous)') + '  ' + (file || '(native)')
  self.set(key, (self.get(key) ?? 0) + dt)
}

const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP)
console.log(`\nprofiled ${Math.round(total / 1000)}ms of scrolling\n`)
for (const [name, us] of rows) {
  const ms = us / 1000
  const pct = ((us / total) * 100).toFixed(1)
  console.log(String(Math.round(ms)).padStart(6) + 'ms  ' + pct.padStart(5) + '%  ' + name)
}

await browser.close()
