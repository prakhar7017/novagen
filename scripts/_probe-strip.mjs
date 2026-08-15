import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { homedir } from 'node:os'
const exe = join(homedir(),'AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe')
const browser = await chromium.launch({ executablePath: exe, args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] })
const page = await browser.newPage({ viewport:{width:1440,height:900}, reducedMotion:'reduce' })
await page.goto('http://localhost:5180',{waitUntil:'domcontentloaded'})
await page.waitForTimeout(2500)
const geo = await page.evaluate(()=>{const s=document.getElementById('technology');return {top:s.getBoundingClientRect().top+window.scrollY, vh:window.innerHeight}})
await page.evaluate((y)=>{ (window.__lenis)?window.__lenis.scrollTo(y,{immediate:true}):window.scrollTo(0,y) }, geo.top - geo.vh*0.36*0.55)
await page.waitForTimeout(600)
await page.waitForTimeout(1500)
await page.screenshot({path:'screens/_strip-a.png'})
await page.evaluate(()=>{ (window.__lenis)?window.__lenis.scrollTo(window.scrollY+2,{immediate:true}):null })
await page.waitForTimeout(1200)
await page.screenshot({path:'screens/_strip-b.png'})
console.log(await page.evaluate(()=>{
  const out=[]
  for (const y of [10,60,100,140,200,260]) {
    const el = document.elementFromPoint(700,y)
    const stack=[]
    let e=el
    while(e && stack.length<5){ stack.push(`${e.tagName}.${e.className?.toString().slice(0,40)}`); e=e.parentElement }
    const cs = el?getComputedStyle(el):null
    out.push({y, stack, bg: cs?.backgroundColor, bgi: cs?.backgroundImage?.slice(0,60)})
  }
  const inn=document.getElementById('innovation').getBoundingClientRect()
  const tech=document.getElementById('technology').getBoundingClientRect()
  return JSON.stringify({out, inn:{top:inn.top,bottom:inn.bottom}, tech:{top:tech.top}}, null, 1)
}))
await browser.close()
