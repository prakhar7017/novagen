import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CTA_ENTRANCE } from '@/sections/Cta/cta.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface CtaRefs {
  section: React.RefObject<HTMLElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  actions: React.RefObject<HTMLDivElement | null>
  brand: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  cell: React.RefObject<HTMLDivElement | null>
}

function buildFormation(refs: CtaRefs) {
  const section = refs.section.current
  if (!section) return

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    scrub: 0.55,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress.ctaForm = self.progress
    },
    onLeave: () => {
      scrollProgress.ctaForm = 1
    },
    onLeaveBack: () => {
      scrollProgress.ctaForm = 0
    },
  })

  if (refs.glow.current) {
    gsap.fromTo(
      refs.glow.current,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top+=40%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    )
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'bottom bottom',
    end: 'bottom top',
    scrub: 0.3,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress.ctaDepart = self.progress
    },
    onLeaveBack: () => {
      scrollProgress.ctaDepart = 0
    },
  })
}

function buildContent(refs: CtaRefs) {
  const section = refs.section.current
  if (!section) return

  const lines = (refs.headlineLines.current ?? []).filter(Boolean) as HTMLElement[]

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top bottom-=64%',
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(
      refs.label.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.7, ease: 'power2.out' },
      CTA_ENTRANCE.label,
    )
  }

  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105, filter: 'blur(3px)' },
      {
        yPercent: 0,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: CTA_ENTRANCE.headlineStagger,
        ease: 'power3.out',
      },
      CTA_ENTRANCE.headline,
    )
  }

  const fade = (el: HTMLElement | null, at: number) => {
    if (!el) return
    tl.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
      at,
    )
  }

  fade(refs.lead.current, CTA_ENTRANCE.lead)
  fade(refs.actions.current, CTA_ENTRANCE.actions)
  fade(refs.brand.current, CTA_ENTRANCE.brand)
}

function buildDrawnCell(refs: CtaRefs) {
  const cell = refs.cell.current
  if (!cell) return

  gsap.fromTo(
    cell,
    { opacity: 0, scale: 0.9 },
    {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: cell, start: 'top 88%', once: true },
    },
  )
}

export function buildCtaSurface(
  section: HTMLElement,
  setArmed: (armed: boolean) => void,
  setCanvasActive: (active: boolean) => void,
  releaseImpact: () => void,
  restoreImpact: () => void,
) {
  const arm = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=100%',
    end: 'bottom top',
    onEnter: () => setArmed(true),
    onEnterBack: () => setArmed(true),
    onLeaveBack: () => setArmed(false),
  })

  const release = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onEnter: releaseImpact,
    onLeaveBack: restoreImpact,
  })

  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(true),
    onEnterBack: () => setCanvasActive(true),
  })

  return () => {
    arm.kill()
    release.kill()
    canvas.kill()
    setArmed(false)
    scrollProgress.ctaForm = 0
    scrollProgress.ctaDepart = 0
  }
}

export function buildCtaTimeline(refs: CtaRefs, opts: { reduced: boolean; flowing: boolean }) {
  if (opts.reduced) return

  buildContent(refs)

  if (opts.flowing) buildDrawnCell(refs)
  else buildFormation(refs)
}

export function initClosingCta(el: HTMLElement | null, enabled: boolean) {
  if (!el || !enabled) return () => {}

  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    gsap.to(el, {
      x: (nx - 0.5) * 10,
      y: (ny - 0.5) * 6,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    })
    el.style.setProperty('--cta-hx', `${nx * 100}%`)
    el.style.setProperty('--cta-hy', `${ny * 100}%`)
  }

  const onLeave = () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
    el.style.setProperty('--cta-hx', '50%')
    el.style.setProperty('--cta-hy', '50%')
  }

  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    gsap.set(el, { x: 0, y: 0 })
  }
}
