import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SEED } from './impactTargets'
import { smoothstep } from '@/sections/Journey/journey.constants'
import { IMPACT_MILESTONE, impactVisible } from '@/sections/Impact/impact.constants'
import { scrollProgress } from '@/store/progressRef'

const SEED_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SEED_FRAG = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3  uCore;
  uniform vec3  uHalo;
  varying vec2  vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    if (d > 1.0) discard;

    // A dense core inside a close halo — one biological point rather than a
    // lens flare. The two falloffs are separated enough that the point has a
    // glow (a single exponential reads as a flat dot) but not so far that the
    // halo becomes the subject: at the wider values this started from, the
    // closing frame was a soft cloud with a speck in it.
    float core = exp(-d * d * 46.0);
    float halo = exp(-d * d * 15.0) * 0.24 + exp(-d * d * 5.0) * 0.05;

    // Barely-there respiration, so the point that section 08 grows out of is
    // alive rather than parked.
    float live = 0.9 + 0.1 * sin(uTime * 0.7);

    vec3 c = uHalo + (uCore - uHalo) * core;
    float a = (core + halo) * uOpacity * live;
    if (a < 0.004) discard;
    gl_FragColor = vec4(c, a);
  }
`

/**
 * The seed the Final CTA grows out of (§53).
 *
 * MILLIONS OF SIGNALS → ONE CLEAR POSSIBILITY, resolved to a single object. It
 * exists only across the closing collapse: while the network is still being
 * reduced there is a validated target on screen and a second glowing point
 * beside it would be one biological form too many.
 *
 * Deliberately the last thing this section owns. Section 08 is not implemented
 * yet; what it inherits is `scrollProgress.impactExit` and this point sitting
 * at the origin of the scene's own space.
 */
export default function ImpactSeed() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SEED_VERT,
        fragmentShader: SEED_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uCore: { value: new THREE.Color('#e8fff0') },
          uHalo: { value: new THREE.Color('#a6ff6a') },
        },
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    if (!impactVisible()) {
      mesh.current.visible = false
      return
    }

    const p = scrollProgress.impact
    const exit = scrollProgress.impactExit
    // Present from the validated state onward, faintly, so the 91% target has a
    // luminous centre and the closing collapse is that centre growing into the
    // only thing left — rather than a new object appearing at the last moment.
    const validate = smoothstep(
      IMPACT_MILESTONE.validateStart,
      IMPACT_MILESTONE.arcEnd,
      p,
    )
    const strength = Math.max(validate * 0.34, exit * 0.95)
    material.uniforms.uOpacity.value = strength
    material.uniforms.uTime.value = state.clock.elapsedTime
    // Tightens as it resolves — §54 asks the target to reduce slightly rather
    // than swell, so the section ends quieter than it ran.
    mesh.current.scale.setScalar(SEED.restScale - exit * (SEED.restScale - SEED.finalScale))
    mesh.current.visible = strength > 0.004
  })

  return (
    <mesh ref={mesh} renderOrder={6} visible={false}>
      <planeGeometry args={[SEED.plane, SEED.plane]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
