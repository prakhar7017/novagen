import { useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  buildInnovationTimeline,
  buildSurfaceSwitch,
  type InnovationRefs,
} from '@/animation/innovationTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import InnovationHeader from './InnovationHeader'
import InnovationPrinciples from './InnovationPrinciples'
import InnovationScale from './InnovationScale'
import InnovationVisual from './InnovationVisual'

export default function Innovation() {
  const reduced = useReducedMotion()
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)

  const section = useRef<HTMLElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const meta = useRef<HTMLDivElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const copy = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const reveal = useRef<HTMLDivElement>(null)
  const annotations = useRef<HTMLDivElement>(null)
  const principleRows = useRef<(HTMLDivElement | null)[]>([])
  const scaleStages = useRef<(HTMLDivElement | null)[]>([])

  const refs: InnovationRefs = useMemo(
    () => ({
      section,
      header,
      meta,
      headlineLines,
      copy,
      frame,
      reveal,
      annotations,
      principleRows,
      scaleStages,
    }),
    [],
  )

  useGSAP(() => buildInnovationTimeline(refs, reduced), {
    dependencies: [reduced],
    revertOnUpdate: true,
  })

  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildSurfaceSwitch(el, setCanvasActive, reduced)
  }, [setCanvasActive, reduced])

  return (
    <section
      id="innovation"
      ref={section}
      className="innovation"
      aria-labelledby="innovation-title"
    >
      <div className="innovation-grain" aria-hidden="true" />
      <div className="innovation-grid" aria-hidden="true" />

      <div className="innovation-inner">
        <InnovationHeader rootRef={header} metaRef={meta} linesRef={headlineLines} />

        <div className="innovation-body">
          <div ref={copy} className="innovation-copy">
            <p className="innovation-eyebrow">Dynamic by design</p>

            <p className="innovation-lead">Living systems do not operate in isolation.</p>

            <p className="innovation-paragraph">
              Genes, proteins, cells and environments continuously influence one another.
              NOVA/GEN brings those layers together, allowing researchers to study biology
              as an evolving system rather than a collection of disconnected measurements.
            </p>

            <p className="innovation-paragraph">
              By combining spatial context, molecular signals and computational models, the
              platform helps reveal relationships that remain hidden when each layer is
              analyzed alone.
            </p>
          </div>

          <InnovationVisual
            frameRef={frame}
            revealRef={reveal}
            annotationsRef={annotations}
          />

          <InnovationPrinciples rowsRef={principleRows} />
        </div>

        <InnovationScale stagesRef={scaleStages} />
      </div>
    </section>
  )
}
