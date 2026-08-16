import { useCallback, useMemo, useRef } from 'react'
import { buildSpatialField } from '../capabilities.geometry'
import { SPATIAL_ALT, SPATIAL_RADIUS, SPATIAL_SRC } from '../capabilities.constants'
import { ease, setOpacity, setText, setTransform } from '../attr'
import { useVisualDriver, type VisualFrame } from '../useVisualDriver'

interface Props {
  markers: number
}

export default function SpatialVisual({ markers }: Props) {
  const field = useMemo(() => buildSpatialField(markers), [markers])

  const markerEls = useRef<(SVGGElement | null)[]>([])
  const coreEls = useRef<(SVGCircleElement | null)[]>([])
  const edgeEls = useRef<(SVGLineElement | null)[]>([])
  const scanEl = useRef<HTMLDivElement>(null)
  const countEl = useRef<HTMLSpanElement>(null)

  const activation = useRef<number[]>([])

  const onFrame = useCallback(
    (f: VisualFrame) => {
      const { w, h } = f
      if (!w || !h) return

      const act = activation.current
      act.length = field.markers.length

      const radius = SPATIAL_RADIUS
      let lit = 0

      field.markers.forEach((m, i) => {
        const mx = m.x * w
        const my = m.y * h
        const d = Math.hypot(mx - f.x, my - f.y)
        const near = ease(1 - d / radius) * f.focus
        act[i] = near

        const idle = 0.17 + 0.04 * Math.sin(f.time * 0.7 + m.phase)
        const a = idle + near * 0.82
        if (near > 0.25) lit++

        setOpacity(markerEls.current[i], a)
        setTransform(markerEls.current[i], mx, my, 1 + near * 0.55)
        setOpacity(coreEls.current[i], 0.25 + near * 0.75)
      })

      field.edges.forEach((e, i) => {
        const strength = Math.min(act[e.a], act[e.b]) * (1 - e.d * 0.45)
        setOpacity(edgeEls.current[i], strength * 0.72)
      })

      const scan = scanEl.current
      if (scan) {
        scan.style.transform = `translate3d(${(f.x - radius).toFixed(1)}px, ${(f.y - radius).toFixed(1)}px, 0)`
        scan.style.opacity = (f.focus * 0.85).toFixed(3)
      }

      setText(countEl.current, String(lit).padStart(2, '0'))
    },
    [field],
  )

  const { rootRef, size } = useVisualDriver({ onFrame, amplitude: { x: 0.28, y: 0.22 } })

  return (
    <div ref={rootRef} className="cap-visual cap-visual--spatial">
      <img
        className="cap-spatial-img"
        src={SPATIAL_SRC}
        alt={SPATIAL_ALT}
        loading="lazy"
        decoding="async"
      />

      <div className="cap-spatial-shade" aria-hidden="true" />

      <div
        ref={scanEl}
        className="cap-spatial-scan"
        aria-hidden="true"
        style={{ width: SPATIAL_RADIUS * 2, height: SPATIAL_RADIUS * 2, opacity: 0 }}
      />

      {size.w > 0 && (
        <svg
          className="cap-svg"
          viewBox={`0 0 ${size.w} ${size.h}`}
          width={size.w}
          height={size.h}
          aria-hidden="true"
        >
          <g className="cap-spatial-edges">
            {field.edges.map((e, i) => (
              <line
                key={`${e.a}-${e.b}`}
                ref={(el) => {
                  edgeEls.current[i] = el
                }}
                x1={field.markers[e.a].x * size.w}
                y1={field.markers[e.a].y * size.h}
                x2={field.markers[e.b].x * size.w}
                y2={field.markers[e.b].y * size.h}
                opacity={0}
              />
            ))}
          </g>

          <g className="cap-spatial-markers">
            {field.markers.map((m, i) => (
              <g
                key={i}
                ref={(el) => {
                  markerEls.current[i] = el
                }}
                opacity={0.1}
              >
                <circle className="cap-spatial-halo" r={m.r * 6.5} />
                <circle
                  className="cap-spatial-core"
                  ref={(el) => {
                    coreEls.current[i] = el
                  }}
                  r={m.r * 1.5}
                />
              </g>
            ))}
          </g>
        </svg>
      )}

      <div className="cap-readout cap-readout--spatial" aria-hidden="true">
        <span className="cap-readout-key">Cells in range</span>
        <span className="cap-readout-val" ref={countEl}>
          00
        </span>
      </div>
    </div>
  )
}
