import { useMemo } from 'react'
import { buildIngressScatter } from './impact.diagram'
import type { DiagramPoint } from './impact.diagram'

interface Props {
  veilRef: React.RefObject<HTMLDivElement | null>
  signalsRef: React.RefObject<HTMLDivElement | null>
}

/** 150 marks: enough to read as a field, few enough to stay individual points. */
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
            // The scatter's own size variation carries through, so the field has
            // the uneven weight of the network rather than of a dot grid.
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

/**
 * The Research → Impact handoff (§7).
 *
 * §7 rules out a background cut and rules out a second organic aperture. The
 * device here is a detachment, run entirely inside the held stage:
 *
 *   1. The stage rises into view carrying a full-bleed Bone veil. Bone meets
 *      Bone, so the section boundary itself is invisible — the same trick the
 *      Innovation → Technology ingress uses, and the reason this needs no panel
 *      reaching up into the previous section.
 *   2. A scatter of signal points settles onto that Bone as dark ink.
 *   3. With the stage stuck, the veil is clipped away downward. Underneath it,
 *      at *identical* coordinates, the same scatter is already drawn in Signal
 *      Mint over the dark environment.
 *
 * The points never move. The surface under them inverts, which is the sentence
 * the section needs: RESEARCH DATA becomes IMPACT SCALE. Downward rather than
 * upward, because Research's own arrival was an upward Bone mask and running the
 * same trick twice in the same direction would be a tic rather than a language.
 *
 * Positioned spans rather than an SVG: the stage is roughly 16:10 and a viewBox
 * stretched to that aspect turns every circle into an ellipse, while a
 * letterboxed one would crop away most of the field.
 *
 * Purely decorative — document order already conveys the section change, and
 * everything the transition says is said again in the section's own copy.
 */
export default function ImpactIngress({ veilRef, signalsRef }: Props) {
  const scatter = useMemo(() => buildIngressScatter(COUNT), [])

  return (
    <>
      {/* Under the veil and over the environment: what the ink points become. */}
      <div
        ref={signalsRef}
        className="impact-signals impact-signals--lit"
        aria-hidden="true"
      >
        <Scatter points={scatter} variant="lit" />
      </div>

      {/* Over everything in the stage until the flood clips it away. */}
      <div ref={veilRef} className="impact-veil" aria-hidden="true">
        {/* The leading edge of the arriving environment, travelling on its own
            tween: a 1px line cannot ride a clip-path boundary. */}
        <span className="impact-veil-edge" />
        <div className="impact-signals impact-signals--ink">
          <Scatter points={scatter} variant="ink" />
        </div>
      </div>
    </>
  )
}
