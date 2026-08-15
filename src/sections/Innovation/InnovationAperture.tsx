import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildHandoffTimeline } from '@/animation/innovationTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  /** vh of scroll reserved for the handoff (HANDOFF_VH) */
  handoffVh: number
}

/**
 * The Bone aperture that ends the Biological Journey.
 *
 * Rendered *inside* the Journey's sticky stage rather than at the top of
 * Innovation, and that placement is the whole trick: the stage's bottom edge is
 * Innovation's top edge, so a Bone panel that fills the stage scrolls away in
 * perfect register with the Bone section arriving underneath it. There is no
 * moment where the two are visible as separate surfaces.
 *
 * Purely decorative — the section change is already conveyed by the document
 * order, so it carries no content and is hidden from assistive technology.
 */
export default function InnovationAperture({ handoffVh }: Props) {
  const reduced = useReducedMotion()
  const aperture = useRef<HTMLDivElement>(null)
  const disc = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Walked up from this element rather than taken as a prop: React attaches
      // a host ref only after the layout effects of everything inside it have
      // run, so a ref on the ancestor <section> is still null at this point.
      // The DOM itself is already complete, so `closest` is not.
      const journey = aperture.current?.closest<HTMLElement>('#journey')
      if (!journey || !aperture.current || !disc.current) return
      buildHandoffTimeline(
        { journey, aperture: aperture.current, disc: disc.current, handoffVh },
        reduced,
      )
    },
    { dependencies: [reduced, handoffVh], revertOnUpdate: true, scope: aperture },
  )

  return (
    <div ref={aperture} className="innovation-aperture" aria-hidden="true">
      <div ref={disc} className="innovation-aperture-disc" />
    </div>
  )
}
