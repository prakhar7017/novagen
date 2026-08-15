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

/**
 * World size of the specimen plane. Sized to enclose the `sample` arrangement
 * (the map folded to 36%, so roughly ±0.75), which is what makes the nodes read
 * as signals *inside* this object rather than as a cloud in front of it.
 */
const SPECIMEN_SIZE = 1.95

const EDGE = new THREE.Color('#a6ff6a')

/**
 * The biological input.
 *
 * Stage one is the only place in the section where a photographic asset leads,
 * and that is the point: the platform starts from real material, not from an
 * abstraction. As the map takes over, the membrane opens from the outside in —
 * the dense interior is the last thing to go, because the interior is precisely
 * what the spatial map inherits (§20).
 */
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
        // The source has genuine alpha with dark RGB outside the silhouette,
        // so straight alpha composites correctly over the platform background.
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
    // Two-part erosion. The first 70% runs while the map is being established
    // and deliberately stops short, leaving a faint remnant of the specimen
    // under the map — the viewer should still be able to see where the
    // coordinates came from. The remainder clears as interpretation begins.
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
    // Settles inward as it resolves — arriving rather than zooming (§40 rules
    // out large scale effects, so the travel is 3%).
    mesh.scale.setScalar(1.03 - reveal * 0.03)
    // A slow sway, not a rotation: under a perspective camera this reads as a
    // specimen turning slightly in place without the plane ever showing that
    // it is flat.
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
