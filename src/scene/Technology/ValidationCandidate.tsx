import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { smoothstep } from '@/sections/Journey/journey.constants'
import {
  CANDIDATE_SRC,
  TECH_MILESTONE,
  techVisible,
} from '@/sections/Technology/technology.constants'
import { scrollProgress } from '@/store/progressRef'

const CANDIDATE_SIZE = 1.45

const RETICLE = { half: 1.16, arm: 0.24 }

const RETICLE_COLOR = new THREE.Color('#c6f5e1')

function buildReticle() {
  const { half: h, arm: a } = RETICLE
  const pts: number[] = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x = sx * h
      const y = sy * h
      pts.push(x, y, 0, x - sx * a, y, 0)
      pts.push(x, y, 0, x, y - sy * a, 0)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export default function ValidationCandidate() {
  const tex = useTexture(CANDIDATE_SRC)

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

  const reticleGeo = useMemo(buildReticle, [])
  const reticleMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: RETICLE_COLOR,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      mat.dispose()
      reticleGeo.dispose()
      reticleMat.dispose()
    },
    [mat, reticleGeo, reticleMat],
  )

  const meshRef = useRef<THREE.Mesh>(null)
  const reticleRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!techVisible()) return

    const p = scrollProgress.technology
    const M = TECH_MILESTONE

    const reveal = smoothstep(M.validateStart + 0.02, M.validateEnd, p)
    const lock = smoothstep(M.validateStart + 0.06, M.validateEnd + 0.03, p)
    const exit = smoothstep(M.exitStart, 1.0, p)

    mat.opacity = reveal * (1 - exit * 0.25)
    reticleMat.opacity = lock * 0.6 * (1 - exit)

    const mesh = meshRef.current
    if (mesh) {
      mesh.visible = mat.opacity > 0.002
      mesh.scale.setScalar((1.05 - reveal * 0.05) * (1 - exit * 0.14))
    }

    const ret = reticleRef.current
    if (ret) {
      ret.visible = reticleMat.opacity > 0.002
      ret.scale.setScalar((1.07 - lock * 0.07) * (1 - exit * 0.14))
    }

    const grp = groupRef.current
    if (grp) grp.position.set(exit * 0.62, exit * 0.44, 0)
  })

  return (
    <group ref={groupRef} renderOrder={6}>
      <mesh ref={meshRef} renderOrder={6} frustumCulled={false}>
        <planeGeometry args={[CANDIDATE_SIZE, CANDIDATE_SIZE]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <lineSegments
        ref={reticleRef}
        geometry={reticleGeo}
        frustumCulled={false}
        renderOrder={7}
      >
        <primitive object={reticleMat} attach="material" />
      </lineSegments>
    </group>
  )
}
