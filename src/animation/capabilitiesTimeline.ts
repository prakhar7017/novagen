import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CAPABILITIES } from '@/sections/Capabilities/capabilities.constants'
import { viewportHeight } from '@/lib/viewport'

gsap.registerPlugin(ScrollTrigger)

export interface CapabilitiesRefs {
  section: React.RefObject<HTMLElement | null>
  signal: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  modules: React.RefObject<(HTMLElement | null)[]>
  exit: React.RefObject<HTMLDivElement | null>
}

function buildHandoff(refs: CapabilitiesRefs) {
  const section = refs.section.current
  const signal = refs.signal.current
  if (!section || !signal) return

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top 18%',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    .fromTo(
      signal,
      { opacity: 0, xPercent: 30, yPercent: -34, scale: 0.32 },
      {
        opacity: 1,
        xPercent: -6,
        yPercent: 8,
        scale: 1,
        duration: 0.58,
        ease: 'power2.out',
      },
      0,
    )
    .to(signal, { opacity: 0, duration: 0.42, ease: 'power1.in' }, 0.58)
}

function buildEntrance(refs: CapabilitiesRefs) {
  const section = refs.section.current
  if (!section) return

  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 76%', once: true },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.74, stagger: 0.11, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.32,
    )
  }
}

function buildReveal(refs: CapabilitiesRefs) {
  const grid = refs.grid.current
  if (!grid) return

  const modules = (refs.modules.current ?? []).filter(
    (el): el is HTMLElement => !!el?.isConnected,
  )
  if (!modules.length) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: grid,
      start: 'top 92%',
      end: 'top 22%',
      scrub: 0.65,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })

  const DUR = 0.2
  const from: Record<string, gsap.TweenVars> = {
    spatial: { clipPath: 'inset(100% 0% 0% 0%)', y: 26 },
    protein: { clipPath: 'inset(0% 0% 0% 100%)', y: 0 },
    ai: { clipPath: 'inset(0% 0% 0% 0%)', opacity: 0, y: 18 },
    genomic: { clipPath: 'inset(0% 100% 0% 0%)', y: 0 },
  }

  CAPABILITIES.forEach((cap, i) => {
    const el = modules[i]
    if (!el) return
    tl.fromTo(
      el,
      { opacity: 0, ...from[cap.id] },
      {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: DUR,
        ease: 'power2.out',
      },
      cap.reveal,
    )
  })

  tl.set({}, {}, 1)
}

function buildExit(refs: CapabilitiesRefs) {
  const exit = refs.exit.current
  if (!exit) return

  gsap.timeline({ scrollTrigger: { trigger: exit, start: 'top 88%', once: true } }).fromTo(
    exit,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
  )
}

function buildSettle(refs: CapabilitiesRefs) {
  const section = refs.section.current
  const exit = refs.exit.current
  if (!section || !exit) return

  gsap.fromTo(
    section,
    { '--cap-settle': 0 },
    {
      '--cap-settle': 1,
      ease: 'none',
      scrollTrigger: {
        trigger: exit,
        start: 'top 72%',
        end: () => `+=${viewportHeight() * 0.9}`,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    },
  )
}

export function buildCapabilitiesSurface(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
) {
  const gate = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(false),
    onEnterBack: () => setCanvasActive(false),
    onLeaveBack: () => setCanvasActive(true),
  })

  return () => {
    gate.kill()
    setCanvasActive(true)
  }
}

export function buildCapabilitiesTimeline(refs: CapabilitiesRefs, reduced: boolean) {
  if (reduced) return
  buildHandoff(refs)
  buildEntrance(refs)
  buildReveal(refs)
  buildExit(refs)
  buildSettle(refs)
}
