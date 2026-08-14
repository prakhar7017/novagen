import { useRef, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import { buildJourneyTimeline, type JourneyRefs } from '@/animation/journeyTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import JourneyCopy from './JourneyCopy'
import JourneyHUD from './JourneyHUD'
import JourneyStatic from './JourneyStatic'

/**
 * Section 02 — The Biological Journey.
 *
 * A tall scroll space holds a sticky full-viewport stage. The stage itself is
 * almost empty DOM: the visual transformation is drawn by the shared
 * ExperienceCanvas underneath, and this layer contributes only the story copy,
 * the step rail and the metadata.
 */
export default function Journey() {
  const reduced = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTabletPortrait = useMediaQuery('(max-width: 900px)')

  const section = useRef<HTMLElement>(null)
  const copy = useRef<(HTMLDivElement | null)[]>([])
  const lines = useRef<(HTMLSpanElement | null)[][]>([])
  const meta = useRef<(HTMLDivElement | null)[]>([])
  const steps = useRef<(HTMLDivElement | null)[]>([])

  const refs: JourneyRefs = useMemo(
    () => ({ section, copy, lines, meta, steps }),
    [],
  )

  useGSAP(() => buildJourneyTimeline(refs, reduced), {
    dependencies: [reduced],
    revertOnUpdate: true,
  })

  if (reduced) return <JourneyStatic />

  // Mobile keeps the sequence but spends far less scroll on it, so the user is
  // never held inside a long animation (prompt §40).
  const scrollLength = isMobile ? 300 : isTabletPortrait ? 360 : 460

  return (
    <section
      id="journey"
      ref={refs.section}
      className="journey"
      aria-label="The biological journey"
      style={{ height: `${scrollLength}vh` }}
    >
      <div className="journey-stage">
        {/* Background: darker and more technical than the Hero, per
            ASSET_MANIFEST §6 — faint grid, no large organic bokeh. */}
        <div className="journey-bg" aria-hidden="true" />
        <div className="journey-grid" aria-hidden="true" />
        {/* Keeps the left copy column legible over the full-bleed imagery */}
        <div className="journey-scrim" aria-hidden="true" />

        <JourneyCopy copyRef={refs.copy} linesRef={refs.lines} />
        <JourneyHUD metaRef={refs.meta} stepsRef={refs.steps} />
      </div>
    </section>
  )
}
