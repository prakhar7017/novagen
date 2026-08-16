import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { buildHandoffTimeline } from '@/animation/innovationTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  handoffVh: number
}

export default function InnovationAperture({ handoffVh }: Props) {
  const reduced = useReducedMotion()
  const aperture = useRef<HTMLDivElement>(null)
  const disc = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
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
