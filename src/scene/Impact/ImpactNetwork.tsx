import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LINE_FRAG, LINE_VERT, NODE_FRAG, NODE_VERT, SIGNAL_FRAG, SIGNAL_VERT } from './shaders'
import type { ImpactPopulation, ImpactTargets } from './impactTargets'
import { smoothstep } from '@/sections/Journey/journey.constants'
import {
  IMPACT_MILESTONE,
  impactCompress,
  impactMorph,
  impactVisible,
} from '@/sections/Impact/impact.constants'
import { scrollProgress } from '@/store/progressRef'

interface Props {
  targets: ImpactTargets
}

const LINE_COLOR = new THREE.Color('#c6f5e1')
const LINE_ACTIVE = new THREE.Color('#a6ff6a')

function morphAttributes(pop: ImpactPopulation) {
  return {
    aScale: new THREE.BufferAttribute(pop.scale, 3),
    aPrioritize: new THREE.BufferAttribute(pop.prioritize, 3),
    aValidate: new THREE.BufferAttribute(pop.validate, 3),
    aInward: new THREE.BufferAttribute(pop.inward, 3),
    aRandom: new THREE.BufferAttribute(pop.random, 1),
    aStrength: new THREE.BufferAttribute(pop.strength, 1),
    aWinner: new THREE.BufferAttribute(pop.winner, 1),
  }
}

export default function ImpactNetwork({ targets }: Props) {
  const nodeAttrs = useMemo(() => morphAttributes(targets.nodes), [targets])

  const signalGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(targets.signals.scale, 3))
    for (const [name, attr] of Object.entries(morphAttributes(targets.signals))) {
      g.setAttribute(name, attr)
    }
    g.setAttribute('aColor', new THREE.BufferAttribute(targets.signals.color, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(targets.signals.size, 1))
    return g
  }, [targets])

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(targets.nodes.scale, 3))
    for (const [name, attr] of Object.entries(nodeAttrs)) g.setAttribute(name, attr)
    g.setAttribute('aColor', new THREE.BufferAttribute(targets.nodes.color, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(targets.nodes.size, 1))
    return g
  }, [targets, nodeAttrs])

  const [linesGeo, bridgesGeo, evidenceGeo] = useMemo(() => {
    const build = (index: Uint16Array) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(targets.nodes.scale, 3))
      for (const [name, attr] of Object.entries(nodeAttrs)) g.setAttribute(name, attr)
      g.setIndex(new THREE.BufferAttribute(index, 1))
      return g
    }
    return [
      build(targets.lineIndices),
      build(targets.bridgeIndices),
      build(targets.evidenceIndices),
    ]
  }, [targets, nodeAttrs])

  const signalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SIGNAL_VERT,
        fragmentShader: SIGNAL_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMorph: { value: 0 },
          uCompress: { value: 0 },
          uStagger: { value: 0.22 },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uFilter: { value: 0 },
          uValidate: { value: 0 },
          uExit: { value: 0 },
          uSizeScale: { value: 1 },
        },
      }),
    [],
  )

  const nodeMat = useMemo(
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
          uCompress: { value: 0 },
          uStagger: { value: 0.1 },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uFilter: { value: 0 },
          uValidate: { value: 0 },
          uSettle: { value: 0 },
          uExit: { value: 0 },
          uSizeScale: { value: 1 },
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
        depthTest: false,
        uniforms: {
          uMorph: { value: 0 },
          uCompress: { value: 0 },
          uStagger: { value: 0.03 },
          uTime: { value: 0 },
          uDraw: { value: 0 },
          uFilter: { value: 0 },
          uValidate: { value: 0 },
          uSettle: { value: 0 },
          uExit: { value: 0 },
          uColor: { value: LINE_COLOR },
          uActive: { value: LINE_ACTIVE },
          uOpacity: { value: 0 },
        },
      }),
    [],
  )

  const bridgesMat = useMemo(() => linesMat.clone(), [linesMat])
  const evidenceMat = useMemo(() => linesMat.clone(), [linesMat])

  useEffect(
    () => () => {
      signalGeo.dispose()
      nodeGeo.dispose()
      linesGeo.dispose()
      bridgesGeo.dispose()
      evidenceGeo.dispose()
      signalMat.dispose()
      nodeMat.dispose()
      linesMat.dispose()
      bridgesMat.dispose()
      evidenceMat.dispose()
    },
    [
      signalGeo,
      nodeGeo,
      linesGeo,
      bridgesGeo,
      evidenceGeo,
      signalMat,
      nodeMat,
      linesMat,
      bridgesMat,
      evidenceMat,
    ],
  )

  const signalRef = useRef<THREE.Points>(null)
  const nodeRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const bridgesRef = useRef<THREE.LineSegments>(null)
  const evidenceRef = useRef<THREE.LineSegments>(null)

  useFrame((state) => {
    if (!impactVisible()) return

    const p = scrollProgress.impact
    const t = state.clock.elapsedTime
    const M = IMPACT_MILESTONE

    const morph = impactMorph(p)
    const compress = impactCompress(p)
    const reveal = smoothstep(M.populateIn, M.populateOn, p)
    const draw = smoothstep(M.populateIn + 0.05, M.populateOn + 0.06, p)
    const filter = smoothstep(M.filterStart, M.filterEnd, p)
    const validate = smoothstep(M.validateStart, M.validateEnd, p)
    const settle = smoothstep(M.arcStart, M.arcEnd, p)
    const exit = scrollProgress.impactExit
    const dpr = state.gl.getPixelRatio()

    const su = signalMat.uniforms
    su.uMorph.value = morph
    su.uCompress.value = compress
    su.uTime.value = t
    su.uReveal.value = reveal
    su.uFilter.value = filter
    su.uValidate.value = validate
    su.uExit.value = exit
    su.uSizeScale.value = dpr

    const nu = nodeMat.uniforms
    nu.uMorph.value = morph
    nu.uCompress.value = compress
    nu.uTime.value = t
    nu.uReveal.value = reveal
    nu.uFilter.value = filter
    nu.uValidate.value = validate
    nu.uSettle.value = settle
    nu.uExit.value = exit
    nu.uSizeScale.value = dpr

    const write = (mat: THREE.ShaderMaterial, opacity: number) => {
      const u = mat.uniforms
      u.uMorph.value = morph
      u.uCompress.value = compress
      u.uTime.value = t
      u.uDraw.value = draw
      u.uFilter.value = filter
      u.uSettle.value = settle
      u.uExit.value = exit
      u.uOpacity.value = opacity
    }

    write(linesMat, (0.34 + 0.22 * filter) * draw * (1 - exit))
    linesMat.uniforms.uValidate.value = validate

    write(bridgesMat, 0.3 * draw * (1 - filter) * (1 - exit))
    bridgesMat.uniforms.uValidate.value = validate

    write(evidenceMat, 0.5 * validate * (1 - exit * 0.7))
    evidenceMat.uniforms.uValidate.value = 0

    if (signalRef.current) signalRef.current.visible = reveal > 0.001
    if (nodeRef.current) nodeRef.current.visible = reveal > 0.001
    if (linesRef.current) linesRef.current.visible = linesMat.uniforms.uOpacity.value > 0.002
    if (bridgesRef.current) {
      bridgesRef.current.visible = bridgesMat.uniforms.uOpacity.value > 0.002
    }
    if (evidenceRef.current) {
      evidenceRef.current.visible = evidenceMat.uniforms.uOpacity.value > 0.002
    }
  })

  return (
    <group>
      <points ref={signalRef} geometry={signalGeo} frustumCulled={false} renderOrder={2}>
        <primitive object={signalMat} attach="material" />
      </points>

      <lineSegments ref={linesRef} geometry={linesGeo} frustumCulled={false} renderOrder={3}>
        <primitive object={linesMat} attach="material" />
      </lineSegments>
      <lineSegments ref={bridgesRef} geometry={bridgesGeo} frustumCulled={false} renderOrder={3}>
        <primitive object={bridgesMat} attach="material" />
      </lineSegments>
      <lineSegments
        ref={evidenceRef}
        geometry={evidenceGeo}
        frustumCulled={false}
        renderOrder={4}
      >
        <primitive object={evidenceMat} attach="material" />
      </lineSegments>

      <points ref={nodeRef} geometry={nodeGeo} frustumCulled={false} renderOrder={5}>
        <primitive object={nodeMat} attach="material" />
      </points>
    </group>
  )
}
