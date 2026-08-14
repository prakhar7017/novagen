import { useMemo, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  PARTICLE_VERT,
  PARTICLE_FRAG,
  LINE_VERT,
  LINE_FRAG,
} from './shaders'
import { buildParticleTargets } from './particleTargets'
import {
  MILESTONE,
  morphIndex,
  smoothstep,
  clamp01,
} from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

interface Props {
  count: number
  /** Cursor response is disabled on touch devices */
  pointerEnabled: boolean
}

const LINE_COLOR = new THREE.Color('#8fe8b8')

export default function ParticleSystem({ count, pointerEnabled }: Props) {
  const pointer = useThree((s) => s.pointer)

  const targets = useMemo(() => buildParticleTargets(count), [count])

  /**
   * Smaller devices run a smaller population, which thins every arrangement —
   * the expression profile's columns especially. Nudging point size up by the
   * square root of the shortfall restores roughly the same coverage. Desktop
   * (the authoring count) is left exactly as-is.
   */
  const densityBoost = useMemo(() => Math.min(1.6, Math.sqrt(6000 / count)), [count])

  // ── Point cloud ──────────────────────────────────────────────────────────
  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // `position` is required by three's bounding-sphere machinery even though
    // the vertex shader computes the real position from the morph attributes.
    g.setAttribute('position', new THREE.BufferAttribute(targets.field, 3))
    g.setAttribute('aNucleus', new THREE.BufferAttribute(targets.nucleus, 3))
    g.setAttribute('aField', new THREE.BufferAttribute(targets.field, 3))
    g.setAttribute('aSignal', new THREE.BufferAttribute(targets.signal, 3))
    g.setAttribute('aNetwork', new THREE.BufferAttribute(targets.network, 3))
    g.setAttribute('aCandidate', new THREE.BufferAttribute(targets.candidate, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(targets.color, 3))
    g.setAttribute('aRandom', new THREE.BufferAttribute(targets.random, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(targets.size, 1))
    return g
  }, [targets])

  // ── Network connections ──────────────────────────────────────────────────
  // Built from the same buffers and morphed by the same code path, so the
  // lines track their nodes exactly rather than drifting out of register.
  const linesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(targets.network, 3))
    g.setAttribute('aNucleus', new THREE.BufferAttribute(targets.nucleus, 3))
    g.setAttribute('aField', new THREE.BufferAttribute(targets.field, 3))
    g.setAttribute('aSignal', new THREE.BufferAttribute(targets.signal, 3))
    g.setAttribute('aNetwork', new THREE.BufferAttribute(targets.network, 3))
    g.setAttribute('aCandidate', new THREE.BufferAttribute(targets.candidate, 3))
    g.setAttribute('aRandom', new THREE.BufferAttribute(targets.random, 1))
    g.setIndex(new THREE.BufferAttribute(targets.lineIndices, 1))
    return g
  }, [targets])

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          uMorph: { value: 0 },
          uStagger: { value: 0.55 },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uSizeScale: { value: 1 },
          uDim: { value: 1 },
          uPointer: { value: new THREE.Vector2() },
        },
      }),
    [],
  )

  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          uMorph: { value: 0 },
          // Much tighter than the points': with a wide stagger the two ends of
          // a connection sit at different morph values and the line stretches
          // across the whole field instead of joining neighbours.
          uStagger: { value: 0.14 },
          uTime: { value: 0 },
          uColor: { value: LINE_COLOR },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      pointsGeo.dispose()
      linesGeo.dispose()
      pointsMat.dispose()
      linesMat.dispose()
    },
    [pointsGeo, linesGeo, pointsMat, linesMat],
  )

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  useFrame((state) => {
    const j = scrollProgress.journey
    const t = state.clock.elapsedTime

    const morph = morphIndex(j)
    // Particles emerge from the nucleus surface as it destabilises
    const reveal = smoothstep(MILESTONE.shatterStart, MILESTONE.shatterEnd, j)
    // §30: density falls away once the candidate resolves, so the final state
    // reads as clarity rather than more complexity.
    const dim = 1 - smoothstep(MILESTONE.candidateStart, 1.0, j) * 0.72

    const pu = pointsMat.uniforms
    pu.uMorph.value = morph
    pu.uTime.value = t
    pu.uReveal.value = reveal
    pu.uDim.value = dim
    // Tracks adaptive DPR changes from PerformanceMonitor
    pu.uSizeScale.value = state.gl.getPixelRatio() * densityBoost

    if (pointerEnabled) {
      // Eased toward the cursor; amplitude is deliberately tiny (spec §27)
      pu.uPointer.value.x += (pointer.x * 0.09 - pu.uPointer.value.x) * 0.05
      pu.uPointer.value.y += (pointer.y * 0.06 - pu.uPointer.value.y) * 0.05
    }

    const lu = linesMat.uniforms
    lu.uMorph.value = morph
    lu.uTime.value = t
    // Connections only exist while the network reads as a network
    lu.uOpacity.value =
      clamp01(smoothstep(MILESTONE.networkStart + 0.02, MILESTONE.networkEnd, j)) *
      (1 - smoothstep(MILESTONE.candidateStart, MILESTONE.candidateEnd, j)) *
      0.34

    if (pointsRef.current) pointsRef.current.visible = reveal > 0.001
    if (linesRef.current) linesRef.current.visible = lu.uOpacity.value > 0.002
  })

  return (
    <group>
      <points ref={pointsRef} geometry={pointsGeo} frustumCulled={false} renderOrder={4}>
        <primitive object={pointsMat} attach="material" />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeo} frustumCulled={false} renderOrder={3}>
        <primitive object={linesMat} attach="material" />
      </lineSegments>
    </group>
  )
}
