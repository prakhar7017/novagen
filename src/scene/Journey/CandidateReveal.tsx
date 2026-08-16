import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MILESTONE, smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

const CANDIDATE_SIZE = 3.05

export default function CandidateReveal() {
  const tex = useTexture('/assets/story/07-molecular-candidate.webp')

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.generateMipmaps = false
  }, [tex])

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
      }),
    [tex],
  )

  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const j = scrollProgress.journey
    const reveal = smoothstep(MILESTONE.candidateStart + 0.01, 1.0, j)

    const h = scrollProgress.handoff
    const opacity = reveal * (1 - 0.75 * h)

    mat.opacity = opacity
    if (meshRef.current) {
      meshRef.current.visible = opacity > 0.002
      meshRef.current.scale.setScalar((1.08 - reveal * 0.08) * (1 - 0.28 * h))
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={5} frustumCulled={false}>
      <planeGeometry args={[CANDIDATE_SIZE, CANDIDATE_SIZE]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
