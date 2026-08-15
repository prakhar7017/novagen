import { MICROSCOPY_SRC } from '@/sections/Innovation/innovation.constants'

interface Props {
  veilRef: React.RefObject<HTMLDivElement | null>
  plateRef: React.RefObject<HTMLDivElement | null>
  /** Owns the plate's arrival fade — see the note on the element itself */
  plateInRef: React.RefObject<HTMLDivElement | null>
  shadeRef: React.RefObject<HTMLDivElement | null>
}

/**
 * The Bone → platform transition.
 *
 * The anchor is Innovation's own microscopy field (§5), reused rather than
 * reshot — it is already in the browser cache, and using a *different* image
 * would defeat the point of anchoring the transition to something the reader
 * recognises. It opens from a small window to full bleed while its dark
 * biological regions take the viewport and the Bone recedes behind it.
 *
 * The veil underneath starts as flat Bone, which is what makes the section
 * boundary itself invisible: while this is rising into view the whole screen is
 * the same colour Innovation was, so there is no seam to see.
 *
 * Purely decorative — document order already conveys the section change.
 */
export default function TechnologyIngress({
  veilRef,
  plateRef,
  plateInRef,
  shadeRef,
}: Props) {
  return (
    <div className="technology-ingress" aria-hidden="true">
      <div ref={veilRef} className="technology-ingress-veil" />

      <div ref={plateRef} className="technology-ingress-plate">
        {/* Two elements for two owners. The plate's arrival fade belongs to the
            trigger that runs while the section rises into view, and its
            dissolve to the trigger that runs with the stage already stuck. Both
            are scrubs, and a scroll *jump* past the pair can re-render them in
            either order — with one element that meant the arrival fade could
            win and leave the plate at full opacity over the platform it had
            already dissolved into. Separate elements multiply instead of
            fighting, so the result is the same whichever renders last. */}
        <div ref={plateInRef} className="technology-ingress-plate-in">
          <img
            className="technology-ingress-img"
            src={MICROSCOPY_SRC}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div ref={shadeRef} className="technology-ingress-shade" />
        </div>
      </div>
    </div>
  )
}
