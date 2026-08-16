import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Header from '@/components/Header/Header'
import Loader from '@/components/Loader/Loader'
import Hero from '@/sections/Hero/Hero'
import Journey from '@/sections/Journey/Journey'
import Innovation from '@/sections/Innovation/Innovation'
import Technology from '@/sections/Technology/Technology'
import Capabilities from '@/sections/Capabilities/Capabilities'
import Research from '@/sections/Research/Research'
import Impact from '@/sections/Impact/Impact'
import Cta from '@/sections/Cta/Cta'
import SiteFooter from '@/components/Footer/SiteFooter'
import ExperienceCanvas from '@/scene/ExperienceCanvas'
import { registerScroller } from '@/lib/scroller'
import { useActiveSection } from '@/hooks/useActiveSection'
import { resolveDeviceTier } from '@/lib/deviceTier'
import { invalidateViewportHeight } from '@/lib/viewport'
import { useExperienceStore } from '@/store/experienceStore'

export default function App() {
  const setDeviceTier = useExperienceStore((s) => s.setDeviceTier)

  useEffect(() => {
    setDeviceTier(resolveDeviceTier())
  }, [setDeviceTier])

  useActiveSection()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.7,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tickerCallback = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    const unregisterScroller = registerScroller(lenis)

    // iOS fires `resize` every time its URL bar collapses or expands under a
    // scroll gesture, even though nothing about the layout changed. A refresh
    // there re-measures the pinned hero and every viewport-derived start/end
    // mid-gesture, so section boundaries shift beneath the finger — the jump
    // you feel scrolling back up a phone. Only a width change means the layout
    // moved, so on touch devices that is the only thing we refresh for.
    ScrollTrigger.config({ ignoreMobileResize: true })

    const barOnlyResize = window.matchMedia('(pointer: coarse)').matches
    let lastWidth = window.innerWidth
    let resizeTimer = 0
    const handleResize = () => {
      const width = window.innerWidth
      if (barOnlyResize && width === lastWidth) return
      lastWidth = width
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        invalidateViewportHeight()
        ScrollTrigger.refresh()
      }, 180)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      unregisterScroller()
      gsap.ticker.remove(tickerCallback)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', handleResize)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <>
      <Loader />

      <ExperienceCanvas />

      <Header />

      <main id="main">
        <Hero />
        <Journey />
        <Innovation />
        <Technology />
        <Capabilities />
        <Research />
        <Impact />
        <Cta />
      </main>

      <SiteFooter />
    </>
  )
}
