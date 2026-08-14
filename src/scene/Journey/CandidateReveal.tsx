import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MILESTONE, smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

/**
 * Side length in world units, matching the diameter of the `candidate`
 * particle arrangement in particleTargets so the halo hugs the silhouette.
 *
 * Deliberately a constant rather than a fraction of the viewport: this mesh
 * lives inside the Journey group, which is already scaled to fit the frame.
 * Sizing it from the viewport as well shrank the molecule twice over on
 * portrait screens and pulled it out of register with its own halo.
 */
const CANDIDATE_SIZE = 3.05

/**
 * The resolved molecular candidate.
 *
 * Mounted late (see JourneyScene) so its texture is fetched during the middle
 * of the Journey rather than with the initial page payload — ASSET_MANIFEST §15
 * and prompt §49 both ask for this to stay off the critical path.
 */
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
        // The source has genuine alpha with black RGB in the cleared region,
        // so straight alpha blending composites correctly on the dark stage.
        blending: THREE.NormalBlending,
      }),
    [tex],
  )

  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const j = scrollProgress.journey
    const reveal = smoothstep(MILESTONE.candidateStart + 0.01, 1.0, j)

    mat.opacity = reveal
    if (meshRef.current) {
      meshRef.current.visible = reveal > 0.002
      // Settles inward slightly as it resolves — arriving, not zooming
      meshRef.current.scale.setScalar(1.08 - reveal * 0.08)
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={5} frustumCulled={false}>
      <planeGeometry args={[CANDIDATE_SIZE, CANDIDATE_SIZE]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
