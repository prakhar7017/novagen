import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CELL_FRAG, CELL_VERT, POINT_FRAG, POINT_VERT } from './shaders'
import {
  CELL_POSITION,
  CELL_RADIUS,
  buildCellPoints,
  cellDiameterPx,
  ctaForm,
  ctaInterior,
  ctaSpan,
  ctaVisible,
} from '@/sections/Cta/cta.constants'
import { SEED, impactFit } from '@/scene/Impact/impactTargets'
import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

function posX(p: number) {
  return CELL_POSITION.from.x + (CELL_POSITION.to.x - CELL_POSITION.from.x) * smoothstep(0, 0.8, p)
}

function posY(p: number) {
  return CELL_POSITION.from.y + (CELL_POSITION.to.y - CELL_POSITION.from.y) * smoothstep(0, 0.8, p)
}

interface Props {
  pointerEnabled: boolean
}

export default function CtaCell({ pointerEnabled }: Props) {
  const viewport = useThree((s) => s.viewport)
  const size = useThree((s) => s.size)

  const { half, span0 } = useMemo(() => {
    const worldPerPx = viewport.width / Math.max(1, size.width)
    const halfPx = cellDiameterPx(size.width) / (2 * CELL_RADIUS)
    const halfWorld = halfPx * worldPerPx

    const seedHalf = (SEED.plane / 2) * SEED.finalScale * impactFit(viewport.width)

    return { half: halfWorld, span0: Math.min(1, seedHalf / Math.max(1e-4, halfWorld)) }
  }, [viewport.width, size.width])

  const pointGeo = useMemo(() => {
    const points = buildCellPoints()
    const g = new THREE.BufferGeometry()
    const n = points.length

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))

    const radius = new Float32Array(n)
    const phase = new Float32Array(n)
    const speed = new Float32Array(n)
    const tilt = new Float32Array(n)
    const psize = new Float32Array(n)
    points.forEach((p, i) => {
      radius[i] = p.radius
      phase[i] = p.phase
      speed[i] = p.speed
      tilt[i] = p.tilt
      psize[i] = p.size
    })

    g.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aTilt', new THREE.BufferAttribute(tilt, 1))
    g.setAttribute('aSize', new THREE.BufferAttribute(psize, 1))
    return g
  }, [])

  const cellMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CELL_VERT,
        fragmentShader: CELL_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uSpan: { value: 0 },
          uCoreSpan: { value: 0 },
          uForm: { value: 0 },
          uInterior: { value: 0 },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uRadius: { value: CELL_RADIUS },
          uCore: { value: new THREE.Color('#e8fff0') },
          uHalo: { value: new THREE.Color('#a6ff6a') },
          uMembrane: { value: new THREE.Color('#124f3b') },
        },
      }),
    [],
  )

  const pointMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uSpan: { value: 0 },
          uRadius: { value: CELL_RADIUS },
          uScale: { value: 1 },
          uPixel: { value: 1 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color('#c6f5e1') },
        },
      }),
    [],
  )

  useEffect(
    () => () => {
      pointGeo.dispose()
      cellMat.dispose()
      pointMat.dispose()
    },
    [pointGeo, cellMat, pointMat],
  )

  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const points = useRef<THREE.Points>(null)
  const drift = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const visible = ctaVisible()
    g.visible = visible
    if (!visible) return

    const p = scrollProgress.ctaForm
    const t = state.clock.elapsedTime
    const form = ctaForm(p)
    const interior = ctaInterior(p)

    const span = span0 + (1 - span0) * ctaSpan(p)

    const cu = cellMat.uniforms
    cu.uSpan.value = span
    cu.uCoreSpan.value = span0 * (1 + 0.34 * ctaSpan(p))
    cu.uForm.value = form
    cu.uInterior.value = interior
    cu.uTime.value = t
    cu.uOpacity.value = 0.95 + 0.05 * form

    const pu = pointMat.uniforms
    pu.uTime.value = t
    pu.uSpan.value = span
    pu.uScale.value = half
    pu.uPixel.value = state.gl.getPixelRatio()
    pu.uOpacity.value = interior * 0.62

    if (points.current) points.current.visible = interior > 0.004

    g.rotation.z = Math.sin(t * 0.07) * 0.0032

    const worldPerPx = viewport.width / Math.max(1, size.width)
    const tx = pointerEnabled ? state.pointer.x * 4 * worldPerPx : 0
    const ty = pointerEnabled ? state.pointer.y * 3 * worldPerPx : 0
    const k = 1 - Math.exp(-Math.min(0.05, delta) * 3.2)
    drift.current.x += (tx - drift.current.x) * k
    drift.current.y += (ty - drift.current.y) * k

    const depart = scrollProgress.ctaDepart * viewport.height

    g.position.x = viewport.width * (posX(p) - 0.5) + drift.current.x
    g.position.y = viewport.height * (0.5 - posY(p)) + drift.current.y + depart

    if (mesh.current) mesh.current.scale.setScalar(half)
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={mesh} renderOrder={2}>
        <planeGeometry args={[2, 2]} />
        <primitive object={cellMat} attach="material" />
      </mesh>

      <points ref={points} geometry={pointGeo} frustumCulled={false} renderOrder={3}>
        <primitive object={pointMat} attach="material" />
      </points>
    </group>
  )
}
