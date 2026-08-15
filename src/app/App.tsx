import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from '@/sections/Hero/Hero'
import Journey from '@/sections/Journey/Journey'
import Innovation from '@/sections/Innovation/Innovation'
import Technology from '@/sections/Technology/Technology'
import Capabilities from '@/sections/Capabilities/Capabilities'
import ExperienceCanvas from '@/scene/ExperienceCanvas'
import { registerScroller } from '@/lib/scroller'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })

    // Sync Lenis scroll events with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis via GSAP ticker (single rAF loop)
    const tickerCallback = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tickerCallback)
    gsap.ticker.lagSmoothing(0)

    // Dev-only handle so automated visual checks can jump to an exact scroll
    // position; Lenis owns scrolling, so window.scrollTo alone is unreliable.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
    }

    // Lenis owns the scroll position, so anything that wants to move the page —
    // the Technology pipeline's stage shortcuts, for now — has to go through it
    // rather than through window.scrollTo.
    const unregisterScroller = registerScroller(lenis)

    const handleResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)

    return () => {
      unregisterScroller()
      gsap.ticker.remove(tickerCallback)
      window.removeEventListener('resize', handleResize)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <>
      {/* One persistent WebGL surface behind everything (PAGE_STRUCTURE §14) */}
      <ExperienceCanvas />

      <main>
        <Hero />
        <Journey />
        <Innovation />
        <Technology />
        <Capabilities />
        {/* 06 Research onward mounts here */}
      </main>
    </>
  )
}
