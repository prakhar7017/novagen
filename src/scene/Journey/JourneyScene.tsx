import { Suspense, useState, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import DissolveStage from './DissolveStage'
import ParticleSystem from './ParticleSystem'
import CandidateReveal from './CandidateReveal'
import { scrollProgress } from '@/store/progressRef'
import { MILESTONE } from '@/sections/Journey/journey.constants'

interface Props {
  particleCount: number
  pointerEnabled: boolean
  /** Procedural states shift right so they clear the story copy column */
  offsetVisual: boolean
}

/**
 * Everything the Journey draws into the shared canvas.
 *
 * The image states (organism / cluster / nucleus) are full-bleed or matched to
 * the Hero's rectangle. The procedural states (particles, network, candidate)
 * sit in a group nudged toward the right so the left-hand copy column stays on
 * quiet background.
 */
export default function JourneyScene({
  particleCount,
  pointerEnabled,
  offsetVisual,
}: Props) {
  const viewport = useThree((s) => s.viewport)

  // The candidate texture is only worth fetching once the network starts
  // converging. A ref guards the state write so this flips exactly once.
  const [candidateMounted, setCandidateMounted] = useState(false)
  const mountedRef = useRef(false)

  useFrame(() => {
    if (!mountedRef.current && scrollProgress.journey > MILESTONE.networkStart - 0.1) {
      mountedRef.current = true
      setCandidateMounted(true)
    }
  })

  const groupX = useMemo(
    () => (offsetVisual ? viewport.width * 0.13 : 0),
    [offsetVisual, viewport.width],
  )

  // The arrangements in particleTargets are authored in fixed world units
  // against a landscape frame roughly this wide. On a portrait viewport the
  // frustum is far narrower, so the expression profile and the network would
  // run off both sides and read as noise. Scaling the whole group down keeps
  // the composition intact; the floor accepts a little crop on phones rather
  // than shrinking the story into a speck in the middle of a tall screen.
  const fit = useMemo(
    () => Math.max(0.42, Math.min(1, viewport.width / 7.5)),
    [viewport.width],
  )

  return (
    <>
      <Suspense fallback={null}>
        <DissolveStage />
      </Suspense>

      <group position={[groupX, 0, 0]} scale={fit}>
        <ParticleSystem count={particleCount} pointerEnabled={pointerEnabled} />
        {candidateMounted && (
          <Suspense fallback={null}>
            <CandidateReveal />
          </Suspense>
        )}
      </group>
    </>
  )
}
