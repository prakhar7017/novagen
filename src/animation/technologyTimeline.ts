import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  GRID_ALPHA,
  TECHNOLOGY_STAGES,
  TECH_MILESTONE,
  TECH_SCROLL,
  techMorph,
  techStageIndex,
  type TechnologyStageId,
} from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface TechnologyRefs {
  section: React.RefObject<HTMLElement | null>
  veil: React.RefObject<HTMLDivElement | null>
  plate: React.RefObject<HTMLDivElement | null>
  plateIn: React.RefObject<HTMLDivElement | null>
  shade: React.RefObject<HTMLDivElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  header: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  copies: React.RefObject<(HTMLElement | null)[]>
  metas: React.RefObject<(HTMLDivElement | null)[]>
  pipeline: React.RefObject<HTMLDivElement | null>
  stageNodes: React.RefObject<(HTMLElement | null)[]>
}

const ingressPx = () => (window.innerHeight * TECH_SCROLL.ingressVh) / 100

const STORY_OVERLAP = 0.65

export const STAGE_ANCHOR = [0.08, 0.28, 0.48, 0.68, 0.9] as const

function buildIngress(refs: TechnologyRefs) {
  const section = refs.section.current
  const plate = refs.plate.current
  const plateIn = refs.plateIn.current
  const veil = refs.veil.current
  if (!section || !plate || !plateIn || !veil) return

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    .fromTo(plateIn, { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0.25)

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `top top-=${ingressPx()}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollProgress.techIngress = self.progress
      },
      onLeave: () => {
        scrollProgress.techIngress = 1
      },
      onLeaveBack: () => {
        scrollProgress.techIngress = 0
      },
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(
    plate,
    { clipPath: 'inset(26% 33% 24% 33%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.48, ease: 'power1.inOut' },
    0,
  )

  if (refs.shade.current) {
    tl.fromTo(refs.shade.current, { opacity: 0 }, { opacity: 1, duration: 0.52 }, 0.06)
  }

  tl.fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 0.28 }, 0.38)

  if (refs.grid.current) {
    tl.fromTo(
      refs.grid.current,
      { opacity: 0 },
      { opacity: GRID_ALPHA.sample, duration: 0.34 },
      0.56,
    )
  }

  if (refs.glow.current) {
    tl.fromTo(refs.glow.current, { opacity: 0 }, { opacity: 1, duration: 0.34 }, 0.58)
  }

  tl.to(plate, { opacity: 0, duration: 0.32, ease: 'power1.in' }, 0.56)

  tl.set({}, {}, 1)
}

function buildStory(
  refs: TechnologyRefs,
  setStage: (stage: TechnologyStageId | null) => void,
) {
  const section = refs.section.current
  if (!section) return

  const nodes = () => (refs.stageNodes.current ?? []).filter(Boolean) as HTMLElement[]
  const pipeline = refs.pipeline.current

  let active = -1

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => `top top-=${ingressPx() * STORY_OVERLAP}`,
      end: 'bottom bottom',
      scrub: 0.7,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress
        scrollProgress.technology = p

        if (pipeline) pipeline.style.setProperty('--tech-fill', String(techMorph(p) / 4))

        const next = techStageIndex(p)
        if (next === active) return
        active = next
        setStage(TECHNOLOGY_STAGES[next].id)
        nodes().forEach((el, i) => {
          el.classList.toggle('is-active', i === next)
          el.classList.toggle('is-done', i < next)
          if (el.tagName === 'BUTTON') {
            el.setAttribute('aria-current', i === next ? 'step' : 'false')
          }
        })
      },
      onLeave: () => {
        scrollProgress.technology = 1
      },
      onLeaveBack: () => {
        scrollProgress.technology = 0
      },
    },
    defaults: { ease: 'none' },
  })

  TECHNOLOGY_STAGES.forEach((stage, i) => {
    const copy = refs.copies.current?.[i]
    const meta = refs.metas.current?.[i]
    const isLast = i === TECHNOLOGY_STAGES.length - 1

    const IN = 0.03
    const OUT = 0.026

    if (copy) {
      const lines = copy.querySelectorAll('.technology-stage-line')
      const body = copy.querySelector('.technology-stage-body')

      tl.fromTo(copy, { opacity: 0 }, { opacity: 1, duration: IN }, stage.enter)
      if (lines.length) {
        tl.fromTo(
          lines,
          { yPercent: 106 },
          { yPercent: 0, duration: IN * 1.2, stagger: IN * 0.25 },
          stage.enter,
        )
      }
      if (body) {
        tl.fromTo(body, { opacity: 0 }, { opacity: 1, duration: IN * 0.8 }, stage.enter + IN * 0.7)
      }
      if (!isLast) tl.to(copy, { opacity: 0, duration: OUT }, stage.exit)
    }

    if (meta) {
      tl.fromTo(meta, { opacity: 0 }, { opacity: 1, duration: IN }, stage.enter + 0.012)
      if (!isLast) tl.to(meta, { opacity: 0, duration: OUT }, stage.exit)
    }
  })

  if (refs.grid.current) {
    const grid = refs.grid.current
    tl.to(grid, { opacity: GRID_ALPHA.map, duration: 0.1 }, TECH_MILESTONE.mapStart)
      .to(grid, { opacity: GRID_ALPHA.interpret, duration: 0.1 }, TECH_MILESTONE.interpretStart)
      .to(grid, { opacity: GRID_ALPHA.predict, duration: 0.1 }, TECH_MILESTONE.predictStart)
      .to(grid, { opacity: GRID_ALPHA.validate, duration: 0.1 }, TECH_MILESTONE.validateStart)
  }

  if (pipeline) {
    tl.to(pipeline, { opacity: 0.12, duration: 0.05 }, TECH_MILESTONE.exitStart)
  }
  const lastMeta = refs.metas.current?.[TECHNOLOGY_STAGES.length - 1]
  if (lastMeta) tl.to(lastMeta, { opacity: 0.25, duration: 0.05 }, TECH_MILESTONE.exitStart)

  tl.set({}, {}, 1)
}

function buildEntrance(refs: TechnologyRefs) {
  const section = refs.section.current
  const header = refs.header.current
  if (!section || !header) return

  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: () => `top top-=${ingressPx() * 0.7}`,
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.72, stagger: 0.12, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.34,
    )
  }
  if (refs.pipeline.current) {
    tl.fromTo(refs.pipeline.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.42)
  }
}

export function buildTechnologySurface(
  section: HTMLElement,
  setCanvasActive: ((active: boolean) => void) | null,
  setStage: (stage: TechnologyStageId | null) => void,
  flowing: boolean,
) {
  const setSurface = (dark: boolean) => {
    document.documentElement.dataset.surface = dark ? 'dark' : 'light'
  }

  const surface = ScrollTrigger.create({
    trigger: section,
    start: flowing
      ? () => `top top-=${window.innerHeight * 0.12}`
      : () => `top top-=${ingressPx() * 0.42}`,
    end: 'bottom top',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

  const arm = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=60%',
    end: 'bottom top',
    onEnter: () => {
      setStage('sample')
      setCanvasActive?.(true)
    },
    onEnterBack: () => {
      setStage('sample')
      setCanvasActive?.(true)
    },
    onLeaveBack: () => {
      setStage(null)
      setCanvasActive?.(false)
    },
  })

  return () => {
    surface.kill()
    arm.kill()
    setSurface(false)
    setStage(null)
  }
}

export function buildTechnologyTimeline(
  refs: TechnologyRefs,
  setStage: (stage: TechnologyStageId | null) => void,
  reduced: boolean,
) {
  if (reduced) return
  buildIngress(refs)
  buildEntrance(refs)
  buildStory(refs, setStage)
}

export function buildTechnologyFlow(refs: TechnologyRefs, reduced: boolean) {
  const section = refs.section.current
  if (!section || reduced) return

  const blocks = (refs.copies.current ?? []).filter(Boolean) as HTMLElement[]

  blocks.forEach((block, i) => {
    gsap
      .timeline({ scrollTrigger: { trigger: block, start: 'top 82%', once: true } })
      .fromTo(block, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })

    const node = refs.stageNodes.current?.[i]
    if (!node) return
    ScrollTrigger.create({
      trigger: block,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => node.classList.toggle('is-active', self.isActive),
      onLeave: () => node.classList.add('is-done'),
      onEnterBack: () => node.classList.remove('is-done'),
    })
  })
}

export function scrollToStage(section: HTMLElement, index: number) {
  const top = section.getBoundingClientRect().top + window.scrollY
  const startY = top + ingressPx() * STORY_OVERLAP
  const endY = top + section.offsetHeight - window.innerHeight
  const target = STAGE_ANCHOR[index] ?? 0
  return startY + (endY - startY) * target
}
