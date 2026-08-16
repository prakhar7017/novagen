import { CONFIDENCE } from './impact.constants'

interface Props {
  rootRef: React.RefObject<SVGSVGElement | null>
  arcRef: React.RefObject<SVGCircleElement | null>
  complete?: boolean
}

const R = 46

export default function ConfidenceArc({ rootRef, arcRef, complete = false }: Props) {
  const circumference = 2 * Math.PI * R

  return (
    <svg
      ref={rootRef}
      className="impact-arc"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
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
