import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RING_VERT, RING_FRAG } from './shaders'
import type { TechTargets } from './techTargets'
import { smoothstep } from '@/sections/Journey/journey.constants'
import {
  CANDIDATE_CONFIDENCE,
  TECH_MILESTONE,
  WINNER,
  techVisible,
} from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

interface Props {
  targets: TechTargets
}

const SEGMENTS = 72

const RING_COLOR = new THREE.Color('#c6f5e1')
const RING_ACTIVE = new THREE.Color('#a6ff6a')

export default function ConfidenceRings({ targets }: Props) {
  const geo = useMemo(() => {
    const rings = targets.candidates.length / 3
    const verts = rings * SEGMENTS * 2

    const position = new Float32Array(verts * 3)
    const anchor = new Float32Array(verts * 3)
    const angle = new Float32Array(verts)
    const radius = new Float32Array(verts)
    const conf = new Float32Array(verts)
    const winner = new Float32Array(verts)

    let v = 0
    for (let r = 0; r < rings; r++) {
      const c = CANDIDATE_CONFIDENCE[r] ?? 0.5
      const rad = 0.22 + c * 0.14
      const isWinner = r === WINNER ? 1 : 0

      for (let s = 0; s < SEGMENTS; s++) {
        const a0 = (s / SEGMENTS) * Math.PI * 2
        const a1 = ((s + 1) / SEGMENTS) * Math.PI * 2
        for (const a of [a0, a1]) {
          anchor[v * 3] = targets.candidates[r * 3]
          anchor[v * 3 + 1] = targets.candidates[r * 3 + 1]
          anchor[v * 3 + 2] = targets.candidates[r * 3 + 2]
          angle[v] = a
          radius[v] = rad
          conf[v] = c
          winner[v] = isWinner
          v++
        }
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(position, 3))
    g.setAttribute('aAnchor', new THREE.BufferAttribute(anchor, 3))
    g.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1))
    g.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    g.setAttribute('aConf', new THREE.BufferAttribute(conf, 1))
    g.setAttribute('aWinner', new THREE.BufferAttribute(winner, 1))
    return g
  }, [targets])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uAppear: { value: 0 },
          uValidate: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: RING_COLOR },
          uActive: { value: RING_ACTIVE },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )

  const ref = useRef<THREE.LineSegments>(null)

  useFrame(() => {
    if (!techVisible()) return

    const p = scrollProgress.technology
    const M = TECH_MILESTONE

    const appear = smoothstep(M.predictStart + 0.03, M.predictEnd + 0.04, p)
    const validate = smoothstep(M.validateStart, M.validateEnd, p)
    const exit = smoothstep(M.exitStart, 1.0, p)

    const u = mat.uniforms
    u.uAppear.value = appear
    u.uValidate.value = validate
    u.uOpacity.value = 0.85 * appear * (1 - exit * 0.6)

    if (ref.current) ref.current.visible = u.uOpacity.value > 0.003
  })

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false} renderOrder={5}>
      <primitive object={mat} attach="material" />
    </lineSegments>
  )
}
