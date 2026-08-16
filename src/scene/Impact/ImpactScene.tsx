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
  /** The composition shifts right so the metric column keeps quiet background */
  offsetVisual: boolean
  /** Desktop only — a coarse pointer gets no parallax at all (§38) */
  pointerEnabled: boolean
}

/**
 * Everything the Impact section draws into the shared canvas.
 *
 * One group, one population, three arrangements. The group's visibility is a
 * pure function of scroll, so the network costs nothing while the other six
 * sections are on screen, and nothing is built at all until the section arms
 * itself one viewport away (§51, §52).
 */
export default function ImpactScene({ density, offsetVisual, pointerEnabled }: Props) {
  const viewport = useThree((s) => s.viewport)
  const stage = useExperienceStore((s) => s.impactStage)

  const targets = useMemo(() => buildImpactTargets(density), [density])

  // The arrangements are authored in fixed world units against a frame roughly
  // 8 units wide (see FRAME in impactTargets). Scaling the group to the actual
  // frustum keeps the composition identical at every viewport instead of
  // letting it crop; the ceiling stops it inflating on ultrawide screens.
  const fit = useMemo(() => impactFit(viewport.width), [viewport.width])

  // Right-biased and lifted a little: the metric column sits left, the step
  // indicator runs along the bottom edge, and the human moment occupies the
  // lower right at the end (§12, §26, §32).
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

    // §38 — the scroll is the interaction here, so the pointer is worth about
    // four perceived pixels of parallax and nothing else. Frame-rate
    // independent smoothing, so a 120Hz display does not respond twice as fast.
    const tx = pointerEnabled ? state.pointer.x * 0.055 : 0
    const ty = pointerEnabled ? state.pointer.y * 0.04 : 0
    const k = 1 - Math.exp(-Math.min(0.05, delta) * 3.4)
    drift.current.x += (tx - drift.current.x) * k
    drift.current.y += (ty - drift.current.y) * k

    g.position.x = position[0] + drift.current.x
    g.position.y = position[1] + drift.current.y
  })

  // Nothing mounts — no buffers, no geometry — until the section arms itself.
  if (!stage) return null

  return (
    <group ref={group} position={position} scale={fit} visible={false}>
      <ImpactNetwork targets={targets} />
      <ImpactSeed />
    </group>
  )
}
