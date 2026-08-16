import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SPECIMEN_VERT, SPECIMEN_FRAG } from './shaders'
import { smoothstep } from '@/sections/Journey/journey.constants'
import {
  SPECIMEN_SRC,
  TECH_MILESTONE,
  techVisible,
} from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

const SPECIMEN_SIZE = 1.95

const EDGE = new THREE.Color('#a6ff6a')

export default function SampleSpecimen() {
  const tex = useTexture(SPECIMEN_SRC)

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.generateMipmaps = false
  }, [tex])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPECIMEN_VERT,
        fragmentShader: SPECIMEN_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uMap: { value: tex },
          uReveal: { value: 0 },
          uErode: { value: 0 },
          uOpacity: { value: 1 },
          uTime: { value: 0 },
          uEdge: { value: EDGE },
        },
      }),
    [tex],
  )

  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!techVisible()) return

    const p = scrollProgress.technology
    const t = state.clock.elapsedTime
    const M = TECH_MILESTONE

    const reveal = smoothstep(M.sampleIn, M.sampleOn, p)
    const erode =
      0.7 * smoothstep(M.mapStart, M.mapEnd, p) +
      0.3 * smoothstep(M.interpretStart - 0.04, M.interpretStart + 0.06, p)

    const u = mat.uniforms
    u.uReveal.value = reveal
    u.uErode.value = erode
    u.uTime.value = t

    const mesh = meshRef.current
    if (!mesh) return
    mesh.visible = reveal > 0.002 && erode < 0.999
    mesh.scale.setScalar(1.03 - reveal * 0.03)
    mesh.rotation.y = Math.sin(t * 0.085) * 0.055
    mesh.rotation.x = Math.cos(t * 0.062) * 0.03
  })

  return (
    <mesh ref={meshRef} renderOrder={2} frustumCulled={false}>
      <planeGeometry args={[SPECIMEN_SIZE, SPECIMEN_SIZE]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
