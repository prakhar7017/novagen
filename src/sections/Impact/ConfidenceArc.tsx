import { CONFIDENCE } from './impact.constants'

interface Props {
  rootRef: React.RefObject<SVGSVGElement | null>
  arcRef: React.RefObject<SVGCircleElement | null>
  /** Static presentation: the arc is drawn complete rather than swept (§49) */
  complete?: boolean
}

/** Authoring radius. The viewBox is square, so the arc scales with its box. */
const R = 46

/**
 * The confidence arc (§25).
 *
 * A single thin partial circle around the validated target — §25 rules out a
 * dashboard gauge, so there is no needle, no tick marks, no numeric readout on
 * the ring and no filled sector. What is left is one hairline track and one
 * hairline arc over it, which is the least a percentage can be drawn as.
 *
 * Its length is written per frame by the timeline from the same `impactArc`
 * the constants export, so the ring and the "91%" beside it are one value drawn
 * twice and cannot drift apart. Decorative: the figure it represents is stated
 * as text in the metric, which is what §50 requires.
 */
export default function ConfidenceArc({ rootRef, arcRef, complete = false }: Props) {
  const circumference = 2 * Math.PI * R

  return (
    <svg
      ref={rootRef}
      className="impact-arc"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      // Rotated so the arc starts at twelve o'clock and runs clockwise, which
      // is how an instrument reads — a ring that starts at three o'clock reads
      // as a loading spinner.
      style={complete ? undefined : { opacity: 0 }}
    >
      <circle className="impact-arc-track" cx="50" cy="50" r={R} />
      <circle
        ref={arcRef}
        className="impact-arc-active"
        cx="50"
        cy="50"
        r={R}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (complete ? 1 - CONFIDENCE : 1)}
      />
    </svg>
  )
}
