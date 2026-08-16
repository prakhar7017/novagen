import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  IMPACT_METRICS,
  IMPACT_MILESTONE,
  IMPACT_SCROLL,
  impactArc,
  impactExit,
  impactStageIndex,
  type ImpactStageId,
} from '@/sections/Impact/impact.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface ImpactRefs {
  section: React.RefObject<HTMLElement | null>
  veil: React.RefObject<HTMLDivElement | null>
  signals: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  header: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  metrics: React.RefObject<(HTMLElement | null)[]>
  steps: React.RefObject<(HTMLElement | null)[]>
  arc: React.RefObject<SVGCircleElement | null>
  arcRoot: React.RefObject<SVGSVGElement | null>
  human: React.RefObject<HTMLDivElement | null>
  humanFrame: React.RefObject<HTMLDivElement | null>
}

const ingressPx = () => (window.innerHeight * IMPACT_SCROLL.ingressVh) / 100

const STORY_OVERLAP = 0.66

export const METRIC_ANCHOR = [0.2, 0.46, 0.82] as const

function buildIngress(refs: ImpactRefs) {
  const section = refs.section.current
  const veil = refs.veil.current
  if (!section || !veil) return

  const ink = veil.querySelector('.impact-signals--ink')
  const lit = refs.signals.current

  const scatters = [ink, lit].filter(Boolean) as HTMLElement[]

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    .fromTo(scatters, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.62 }, 0.24)

  const marker = document.querySelector('.research-footer-marker')
  if (marker) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom+=45%',
      end: 'top top',
      onToggle: ({ isActive }) => marker.classList.toggle('is-handoff', isActive),
    })
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `top top-=${ingressPx()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollProgress.impactIngress = self.progress
      },
      onLeave: () => {
        scrollProgress.impactIngress = 1
      },
      onLeaveBack: () => {
        scrollProgress.impactIngress = 0
      },
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(
    veil,
    { clipPath: 'inset(0% 0% 0% 0%)' },
    { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6, ease: 'power2.inOut' },
    0,
  )

  const edge = veil.querySelector('.impact-veil-edge')
  if (edge) {
    tl.fromTo(edge, { top: '0%' }, { top: '100%', duration: 0.6, ease: 'power2.inOut' }, 0)
      .fromTo(edge, { opacity: 0 }, { opacity: 0.7, duration: 0.16 }, 0.02)
      .to(edge, { opacity: 0, duration: 0.2 }, 0.62)
  }

  if (refs.glow.current) {
    tl.fromTo(refs.glow.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.4)
  }
  if (refs.grid.current) {
    tl.fromTo(refs.grid.current, { opacity: 0 }, { opacity: 1, duration: 0.36 }, 0.46)
  }

  tl.to(scatters, { scale: 1.14, opacity: 0, duration: 0.34, ease: 'power1.in' }, 0.62)

  tl.set({}, {}, 1)
}

function buildStory(refs: ImpactRefs, setStage: (stage: ImpactStageId | null) => void) {
  const section = refs.section.current
  if (!section) return

  const steps = () => (refs.steps.current ?? []).filter(Boolean) as HTMLElement[]
  const arc = refs.arc.current
  const circumference = arc ? 2 * Math.PI * arc.r.baseVal.value : 0

  let active = -1

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => `top top-=${ingressPx() * STORY_OVERLAP}`,
      end: 'bottom bottom',
      scrub: 0.55,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress
        scrollProgress.impact = p
        scrollProgress.impactExit = impactExit(p)

        if (arc) {
          arc.style.strokeDashoffset = String(circumference * (1 - impactArc(p)))
        }

        const i = impactStageIndex(p)
        if (i !== active) {
          active = i
          setStage(IMPACT_METRICS[i].id)
          steps().forEach((el, k) => {
            el.classList.toggle('is-current', k === i)
            el.classList.toggle('is-past', k < i)
          })
        }
      },
      onLeave: () => {
        scrollProgress.impact = 1
        scrollProgress.impactExit = 1
      },
      onLeaveBack: () => {
        scrollProgress.impact = 0
        scrollProgress.impactExit = 0
      },
    },
    defaults: { ease: 'none' },
  })

  tl.to({}, { duration: 1 })

  const metrics = refs.metrics.current ?? []
  IMPACT_METRICS.forEach((metric, i) => {
    const el = metrics[i]
    if (!el) return

    const value = el.querySelector('.impact-metric-value')
    const body = el.querySelectorAll('.impact-metric-line')

    if (i === 0) {
      gsap.set(el, { opacity: 1 })
      gsap.set(value, { yPercent: 0 })
      gsap.set(body, { opacity: 1, y: 0 })
    } else {
      gsap.set(el, { opacity: 0 })
      gsap.set(value, { yPercent: 108 })
      gsap.set(body, { opacity: 0, y: 14 })

      tl.to(el, { opacity: 1, duration: 0.02 }, metric.enter - 0.02)
      tl.fromTo(
        value,
        { yPercent: 108 },
        { yPercent: 0, duration: 0.075, ease: 'power3.out' },
        metric.enter,
      )
      tl.fromTo(
        body,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.06, stagger: 0.012, ease: 'power2.out' },
        metric.enter + 0.018,
      )
    }

    if (metric.exit <= 1) {
      tl.to(value, { yPercent: -104, duration: 0.06, ease: 'power2.in' }, metric.exit - 0.06)
      tl.to(body, { opacity: 0, y: -12, duration: 0.05, ease: 'power2.in' }, metric.exit - 0.06)
      tl.to(el, { opacity: 0, duration: 0.01 }, metric.exit)
    }
  })

  if (refs.arcRoot.current) {
    const root = refs.arcRoot.current
    gsap.set(root, { opacity: 0 })
    tl.to(root, { opacity: 1, duration: 0.06 }, IMPACT_MILESTONE.arcStart - 0.04)
    tl.to(root, { opacity: 0, duration: 0.05 }, IMPACT_MILESTONE.exitStart)
  }

  if (refs.human.current && refs.humanFrame.current) {
    const root = refs.human.current
    const frame = refs.humanFrame.current
    gsap.set(root, { opacity: 0 })
    gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)', scale: 0.985 })

    tl.to(root, { opacity: 1, duration: 0.03 }, IMPACT_MILESTONE.humanIn - 0.02)
    tl.to(
      frame,
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.08, ease: 'power2.inOut' },
      IMPACT_MILESTONE.humanIn,
    )
    const copy = root.querySelectorAll('.impact-human-line, .impact-human-label')
    tl.fromTo(
      copy,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.05, stagger: 0.012, ease: 'power2.out' },
      IMPACT_MILESTONE.humanIn + 0.025,
    )
    tl.to(root, { opacity: 0, y: -14, duration: 0.05 }, IMPACT_MILESTONE.humanOut)
  }

  const metaBlocks = section.querySelectorAll('.impact-metric-meta')
  if (metaBlocks.length) {
    tl.to(metaBlocks, { opacity: 0, duration: 0.05 }, IMPACT_MILESTONE.exitStart)
  }

  const metricRoot = section.querySelector('.impact-metrics')
  if (metricRoot) {
    tl.to(metricRoot, { opacity: 0, y: -22, duration: 0.06 }, IMPACT_MILESTONE.exitStart - 0.02)
  }
  if (refs.header.current) {
    tl.to(
      refs.header.current,
      { opacity: 0, y: -18, duration: 0.06 },
      IMPACT_MILESTONE.exitStart - 0.02,
    )
  }
  const stepRoot = section.querySelector('.impact-steps')
  if (stepRoot) tl.to(stepRoot, { opacity: 0, duration: 0.06 }, IMPACT_MILESTONE.exitStart + 0.01)
  if (refs.grid.current) {
    tl.to(refs.grid.current, { opacity: 0, duration: 0.07 }, IMPACT_MILESTONE.exitStart)
  }
  if (refs.glow.current) {
    tl.to(refs.glow.current, { opacity: 0.55, duration: 0.07 }, IMPACT_MILESTONE.exitStart)
  }
}

function buildHeader(refs: ImpactRefs) {
  const root = refs.header.current
  if (!root) return

  const lines = (refs.headlineLines.current ?? []).filter(Boolean) as HTMLElement[]

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: refs.section.current ?? root,
      start: () => `top top-=${ingressPx() * 0.5}`,
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 106 },
      { yPercent: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.62, ease: 'power2.out' },
      0.32,
    )
  }
}

export function buildImpactSurface(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
  setStage: (stage: ImpactStageId | null) => void,
  flowing: boolean,
) {
  const setSurface = (light: boolean) => {
    document.documentElement.dataset.surface = light ? 'light' : 'dark'
  }

  const surface = ScrollTrigger.create({
    trigger: section,
    start: flowing ? 'top bottom-=1' : () => `top top+=${ingressPx() * 0.14}`,
    end: 'bottom bottom',
    onEnter: () => setSurface(false),
    onEnterBack: () => setSurface(false),
    onLeaveBack: () => setSurface(true),
  })

  const arm = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=100%',
    end: 'bottom top',
    onEnter: () => setStage('scale'),
    onEnterBack: () => setStage('scale'),
    onLeaveBack: () => setStage(null),
  })

  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(true),
    onEnterBack: () => setCanvasActive(true),
    onLeaveBack: () => setCanvasActive(false),
  })

  return () => {
    surface.kill()
    arm.kill()
    canvas.kill()
    setSurface(false)
    setStage(null)
  }
}

export function buildImpactTimeline(
  refs: ImpactRefs,
  setStage: (stage: ImpactStageId | null) => void,
  flowing: boolean,
) {
  if (flowing) return
  buildIngress(refs)
  buildHeader(refs)
  buildStory(refs, setStage)
}

export function buildImpactFlow(refs: ImpactRefs) {
  buildHeader(refs)

  const blocks = (refs.metrics.current ?? []).filter(Boolean) as HTMLElement[]
  blocks.forEach((block) => {
    const value = block.querySelector('.impact-metric-value')
    const body = block.querySelectorAll('.impact-metric-line')
    const visual = block.querySelector('.impact-flow-visual')

    const tl = gsap.timeline({
      scrollTrigger: { trigger: block, start: 'top 82%', once: true },
    })

    if (value) {
      tl.fromTo(value, { yPercent: 106 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, 0)
    }
    if (body.length) {
      tl.fromTo(
        body,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' },
        0.16,
      )
    }
    if (visual) {
      tl.fromTo(visual, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 0.1)
    }
  })

  const human = refs.human.current
  if (human && refs.humanFrame.current) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: human, start: 'top 84%', once: true },
    })
    tl.fromTo(
      refs.humanFrame.current,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power2.inOut' },
      0,
    )
    tl.fromTo(
      human.querySelectorAll('.impact-human-line, .impact-human-label'),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out' },
      0.3,
    )
  }
}
