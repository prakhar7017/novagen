import { useMemo } from 'react'
import ConfidenceArc from './ConfidenceArc'
import HumanMoment from './HumanMoment'
import ImpactHeader from './ImpactHeader'
import { MetricBody } from './ImpactMetrics'
import { DIAGRAM_VIEWBOX, buildDiagramSet, type Diagram } from './impact.diagram'
import { IMPACT_DISCLOSURE, IMPACT_METRICS } from './impact.constants'
import type { ImpactRefs } from '@/animation/impactTimeline'
import type { ImpactDensity } from '@/scene/Impact/impactTargets'

interface Props {
  refs: ImpactRefs
  density: ImpactDensity
}

/**
 * One arrangement, drawn flat (§41, §42, §49).
 *
 * The same three states the pinned stage morphs between, projected from the
 * identical typed arrays — so a phone and a reduced-motion desktop see the same
 * science, at the same coordinates, with visibly less in each successive
 * diagram. §42 rules out three heavy independent scenes, and three static SVGs
 * built once from one target set are lighter than the canvas it suggests
 * instead.
 */
function FlowVisual({ diagram, arc }: { diagram: Diagram; arc?: React.ReactNode }) {
  return (
    <div className="impact-flow-visual">
      <svg
        viewBox={`0 0 ${DIAGRAM_VIEWBOX.width} ${DIAGRAM_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {diagram.signals.map((p, i) => (
          <circle
            key={`s${i}`}
            className="impact-flow-signal"
            cx={p.x}
            cy={p.y}
            r={p.r}
            opacity={0.12 + p.strength * 0.42}
          />
        ))}

        {diagram.edges.map((e, i) => (
          <line
            key={`e${i}`}
            className={`impact-flow-edge${e.strength > 0.74 ? ' is-active' : ''}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
          />
        ))}

        {diagram.nodes.map((p, i) => (
          <circle
            key={`n${i}`}
            className={`impact-flow-node${p.strength > 0.72 ? ' is-active' : ''}`}
            cx={p.x}
            cy={p.y}
            r={p.r}
          />
        ))}
      </svg>

      {arc}
    </div>
  )
}

/**
 * The flowing presentation (§41).
 *
 * §41 is explicit that a phone must not be handed a stacked copy of the 260vh
 * pinned sequence, so this is a different composition rather than the same one
 * reflowed: three metric blocks in normal document flow, each with its own
 * static diagram directly beneath its number, then the human moment and the
 * closing statement.
 *
 * It is also the reduced-motion presentation at every width (§49). All three
 * scientific states are present as static pictures and all three figures are
 * present as text, so nothing in this section is communicated only through
 * animation.
 */
export default function ImpactFlow({ refs, density }: Props) {
  const diagrams = useMemo(() => buildDiagramSet(density), [density])

  return (
    <div className="impact-inner impact-inner--flow">
      <ImpactHeader
        rootRef={refs.header}
        labelRef={refs.label}
        linesRef={refs.headlineLines}
        leadRef={refs.lead}
      />

      <ol className="impact-flow-metrics">
        {IMPACT_METRICS.map((metric, i) => (
          <li
            key={metric.id}
            ref={(el) => {
              if (refs.metrics.current) refs.metrics.current[i] = el
            }}
            className="impact-metric impact-metric--flow"
          >
            <MetricBody metric={metric} />

            <FlowVisual
              diagram={diagrams[i]}
              // The arc belongs to the validated state only, and here it is
              // simply drawn at its final length — §49 rules out sweeping it.
              arc={
                i === 2 ? (
                  <ConfidenceArc rootRef={refs.arcRoot} arcRef={refs.arc} complete />
                ) : undefined
              }
            />
          </li>
        ))}
      </ol>

      <HumanMoment rootRef={refs.human} frameRef={refs.humanFrame} loaded />

      <p className="impact-disclosure">{IMPACT_DISCLOSURE}</p>
    </div>
  )
}
