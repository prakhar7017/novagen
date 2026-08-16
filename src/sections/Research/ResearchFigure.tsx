import { useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildFigureReveal } from '@/animation/researchTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import StudyBody from './StudyBody'
import { THIRD_STUDY } from './research.constants'
import {
  FIGURE_DESCRIPTION,
  FIGURE_ROWS,
  FIGURE_VIEWBOX,
  buildResearchFigure,
} from './research.figure'

/** Dots per state. Fewer on a phone, where the same cloud is a smudge (§27). */
const DENSITY = {
  desktop: [26, 22, 18],
  mobile: [16, 13, 11],
} as const

/**
 * Study 03 — the procedural research figure (§26–§29).
 *
 * §26 rules out a third photograph, and the reason is editorial rather than
 * technical: two microscopy fields and a third would make Research a gallery.
 * What the section needs at this point is the other half of the argument —
 * what is done with the observations — so the third study is a drawing of an
 * interpretation, and the only dark surface in the section.
 *
 * Everything is SVG. §50 rules out new WebGL here, and a canvas would buy
 * nothing: ~70 dots, three curves and a six-node graph, none of which move
 * after they arrive.
 */
export default function ResearchFigure() {
  const reduced = useReducedMotion()
  const compact = useMediaQuery('(max-width: 700px)')

  const root = useRef<HTMLElement>(null)

  const model = useMemo(
    () => buildResearchFigure(compact ? DENSITY.mobile : DENSITY.desktop),
    [compact],
  )

  useGSAP(
    () => {
      if (reduced) return
      if (root.current) buildFigureReveal(root.current)
    },
    // The model is a dependency because a resize across the mobile breakpoint
    // rebuilds the SVG: without this the timeline would hold references to
    // circles that are no longer in the document.
    { dependencies: [reduced, model], revertOnUpdate: true, scope: root },
  )

  const { width, height } = FIGURE_VIEWBOX

  return (
    <article ref={root} className="research-study research-study--figure">
      <div className="study-figure">
        <svg
          className="figure-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {model.states.map((state) => (
            <g key={state.id} className="figure-state">
              <text
                className="figure-state-label"
                x={state.cx}
                y={FIGURE_ROWS.stateLabel}
                textAnchor="middle"
              >
                {state.label}
              </text>

              {state.dots.map((dot, i) => (
                <circle
                  key={i}
                  className={`figure-dot${dot.shared ? ' is-shared' : ''}`}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.r}
                />
              ))}
            </g>
          ))}

          {/* The stems cross the divider rather than stopping at it: the
              convergence is one movement, and a gap here would read as three
              separate diagrams stacked. */}
          {model.states.map((state) => (
            <path key={state.id} className="figure-stem" d={state.stem} />
          ))}

          <text className="figure-shared-label" x={34} y={FIGURE_ROWS.divider + 4}>
            Shared signal
          </text>
          <line
            className="figure-divider"
            x1={168}
            y1={FIGURE_ROWS.divider}
            x2={width - 34}
            y2={FIGURE_ROWS.divider}
          />

          <g className="figure-cluster">
            {model.edges.map((edge, i) => (
              <line
                key={i}
                className="figure-edge"
                x1={model.nodes[edge.a].x}
                y1={model.nodes[edge.a].y}
                x2={model.nodes[edge.b].x}
                y2={model.nodes[edge.b].y}
              />
            ))}
            {model.nodes.map((node, i) => (
              <circle
                key={i}
                className={`figure-node${node.primary ? ' is-primary' : ''}`}
                cx={node.x}
                cy={node.y}
                r={node.r}
              />
            ))}
          </g>
        </svg>

        {/* The figure carries an argument the surrounding copy only summarises,
            so it gets a full textual equivalent rather than a label (§52). */}
        <p className="sr-only">{FIGURE_DESCRIPTION}</p>
      </div>

      <StudyBody study={THIRD_STUDY} />
    </article>
  )
}
