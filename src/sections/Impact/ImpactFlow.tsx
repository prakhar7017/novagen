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
