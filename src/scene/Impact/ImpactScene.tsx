import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ImpactNetwork from './ImpactNetwork'
import ImpactSeed from './ImpactSeed'
import { buildImpactTargets, impactFit, type ImpactDensity } from './impactTargets'
import { impactVisible } from '@/sections/Impact/impact.constants'
import { useExperienceStore } from '@/store/experienceStore'

interface Props {
  density: ImpactDensity
  offsetVisual: boolean
  pointerEnabled: boolean
}

export default function ImpactScene({ density, offsetVisual, pointerEnabled }: Props) {
  const viewport = useThree((s) => s.viewport)
  const stage = useExperienceStore((s) => s.impactStage)

  const targets = useMemo(() => buildImpactTargets(density), [density])

  const fit = useMemo(() => impactFit(viewport.width), [viewport.width])

  const position = useMemo<[number, number, number]>(
    () => [offsetVisual ? viewport.width * 0.17 : 0, viewport.height * 0.03, 0],
    [offsetVisual, viewport.width, viewport.height],
  )

  const group = useRef<THREE.Group>(null)
  const drift = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const visible = impactVisible()
    g.visible = visible
    if (!visible) return

    const tx = pointerEnabled ? state.pointer.x * 0.055 : 0
    const ty = pointerEnabled ? state.pointer.y * 0.04 : 0
    const k = 1 - Math.exp(-Math.min(0.05, delta) * 3.4)
    drift.current.x += (tx - drift.current.x) * k
    drift.current.y += (ty - drift.current.y) * k

    g.position.x = position[0] + drift.current.x
    g.position.y = position[1] + drift.current.y
  })

  if (!stage) return null

  return (
    <group ref={group} position={position} scale={fit} visible={false}>
      <ImpactNetwork targets={targets} />
      <ImpactSeed />
    </group>
  )
}
