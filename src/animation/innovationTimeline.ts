import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollProgress } from '@/store/progressRef'
import {
  coverScale as apertureCoverScale,
  seedScale as apertureSeedScale,
} from '@/sections/Innovation/aperture.geometry'

gsap.registerPlugin(ScrollTrigger)

interface HandoffEls {
  journey: HTMLElement
  aperture: HTMLElement
  disc: HTMLElement
  handoffVh: number
}

function originX(aperture: HTMLElement) {
  const declared = parseFloat(
    getComputedStyle(aperture).getPropertyValue('--aperture-x'),
  )
  return Number.isFinite(declared) ? declared / 100 : 0.5
}

export function buildHandoffTimeline(els: HandoffEls, reduced: boolean) {
  if (reduced) return

  const { journey, aperture, disc, handoffVh } = els

  const setHandoff = (v: number) => {
    scrollProgress.handoff = v
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: journey,
      start: () => `bottom bottom+=${(window.innerHeight * handoffVh) / 100}`,
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => setHandoff(self.progress),
      onLeave: () => setHandoff(1),
      onLeaveBack: () => setHandoff(0),
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(aperture, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0)

  tl.fromTo(
    disc,
    { scale: () => apertureSeedScale(window.innerWidth, window.innerHeight) },
    {
      scale: () =>
        apertureCoverScale(window.innerWidth, window.innerHeight, originX(aperture)),
      duration: 0.72,
      ease: 'power1.in',
    },
    0.1,
  )

  tl.set({}, {}, 1)

  return tl
}

export interface InnovationRefs {
  section: React.RefObject<HTMLElement | null>
  header: React.RefObject<HTMLDivElement | null>
  meta: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  copy: React.RefObject<HTMLDivElement | null>
  frame: React.RefObject<HTMLDivElement | null>
  reveal: React.RefObject<HTMLDivElement | null>
  annotations: React.RefObject<HTMLDivElement | null>
  principleRows: React.RefObject<(HTMLDivElement | null)[]>
  scaleStages: React.RefObject<(HTMLDivElement | null)[]>
}

export function buildInnovationTimeline(refs: InnovationRefs, reduced: boolean) {
  if (reduced) return

  const section = refs.section.current
  const header = refs.header.current
  if (!section || !header) return

  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  const headerTl = gsap.timeline({
    scrollTrigger: { trigger: header, start: 'top 85%', once: true },
  })

  if (refs.meta.current) {
    headerTl.fromTo(refs.meta.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
  }

  if (lines.length) {
    headerTl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
      0.08,
    )
  }

  if (refs.copy.current) {
    headerTl.fromTo(
      refs.copy.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
      0.5,
    )
  }

  const frame = refs.frame.current
  const reveal = refs.reveal.current

  const images = frame ? frame.querySelectorAll('.innovation-visual-img') : []
  const parallaxLayers = frame ? frame.querySelectorAll('.innovation-visual-parallax') : []

  if (frame && reveal && images.length) {
    const revealTl = gsap.timeline({
      scrollTrigger: { trigger: frame, start: 'top 82%', once: true },
    })

    revealTl
      .fromTo(
        reveal,
        { clipPath: 'circle(6% at 46% 51%)' },
        { clipPath: 'circle(78% at 46% 51%)', duration: 1.3, ease: 'power2.inOut' },
        0,
      )
      .fromTo(images, { scale: 1.16 }, { scale: 1, duration: 1.45, ease: 'power2.out' }, 0)

    if (refs.annotations.current) {
      revealTl.fromTo(
        refs.annotations.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7 },
        0.85,
      )
    }
  }

  const rows = (refs.principleRows.current ?? []).filter(Boolean) as HTMLDivElement[]
  if (rows.length) {
    const rules = rows.map((r) => r.querySelector('.innovation-principle-rule'))
    const texts = rows.map((r) => r.querySelector('.innovation-principle-text'))
    const numbers = rows.map((r) => r.querySelector('.innovation-principle-index'))

    gsap
      .timeline({ scrollTrigger: { trigger: rows[0], start: 'top 88%', once: true } })
      .fromTo(
        rules,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
        0,
      )
      .fromTo(numbers, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.12 }, 0.1)
      .fromTo(
        texts,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' },
        0.14,
      )
  }

  if (parallaxLayers.length) {
    gsap.fromTo(
      parallaxLayers,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: frame ?? section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      },
    )
  }

  if (refs.annotations.current) {
    gsap.to(refs.annotations.current, {
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'bottom bottom',
        end: 'bottom top+=40%',
        scrub: 0.8,
      },
    })
  }

  const stages = (refs.scaleStages.current ?? []).filter(Boolean) as HTMLDivElement[]
  if (stages.length) {
    let active = -1
    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const next = Math.min(stages.length - 1, Math.floor(self.progress * stages.length))
        if (next === active) return
        active = next
        stages.forEach((el, i) => el.classList.toggle('is-active', i === next))
      },
    })
  }

  return headerTl
}

export function buildSurfaceSwitch(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
  reduced: boolean,
) {
  const setSurface = (light: boolean) => {
    document.documentElement.dataset.surface = light ? 'light' : 'dark'
  }

  const header = ScrollTrigger.create({
    trigger: section,
    start: reduced ? 'top top' : 'top bottom+=22%',
    end: 'bottom bottom',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(false),
    onEnterBack: () => setCanvasActive(false),
    onLeaveBack: () => setCanvasActive(true),
  })

  return () => {
    header.kill()
    canvas.kill()
    setSurface(false)
    setCanvasActive(true)
  }
}
