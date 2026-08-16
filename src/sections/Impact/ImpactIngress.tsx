import { useMemo } from 'react'
import { buildIngressScatter } from './impact.diagram'
import type { DiagramPoint } from './impact.diagram'

interface Props {
  veilRef: React.RefObject<HTMLDivElement | null>
  signalsRef: React.RefObject<HTMLDivElement | null>
}

const COUNT = 150

function Scatter({ points, variant }: { points: DiagramPoint[]; variant: 'ink' | 'lit' }) {
  return (
    <>
      {points.map((p, i) => (
        <span
          key={i}
          className="impact-signal-dot"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${(1.4 + p.r * 1.5).toFixed(2)}px`,
            height: `${(1.4 + p.r * 1.5).toFixed(2)}px`,
            opacity: (variant === 'ink' ? 0.22 + p.strength * 0.78 : 0.3 + p.strength * 0.7).toFixed(
              3,
            ),
          }}
        />
      ))}
    </>
  )
}

export default function ImpactIngress({ veilRef, signalsRef }: Props) {
  const scatter = useMemo(() => buildIngressScatter(COUNT), [])

  return (
    <>
      <div
        ref={signalsRef}
        className="impact-signals impact-signals--lit"
        aria-hidden="true"
      >
        <Scatter points={scatter} variant="lit" />
      </div>

      <div ref={veilRef} className="impact-veil" aria-hidden="true">
        <span className="impact-veil-edge" />
        <div className="impact-signals impact-signals--ink">
          <Scatter points={scatter} variant="ink" />
        </div>
      </div>
    </>
  )
}
