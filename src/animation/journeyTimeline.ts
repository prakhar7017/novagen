import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { JOURNEY_STATES } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface JourneyRefs {
  section: React.RefObject<HTMLElement | null>
  /** One wrapper per story state */
  copy: React.RefObject<(HTMLDivElement | null)[]>
  /** Headline lines, two per state */
  lines: React.RefObject<(HTMLSpanElement | null)[][]>
  /** Metadata block per state */
  meta: React.RefObject<(HTMLDivElement | null)[]>
  /** Step indicator entry per state */
  steps: React.RefObject<(HTMLDivElement | null)[]>
}

/**
 * The Journey's single scroll spine.
 *
 * One ScrollTrigger produces a normalized 0–1 progress for the whole section.
 * The stage is held in place by CSS `position: sticky` rather than a second
 * GSAP pin — with the Hero already pinning, stacking pin-spacers under Lenis
 * is where layout jumps come from, and sticky needs no spacer at all.
 *
 * Copy transitions live on a scrubbed timeline whose duration is exactly 1, so
 * a tween placed at t = 0.37 fires at journey progress 0.37 and the copy stays
 * locked to the WebGL milestones in journey.constants.
 */
export function buildJourneyTimeline(refs: JourneyRefs, reduced: boolean) {
  if (reduced) return

  const section = refs.section.current
  if (!section) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
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

    // Every state's `exit` sits exactly OUT before the next state's `enter`, so
    // one block has finished leaving before the next begins arriving. A longer
    // OUT overlaps two copy blocks and reads as ghosting.
    const IN = 0.022
    const OUT = 0.02
    const LINE_DUR = IN * 1.15
    const LINE_STAGGER = IN * 0.22
    /** Progress offset at which the last headline line reaches its rest position */
    const LINES_SETTLED = LINE_DUR + LINE_STAGGER

    const isLast = i === JOURNEY_STATES.length - 1

    if (copy) {
      tl.fromTo(
        copy,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: IN },
        state.enter,
      )
      // The final state has nothing to hand off to — it stays on screen.
      if (!isLast) tl.to(copy, { opacity: 0, y: -10, duration: OUT }, state.exit)
    }

    // Headline lines rise out of their clip boxes, matching the Hero's reveal
    if (lines.length) {
      tl.fromTo(
        lines,
        { yPercent: 108 },
        { yPercent: 0, duration: LINE_DUR, stagger: LINE_STAGGER },
        state.enter,
      )
    }

    // The body paragraph sits directly under the headline, and a line rising
    // from yPercent 108 travels through that space. Holding the body back until
    // the lines have landed is what keeps the two from overprinting.
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

  // Pin the timeline's duration to exactly 1.
  //
  // ScrollTrigger maps scroll 0→1 onto the timeline's *total* duration. Without
  // this anchor the duration is whatever the last tween happens to end at, so
  // every cue placed at position p would fire at a different scroll progress
  // than p — the whole story drifts out of register with the WebGL milestones.
  tl.set({}, {}, 1)

  return tl
}
