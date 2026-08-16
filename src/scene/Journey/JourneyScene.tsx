import { Suspense, useState, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import DissolveStage from './DissolveStage'
import ParticleSystem from './ParticleSystem'
import CandidateReveal from './CandidateReveal'
import { scrollProgress } from '@/store/progressRef'
import { MILESTONE } from '@/sections/Journey/journey.constants'

interface Props {
  particleCount: number
  pointerEnabled: boolean
  offsetVisual: boolean
}

export default function JourneyScene({
  particleCount,
  pointerEnabled,
  offsetVisual,
}: Props) {
  const viewport = useThree((s) => s.viewport)

  const [candidateMounted, setCandidateMounted] = useState(false)
  const mountedRef = useRef(false)
  const root = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!mountedRef.current && scrollProgress.journey > MILESTONE.networkStart - 0.1) {
      mountedRef.current = true
      setCandidateMounted(true)
    }

    if (root.current) root.current.visible = scrollProgress.handoff < 0.985
  })

  const groupX = useMemo(
    () => (offsetVisual ? viewport.width * 0.13 : 0),
    [offsetVisual, viewport.width],
  )

  const fit = useMemo(
    () => Math.max(0.42, Math.min(1, viewport.width / 7.5)),
    [viewport.width],
  )

  return (
    <group ref={root}>
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
    </group>
  )
}
