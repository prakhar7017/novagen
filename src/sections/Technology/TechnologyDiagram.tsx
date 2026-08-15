import { FRAME, type TechTargets } from '@/scene/Technology/techTargets'
import {
  CANDIDATE_CONFIDENCE,
  CANDIDATE_SRC,
  SPECIMEN_ALT,
  SPECIMEN_SRC,
  WINNER,
  type TechnologyStageId,
} from './technology.constants'

/**
 * The drawn stage visuals.
 *
 * These are the same arrangements the WebGL platform morphs between — the same
 * builder, the same seed, the same cluster positions — projected flat and drawn
 * as SVG. That is why the flowing layout still tells one continuous story
 * rather than five unrelated pictures: the map really is the sample's interior,
 * and the network really does connect the mapped cells, because both are the
 * same numbers the shader reads.
 *
 * Used below 769px and under reduced motion, where a pinned scrub is either
 * unwelcome or unavailable (§49, §54).
 */

/** Half-height of the projection in viewBox units; width follows FRAME's aspect. */
const H = 46
const SCALE = H / FRAME.y
const CX = FRAME.x * SCALE
const VIEWBOX = `0 0 ${CX * 2} 100`

function px(x: number) {
  return CX + x * SCALE
}
function py(y: number) {
  return 50 - y * SCALE
}

interface Props {
  stage: TechnologyStageId
  targets: TechTargets
}

export default function TechnologyDiagram({ stage, targets }: Props) {
  const positions =
    stage === 'sample'
      ? targets.sample
      : stage === 'map'
        ? targets.map
        : stage === 'interpret'
          ? targets.interpret
          : stage === 'predict'
            ? targets.predict
            : targets.validate

  const showLines = stage === 'interpret' || stage === 'predict'
  const showRings = stage === 'predict' || stage === 'validate'

  return (
    <div className="technology-diagram">
      <svg viewBox={VIEWBOX} className="technology-diagram-svg" aria-hidden="true">
        {/* The measurement grid firms up while space is being resolved, exactly
            as the environment does in the animated version (§38). */}
        {(stage === 'map' || stage === 'interpret') && (
          <g stroke="#a6ff6a" strokeWidth="0.2" opacity={stage === 'map' ? 0.14 : 0.07}>
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={`h${i}`} x1="0" x2={CX * 2} y1={10 + i * 20} y2={10 + i * 20} />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={`v${i}`} y1="0" y2="100" x1={10 + i * 20} x2={10 + i * 20} />
            ))}
          </g>
        )}

        {stage === 'sample' && (
          <image
            href={SPECIMEN_SRC}
            x={px(-0.98)}
            y={py(0.98)}
            width={1.96 * SCALE}
            height={1.96 * SCALE}
            opacity="0.95"
          />
        )}

        {stage === 'validate' && (
          <image
            href={CANDIDATE_SRC}
            x={px(-0.72)}
            y={py(0.72)}
            width={1.44 * SCALE}
            height={1.44 * SCALE}
          />
        )}

        {showLines && (
          <g strokeWidth="0.5">
            {Array.from({ length: targets.lineIndices.length / 2 }, (_, i) => {
              const a = targets.lineIndices[i * 2]
              const b = targets.lineIndices[i * 2 + 1]
              const strength = Math.min(targets.strength[a], targets.strength[b])
              // The predict stage is the filter: weak pathways drop out of the
              // drawing entirely, which is the same thing the shader does with
              // opacity.
              if (stage === 'predict' && strength < 0.55) return null
              return (
                <line
                  key={i}
                  x1={px(positions[a * 3])}
                  y1={py(positions[a * 3 + 1])}
                  x2={px(positions[b * 3])}
                  y2={py(positions[b * 3 + 1])}
                  stroke={strength > 0.82 ? '#a6ff6a' : '#c6f5e1'}
                  opacity={0.22 + strength * 0.5}
                />
              )
            })}
          </g>
        )}

        {showRings &&
          Array.from({ length: targets.candidates.length / 3 }, (_, r) => {
            const conf = CANDIDATE_CONFIDENCE[r] ?? 0.5
            const isWinner = r === WINNER
            if (stage === 'validate' && !isWinner) return null

            const radius = (0.26 + conf * 0.16) * (stage === 'validate' ? 1.95 : 1) * SCALE
            const cx = stage === 'validate' ? px(0) : px(targets.candidates[r * 3])
            const cy = stage === 'validate' ? py(0) : py(targets.candidates[r * 3 + 1])
            const circumference = 2 * Math.PI * radius

            return (
              <g key={r} transform={`rotate(-90 ${cx} ${cy})`}>
                {/* Track, then the confidence arc over it — arc length is the
                    reading, so there is no bar anywhere in this section (§30). */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#c6f5e1"
                  strokeWidth="0.3"
                  opacity="0.2"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={isWinner ? '#a6ff6a' : '#c6f5e1'}
                  strokeWidth="0.5"
                  strokeDasharray={`${conf * circumference} ${circumference}`}
                  opacity={isWinner ? 0.9 : 0.5}
                />
              </g>
            )
          })}

        {stage === 'validate' && (
          <g stroke="#c6f5e1" strokeWidth="0.4" opacity="0.5">
            {[
              [-1, -1],
              [-1, 1],
              [1, -1],
              [1, 1],
            ].map(([sx, sy]) => {
              const x = px(sx * 1.16)
              const y = py(sy * 1.16)
              return (
                <g key={`${sx}${sy}`}>
                  <line x1={x} y1={y} x2={x - sx * 0.24 * SCALE} y2={y} />
                  <line x1={x} y1={y} x2={x} y2={y + sy * 0.24 * SCALE} />
                </g>
              )
            })}
          </g>
        )}

        <g>
          {Array.from({ length: targets.count }, (_, i) => {
            const strength = targets.strength[i]
            const winner = targets.winner[i] > 0.5
            if (stage === 'validate' && !winner) return null
            const dim = stage === 'predict' ? 0.12 + strength * 0.88 : 1
            return (
              <circle
                key={i}
                cx={px(positions[i * 3])}
                cy={py(positions[i * 3 + 1])}
                // Small enough that a cluster's connections still show
                // between its cells: at diagram scale the links are only a few
                // pixels longer than the nodes they join.
                r={0.5 + targets.size[i] * 0.3}
                fill={strength > 0.82 ? '#a6ff6a' : '#c6f5e1'}
                opacity={(0.34 + strength * 0.5) * dim}
              />
            )
          })}
        </g>
      </svg>

      {/* The one diagram carrying real photographic content describes itself;
          the rest are abstractions of copy that is already on the page. */}
      {stage === 'sample' && <span className="sr-only">{SPECIMEN_ALT}</span>}
    </div>
  )
}
