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
import { useExperienceStore } from '@/store/experienceStore'

export default function App() {
  const setDeviceTier = useExperienceStore((s) => s.setDeviceTier)

  // Resolved once, before anything reads it: every scene sizes its buffers
  // from this at mount, and a tier that arrived a frame later would build the
  // whole page at the wrong budget and then rebuild it (§40).
  useEffect(() => {
    setDeviceTier(resolveDeviceTier())
  }, [setDeviceTier])

  useActiveSection()

  useEffect(() => {
    const lenis = new Lenis({
      // Measured rather than chosen by feel. At the 1.15 this started on, the
      // page coasted for 980ms after the wheel stopped and 27% of the travel
      // arrived with no input at all — and because every scrubbed timeline
      // then eases toward a position that is itself still easing, the two lags
      // compound and the sections appear to drift into place rather than track
      // the reader. At 0.7 the coast is 566ms and 18%, which still reads as
      // smooth scrolling but stays attached to the input. Section `scrub`
      // values are deliberately untouched; this is the shared half of the lag.
      duration: 0.7,
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

    // Debounced, because `resize` fires continuously while a window is being
    // dragged and each refresh remeasures every trigger on the page — a
    // hundred-millisecond job with this many pinned and sticky sections. The
    // old undebounced handler turned a resize into a stall per frame (§43).
    let resizeTimer = 0
    const handleResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 180)
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

      {/* One persistent WebGL surface behind everything (PAGE_STRUCTURE §14) */}
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

      {/* A sibling of <main>, not a child: the footer is a page-level landmark
          rather than part of section 08's argument. */}
      <SiteFooter />
    </>
  )
}
