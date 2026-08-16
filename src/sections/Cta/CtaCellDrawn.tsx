import { useMemo } from 'react'
import { CELL_RADIUS, buildCellPoints, cellPointAt } from './cta.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
}

/** Half the viewBox. Every coordinate below is relative to this. */
const C = 100
const R = C * CELL_RADIUS

/**
 * The closing cell, drawn (§45, §50).
 *
 * Below 769px there is no shared canvas to inherit from — Impact is a flowing
 * document there and never draws a network, so there is no collapsed target to
 * hand over — and under reduced motion §50 asks for the resolved cell rendered
 * immediately rather than formed. Both cases want the same thing: the finished
 * state, statically.
 *
 * It is a projection of the WebGL cell rather than a picture of it. The
 * membrane radius, the two filament radii and every interior point come from
 * the same constants and the same `cellPointAt`, evaluated at t = 0, so a phone
 * and a desktop show one arrangement and not two drawings of a description.
 */
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
          // Depth reads as brightness, matching the shader: a point on the far
          // side of the membrane is behind something translucent.
          opacity: 0.34 + 0.46 * (0.5 + 0.5 * (z / 0.34)),
        }
      }),
    [],
  )

  return (
    <div ref={rootRef} className="cta-cell" aria-hidden="true">
      <span className="cta-cell-glow" />

      <svg className="cta-cell-svg" viewBox="0 0 200 200" role="presentation">
        {/* Membrane — one soft boundary, no second ring. */}
        <circle className="cta-cell-membrane" cx={C} cy={C} r={R} />

        {/* §22 — a few filaments, drawn as arcs so neither ever closes into a
            complete ring and starts reading as a diagram. */}
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
