import { useCallback, useMemo, useRef } from 'react'
import { buildNetwork, nearestCluster } from '../capabilities.geometry'
import { setOpacity, setText, setTransform } from '../attr'
import { useVisualDriver, type VisualFrame } from '../useVisualDriver'

interface Props {
  /** Node count — reduced on small screens (§45) */
  nodes: number
}

/** Frames between node-drift updates. */
const DRIFT_EVERY = 2

/**
 * 03 · AI Discovery — an irregular signal network that selects.
 *
 * The micro story is the site's story (§24): many weak relationships, one
 * cluster selected, a handful of high-confidence connections inside it, one
 * candidate emphasized. Which cluster is selected follows the pointer, so the
 * visitor performs the prioritisation rather than watching it.
 *
 * Selection is deliberately *not* a per-frame value. The active cluster is a
 * data attribute on the SVG and every brightening is a CSS transition off it,
 * which means changing selection costs one attribute write and the frame loop
 * only ever moves nodes.
 */
export default function NetworkVisual({ nodes }: Props) {
  const net = useMemo(() => buildNetwork(nodes), [nodes])

  const svgEl = useRef<SVGSVGElement>(null)
  const nodeEls = useRef<(SVGGElement | null)[]>([])
  const edgeEls = useRef<(SVGLineElement | null)[]>([])
  const labelEl = useRef<HTMLSpanElement>(null)
  const active = useRef(-1)
  const frameNo = useRef(0)

  const onFrame = useCallback(
    (f: VisualFrame) => {
      const { w, h } = f
      if (!w || !h) return

      // Below the threshold the network is unaddressed and nothing is selected
      // — the resting state §23 describes, where the whole field is weak.
      const next = f.focus > 0.22 ? nearestCluster(net.clusters, f.x / w, f.y / h) : -1

      if (next !== active.current) {
        active.current = next
        svgEl.current?.setAttribute('data-active', String(next))
        setText(labelEl.current, next < 0 ? '—' : `C-${String(next + 1).padStart(2, '0')}`)
      }

      // The drift is slow enough that halving its update rate is invisible, and
      // this is the one visual where the per-frame write count is worth halving.
      if (frameNo.current++ % DRIFT_EVERY) return

      net.nodes.forEach((n, i) => {
        const nx = n.x * w + Math.sin(f.time * 0.33 + n.phase) * 4.5
        const ny = n.y * h + Math.cos(f.time * 0.27 + n.phase * 1.3) * 3.8
        setTransform(nodeEls.current[i], nx, ny, 1)
      })

      // Edges follow their endpoints. Redrawing them is what keeps a
      // connection attached to the node it belongs to while both drift.
      net.edges.forEach((e, i) => {
        const el = edgeEls.current[i]
        if (!el) return
        const a = net.nodes[e.a]
        const b = net.nodes[e.b]
        setPoint(el, 'x1', a.x * w + Math.sin(f.time * 0.33 + a.phase) * 4.5)
        setPoint(el, 'y1', a.y * h + Math.cos(f.time * 0.27 + a.phase * 1.3) * 3.8)
        setPoint(el, 'x2', b.x * w + Math.sin(f.time * 0.33 + b.phase) * 4.5)
        setPoint(el, 'y2', b.y * h + Math.cos(f.time * 0.27 + b.phase * 1.3) * 3.8)
      })

      // A whole-field lift while the pointer is present, under the cluster
      // selection — the network noticing before it decides.
      setOpacity(svgEl.current, 0.86 + f.focus * 0.14)
    },
    [net],
  )

  const { rootRef, size } = useVisualDriver({ onFrame, amplitude: { x: 0.32, y: 0.26 } })

  return (
    <div ref={rootRef} className="cap-visual cap-visual--network">
      {size.w > 0 && (
        <svg
          ref={svgEl}
          className="cap-svg cap-network-svg"
          viewBox={`0 0 ${size.w} ${size.h}`}
          width={size.w}
          height={size.h}
          data-active="-1"
          aria-hidden="true"
        >
          <g className="cap-network-edges">
            {net.edges.map((e, i) => (
              <line
                key={`${e.a}-${e.b}`}
                ref={(el) => {
                  edgeEls.current[i] = el
                }}
                data-cluster={e.cluster}
                x1={net.nodes[e.a].x * size.w}
                y1={net.nodes[e.a].y * size.h}
                x2={net.nodes[e.b].x * size.w}
                y2={net.nodes[e.b].y * size.h}
              />
            ))}
          </g>

          <g className="cap-network-nodes">
            {net.nodes.map((n, i) => {
              const candidate = net.clusters.some((c) => c.candidate === i)
              return (
                <g
                  key={i}
                  ref={(el) => {
                    nodeEls.current[i] = el
                  }}
                  data-cluster={n.cluster}
                  className={candidate ? 'is-candidate' : undefined}
                >
                  {candidate && <circle className="cap-network-ring" r={9} />}
                  <circle className="cap-network-dot" r={n.r * 2.3} />
                </g>
              )
            })}
          </g>
        </svg>
      )}

      <div className="cap-readout cap-readout--network" aria-hidden="true">
        <span className="cap-readout-key">Cluster</span>
        <span className="cap-readout-val" ref={labelEl}>
          —
        </span>
      </div>
    </div>
  )
}

/**
 * Endpoint writes, cached per attribute on the element.
 *
 * A line has four coordinates that move independently, so the shared
 * setTransform guard does not apply; this is the same idea at attribute
 * granularity, with a full pixel of tolerance because a connection is drawn at
 * one-pixel width and cannot show less than that.
 */
function setPoint(el: SVGLineElement & { __pt?: Record<string, number> }, name: string, v: number) {
  const cache = (el.__pt ??= {})
  if (cache[name] !== undefined && Math.abs(cache[name] - v) < 0.6) return
  cache[name] = v
  el.setAttribute(name, v.toFixed(1))
}
