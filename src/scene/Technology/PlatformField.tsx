import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NODE_VERT, NODE_FRAG, TECH_LINE_VERT, TECH_LINE_FRAG } from './shaders'
import type { TechTargets } from './techTargets'
import { smoothstep } from '@/sections/Journey/journey.constants'
import { TECH_MILESTONE, techMorph, techVisible } from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

interface Props {
  targets: TechTargets
}

const LINE_COLOR = new THREE.Color('#c6f5e1')
const LINE_ACTIVE = new THREE.Color('#a6ff6a')

export default function PlatformField({ targets }: Props) {
  const attributes = useMemo(
    () => ({
      aSample: new THREE.BufferAttribute(targets.sample, 3),
      aMap: new THREE.BufferAttribute(targets.map, 3),
      aInterpret: new THREE.BufferAttribute(targets.interpret, 3),
      aPredict: new THREE.BufferAttribute(targets.predict, 3),
      aValidate: new THREE.BufferAttribute(targets.validate, 3),
      aRandom: new THREE.BufferAttribute(targets.random, 1),
      aStrength: new THREE.BufferAttribute(targets.strength, 1),
      aWinner: new THREE.BufferAttribute(targets.winner, 1),
    }),
    [targets],
  )

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(targets.map, 3))
    for (const [name, attr] of Object.entries(attributes)) g.setAttribute(name, attr)
    g.setAttribute('aColor', new THREE.BufferAttribute(targets.color, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(targets.size, 1))
    return g
  }, [targets, attributes])

  const [linesGeo, bridgesGeo] = useMemo(() => {
    const build = (index: Uint16Array) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(targets.map, 3))
      for (const [name, attr] of Object.entries(attributes)) g.setAttribute(name, attr)
      g.setIndex(new THREE.BufferAttribute(index, 1))
      return g
    }
    return [build(targets.lineIndices), build(targets.bridgeIndices)]
  }, [targets, attributes])

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMorph: { value: 0 },
          uStagger: { value: 0.11 },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uSelect: { value: 0 },
          uValidate: { value: 0 },
          uExit: { value: 0 },
          uSizeScale: { value: 1 },
        },
      }),
    [],
  )

  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TECH_LINE_VERT,
        fragmentShader: TECH_LINE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMorph: { value: 0 },
          uStagger: { value: 0.04 },
          uTime: { value: 0 },
          uDraw: { value: 0 },
          uSelect: { value: 0 },
          uValidate: { value: 0 },
          uColor: { value: LINE_COLOR },
          uActive: { value: LINE_ACTIVE },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  const bridgesMat = useMemo(() => linesMat.clone(), [linesMat])

  useEffect(
    () => () => {
      pointsGeo.dispose()
      linesGeo.dispose()
      bridgesGeo.dispose()
      pointsMat.dispose()
      linesMat.dispose()
      bridgesMat.dispose()
    },
    [pointsGeo, linesGeo, bridgesGeo, pointsMat, linesMat, bridgesMat],
  )

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const bridgesRef = useRef<THREE.LineSegments>(null)

  useFrame((state) => {
    if (!techVisible()) return

    const p = scrollProgress.technology
    const t = state.clock.elapsedTime
    const M = TECH_MILESTONE

    const morph = techMorph(p)
    const reveal = smoothstep(M.sampleIn, M.sampleOn + 0.08, p)
    const draw = smoothstep(M.interpretStart, M.interpretEnd, p)
    const select = smoothstep(M.predictStart, M.predictEnd, p)
    const validate = smoothstep(M.validateStart, M.validateEnd, p)
    const exit = smoothstep(M.exitStart, 1.0, p)

    const pu = pointsMat.uniforms
    pu.uMorph.value = morph
    pu.uTime.value = t
    pu.uReveal.value = reveal
    pu.uSelect.value = select
    pu.uValidate.value = validate
    pu.uExit.value = exit
    pu.uSizeScale.value = state.gl.getPixelRatio()

    const lu = linesMat.uniforms
    lu.uMorph.value = morph
    lu.uTime.value = t
    lu.uDraw.value = draw
    lu.uSelect.value = select
    lu.uValidate.value = validate
    lu.uOpacity.value = 0.4 * draw * (1 - exit)

    const bu = bridgesMat.uniforms
    bu.uMorph.value = morph
    bu.uTime.value = t
    bu.uDraw.value = draw
    bu.uSelect.value = select
    bu.uValidate.value = validate
    bu.uOpacity.value = 0.4 * draw * (1 - select) * (1 - exit)

    if (pointsRef.current) pointsRef.current.visible = reveal > 0.001
    if (linesRef.current) linesRef.current.visible = lu.uOpacity.value > 0.002
    if (bridgesRef.current) bridgesRef.current.visible = bu.uOpacity.value > 0.002
  })

  return (
    <group>
      <lineSegments ref={linesRef} geometry={linesGeo} frustumCulled={false} renderOrder={3}>
        <primitive object={linesMat} attach="material" />
      </lineSegments>
      <lineSegments
        ref={bridgesRef}
        geometry={bridgesGeo}
        frustumCulled={false}
        renderOrder={3}
      >
        <primitive object={bridgesMat} attach="material" />
      </lineSegments>
      <points ref={pointsRef} geometry={pointsGeo} frustumCulled={false} renderOrder={4}>
        <primitive object={pointsMat} attach="material" />
      </points>
    </group>
  )
}
