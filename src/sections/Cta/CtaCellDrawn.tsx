import { useMemo } from 'react'
import { CELL_RADIUS, buildCellPoints, cellPointAt } from './cta.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
}

const C = 100
const R = C * CELL_RADIUS

export default function CtaCellDrawn({ rootRef }: Props) {
  const points = useMemo(
    () =>
      buildCellPoints().map((p, i) => {
        const { x, y, z } = cellPointAt(p, 0)
        return {
          key: i,
          cx: C + x * R,
          cy: C - y * R,
          r: p.size * 1.15,
          opacity: 0.34 + 0.46 * (0.5 + 0.5 * (z / 0.34)),
        }
      }),
    [],
  )

  return (
    <div ref={rootRef} className="cta-cell" aria-hidden="true">
      <span className="cta-cell-glow" />

      <svg className="cta-cell-svg" viewBox="0 0 200 200" role="presentation">
        <circle className="cta-cell-membrane" cx={C} cy={C} r={R} />

        <circle
          className="cta-cell-filament"
          cx={C}
          cy={C}
          r={R * 0.5}
          pathLength={100}
          strokeDasharray="38 62"
          strokeDashoffset={14}
        />
        <circle
          className="cta-cell-filament"
          cx={C}
          cy={C}
          r={R * 0.74}
          pathLength={100}
          strokeDasharray="26 74"
          strokeDashoffset={62}
        />

        {points.map((p) => (
          <circle
            key={p.key}
            className="cta-cell-point"
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            opacity={p.opacity}
          />
        ))}
      </svg>

      <span className="cta-cell-core" />
    </div>
  )
}
