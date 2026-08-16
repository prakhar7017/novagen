import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { JOURNEY_STATES } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface JourneyRefs {
  section: React.RefObject<HTMLElement | null>
  copy: React.RefObject<(HTMLDivElement | null)[]>
  lines: React.RefObject<(HTMLSpanElement | null)[][]>
  meta: React.RefObject<(HTMLDivElement | null)[]>
  steps: React.RefObject<(HTMLDivElement | null)[]>
}

export function buildJourneyTimeline(
  refs: JourneyRefs,
  reduced: boolean,
  handoffVh: number,
) {
  if (reduced) return

  const section = refs.section.current
  if (!section) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `bottom bottom+=${(window.innerHeight * handoffVh) / 100}`,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        scrollProgress.journey = self.progress
      },
    },
    defaults: { ease: 'none' },
  })

  JOURNEY_STATES.forEach((state, i) => {
    const copy = refs.copy.current?.[i]
    const lines = (refs.lines.current?.[i] ?? []).filter(Boolean) as HTMLSpanElement[]
    const meta = refs.meta.current?.[i]
    const step = refs.steps.current?.[i]

    const IN = 0.022
    const OUT = 0.02
    const LINE_DUR = IN * 1.15
    const LINE_STAGGER = IN * 0.22
    const LINES_SETTLED = LINE_DUR + LINE_STAGGER

    const isLast = i === JOURNEY_STATES.length - 1

    if (copy) {
      tl.fromTo(
        copy,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: IN },
        state.enter,
      )
      if (!isLast) tl.to(copy, { opacity: 0, y: -10, duration: OUT }, state.exit)
    }

    if (lines.length) {
      tl.fromTo(
        lines,
        { yPercent: 108 },
        { yPercent: 0, duration: LINE_DUR, stagger: LINE_STAGGER },
        state.enter,
      )
    }

    const bodyEl = copy?.querySelector('.journey-body')
    if (bodyEl) {
      tl.fromTo(
        bodyEl,
        { opacity: 0 },
        { opacity: 1, duration: IN * 0.6 },
        state.enter + LINES_SETTLED * 0.8,
      )
    }

    if (meta) {
      tl.fromTo(meta, { opacity: 0 }, { opacity: 1, duration: IN }, state.enter + 0.012)
      if (!isLast) tl.to(meta, { opacity: 0, duration: OUT }, state.exit)
    }

    if (step) {
      tl.to(step, { opacity: 1, color: 'var(--color-bio-green)', duration: IN }, state.enter)
      if (!isLast) {
        tl.to(
          step,
          { opacity: 0.32, color: 'var(--color-muted)', duration: OUT },
          state.exit,
        )
      }
    }
  })

  tl.set({}, {}, 1)

  return tl
}
