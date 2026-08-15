import { useCallback, useMemo, useRef } from 'react'
import { buildStructurePoints } from '../capabilities.geometry'
import { PROTEIN_ALT, PROTEIN_SRC, PROTEIN_TILT } from '../capabilities.constants'
import { setOpacity, setTransform } from '../attr'
import { useVisualDriver, type VisualFrame } from '../useVisualDriver'

interface Props {
  /** Floating structural points — reduced on small screens (§45) */
  points: number
}

/**
 * 02 · Protein Engineering — the rendered structure, lightly instrumented.
 *
 * The asset does the science; everything added here is measurement around it.
 * §19 is specific about what must *not* happen: the card never tilts. The
 * transform is on the structure alone, capped at ±5° horizontally and ±2.6°
 * vertically, so the visitor perceives themselves moving around a specimen
 * rather than hovering a product card.
 *
 * Engagement is a class rather than a per-frame value: the separated region,
 * the glowing interior pathway and the fold-confidence readout all cross-fade
 * in CSS, which keeps the frame loop down to one transform and nine points.
 */
export default function ProteinVisual({ points }: Props) {
  const structure = useMemo(() => buildStructurePoints(points), [points])

  const stageEl = useRef<HTMLDivElement>(null)
  const pointEls = useRef<(SVGCircleElement | null)[]>([])
  const rimEl = useRef<SVGCircleElement>(null)
  const engaged = useRef(false)

  const onFrame = useCallback((f: VisualFrame) => {
    const { w, h } = f
    if (!w || !h) return

    // −1…1 from the module centre. Clamped, because a pointer that leaves via
    // a corner reports coordinates outside the box for one frame.
    const nx = Math.max(-1, Math.min(1, (f.x / w) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, (f.y / h) * 2 - 1))

    // Idle: a slow drift and a breath, both far below the pointer's authority,
    // so a resting module is alive but not animated at the reader.
    const driftY = Math.sin(f.time * 0.31) * 1.5
    const driftX = Math.sin(f.time * 0.24 + 2.1) * 0.7
    const breath = 1 + Math.sin(f.time * 0.55) * 0.012

    const ry = nx * PROTEIN_TILT.x * f.focus + driftY
    const rx = -ny * PROTEIN_TILT.y * f.focus + driftX

    const stage = stageEl.current
    if (stage) {
      stage.style.transform =
        `perspective(900px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${breath.toFixed(4)})`
    }

    structure.forEach((p, i) => {
      // Points orbit their own anchor by a couple of pixels — enough to read as
      // structural noise, never enough to look like a particle system.
      const px = p.x * w + Math.sin(f.time * 0.6 + p.phase) * 3.2
      const py = p.y * h + Math.cos(f.time * 0.47 + p.phase) * 2.6
      setTransform(pointEls.current[i], px, py, 1 + f.focus * 0.25)
      setOpacity(pointEls.current[i], 0.24 + 0.12 * Math.sin(f.time * 0.9 + p.phase) + f.focus * 0.5)
    })

    setOpacity(rimEl.current, 0.16 + f.focus * 0.34)

    // Hysteresis: without a gap between the thresholds, a pointer resting on
    // the boundary flickers the whole engaged state on and off.
    const root = stage?.parentElement
    if (root) {
      if (!engaged.current && f.focus > 0.38) {
        engaged.current = true
        root.classList.add('is-engaged')
      } else if (engaged.current && f.focus < 0.2) {
        engaged.current = false
        root.classList.remove('is-engaged')
      }
    }
  }, [structure])

  const { rootRef, size } = useVisualDriver({ onFrame, amplitude: { x: 0.22, y: 0.18 } })

  return (
    <div ref={rootRef} className="cap-visual cap-visual--protein">
      <div className="cap-protein-glow" aria-hidden="true" />

      <div ref={stageEl} className="cap-protein-stage">
        <img
          className="cap-protein-img"
          src={PROTEIN_SRC}
          alt={PROTEIN_ALT}
          loading="lazy"
          decoding="async"
        />

        {size.w > 0 && (
          <svg
            className="cap-svg"
            viewBox={`0 0 ${size.w} ${size.h}`}
            width={size.w}
            height={size.h}
            aria-hidden="true"
          >
            {/* Rim illumination — one ring, sized to the structure, not a halo
                around the whole module. */}
            <circle
              ref={rimEl}
              className="cap-protein-rim"
              cx={size.w * 0.5}
              cy={size.h * 0.5}
              r={Math.min(size.w, size.h) * 0.335}
              opacity={0.16}
            />

            {/* The selected region: a bracket over the active site that steps
                a few pixels clear of the structure while engaged. */}
            <g className="cap-protein-region">
              <circle
                cx={size.w * 0.545}
                cy={size.h * 0.47}
                r={Math.min(size.w, size.h) * 0.115}
                className="cap-protein-region-ring"
              />
              <path
                className="cap-protein-region-path"
                d={`M ${size.w * 0.545} ${size.h * 0.47}
                    C ${size.w * 0.50} ${size.h * 0.40},
                      ${size.w * 0.60} ${size.h * 0.37},
                      ${size.w * 0.63} ${size.h * 0.30}`}
              />
            </g>

            {/* Leader line to the confidence readout, drawn only while engaged */}
            <line
              className="cap-protein-lead"
              x1={size.w * 0.63}
              y1={size.h * 0.3}
              x2={size.w * 0.79}
              y2={size.h * 0.19}
            />

            <g className="cap-protein-points">
              {structure.map((p, i) => (
                <g
                  key={i}
                  ref={(el) => {
                    pointEls.current[i] = el as unknown as SVGCircleElement
                  }}
                >
                  <circle r={p.r * 2.2} />
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>

      {/* Fictional portfolio figure, and labelled as a model output rather than
          a company result (§20). */}
      <div className="cap-readout cap-readout--protein" aria-hidden="true">
        <span className="cap-readout-key">Fold confidence</span>
        <span className="cap-readout-val">94.2%</span>
      </div>
    </div>
  )
}
