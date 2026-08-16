import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import PlatformField from './PlatformField'
import SampleSpecimen from './SampleSpecimen'
import ConfidenceRings from './ConfidenceRings'
import ValidationCandidate from './ValidationCandidate'
import { buildTechTargets } from './techTargets'
import { techVisible } from '@/sections/Technology/technology.constants'
import { useExperienceStore } from '@/store/experienceStore'

interface Props {
  nodeCount: number
  offsetVisual: boolean
}

export default function TechnologyScene({ nodeCount, offsetVisual }: Props) {
  const viewport = useThree((s) => s.viewport)
  const stage = useExperienceStore((s) => s.technologyStage)

  const targets = useMemo(() => buildTechTargets(nodeCount), [nodeCount])

  const fit = useMemo(
    () => Math.max(0.52, Math.min(1.18, viewport.width / 7.5)),
    [viewport.width],
  )

  const position = useMemo<[number, number, number]>(
    () => [offsetVisual ? viewport.width * 0.155 : 0, viewport.height * 0.045, 0],
    [offsetVisual, viewport.width, viewport.height],
  )

  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    if (group.current) group.current.visible = techVisible()
  })

  if (!stage) return null
  const shortlisted = stage === 'predict' || stage === 'validate'

  return (
    <group ref={group} position={position} scale={fit} visible={false}>
      <Suspense fallback={null}>
        <SampleSpecimen />
      </Suspense>

      <PlatformField targets={targets} />
      <ConfidenceRings targets={targets} />

      {shortlisted && (
        <Suspense fallback={null}>
          <ValidationCandidate />
        </Suspense>
      )}
    </group>
  )
}
