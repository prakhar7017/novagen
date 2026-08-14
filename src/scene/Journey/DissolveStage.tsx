import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { DISSOLVE_VERT, DISSOLVE_FRAG } from './shaders'
import { MILESTONE, remap, smoothstep, clamp01 } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'
import { HERO_ORGANISM } from '@/sections/Hero/heroGeometry'

const EDGE_COLOR = new THREE.Color('#a6ff6a')

/**
 * The dominant cell the camera selects inside the cluster, in texture UV.
 * Matches the large bright-nucleus cell right of centre in 02-cell-cluster.
 */
const FOCUS_CELL = new THREE.Vector2(0.58, 0.55)

/**
 * three types `Texture.image` loosely, so read the intrinsic size defensively —
 * it is also genuinely absent for a frame if a texture is still decoding.
 */
function textureAspect(tex: THREE.Texture, fallback: number): number {
  const img = tex.image as { width?: number; height?: number } | undefined
  return img?.width && img?.height ? img.width / img.height : fallback
}

/** Cover-fit: fill the plane, crop the overflow. */
function coverScale(texAspect: number, planeAspect: number, out: THREE.Vector2) {
  if (planeAspect > texAspect) out.set(1, texAspect / planeAspect)
  else out.set(planeAspect / texAspect, 1)
  return out
}

function makeDissolveMaterial(noiseScale: number) {
  return new THREE.ShaderMaterial({
    vertexShader: DISSOLVE_VERT,
    fragmentShader: DISSOLVE_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTexA: { value: null },
      uTexB: { value: null },
      uScaleA: { value: new THREE.Vector2(1, 1) },
      uOffsetA: { value: new THREE.Vector2(0, 0) },
      uScaleB: { value: new THREE.Vector2(1, 1) },
      uOffsetB: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0 },
      uHasB: { value: 0 },
      uAlpha: { value: 0 },
      uTime: { value: 0 },
      uNoiseScale: { value: noiseScale },
      uEdgeWidth: { value: 0.14 },
      uEdgeGlow: { value: 0.55 },
      uEdgeColor: { value: EDGE_COLOR },
    },
  })
}

export default function DissolveStage() {
  const viewport = useThree((s) => s.viewport)
  const size = useThree((s) => s.size)

  const [organismTex, cellsTex, nucleusTex] = useTexture([
    '/assets/story/01-organism.webp',
    '/assets/story/02-cell-cluster.webp',
    '/assets/story/03-nucleus.webp',
  ])

  useEffect(() => {
    for (const t of [organismTex, cellsTex, nucleusTex]) {
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      t.wrapS = THREE.ClampToEdgeWrapping
      t.wrapT = THREE.ClampToEdgeWrapping
    }
  }, [organismTex, cellsTex, nucleusTex])

  const organismMat = useMemo(() => makeDissolveMaterial(3.4), [])
  const stageMat = useMemo(() => makeDissolveMaterial(2.5), [])

  useEffect(
    () => () => {
      organismMat.dispose()
      stageMat.dispose()
    },
    [organismMat, stageMat],
  )

  const organismRef = useRef<THREE.Mesh>(null)

  // ── Geometry that mirrors the Hero's DOM organism ────────────────────────
  // Reproducing the CSS box in world units is what makes the handoff from the
  // Hero's <img> to WebGL invisible: both occupy the same screen rectangle.
  const organismBox = useMemo(() => {
    const vw = size.width
    const vh = size.height
    const worldPerPx = viewport.width / Math.max(vw, 1)

    const rect = HERO_ORGANISM.rect(vw, vh)
    const scaled = rect.width * HERO_ORGANISM.exitScale
    const centerXPx = rect.centerX + HERO_ORGANISM.exitX

    return {
      width: scaled * worldPerPx,
      height: scaled * worldPerPx,
      // CSS px (origin top-left, y down) → world units (origin centre, y up)
      x: (centerXPx - vw / 2) * worldPerPx,
      y: -(rect.centerY - vh / 2) * worldPerPx,
    }
  }, [size.width, size.height, viewport.width])

  const planeAspect = viewport.width / viewport.height

  // Scratch vectors — reused every frame so useFrame allocates nothing
  const tmp = useMemo(
    () => ({
      scaleA: new THREE.Vector2(),
      scaleB: new THREE.Vector2(),
      cover: new THREE.Vector2(),
    }),
    [],
  )

  useFrame((state) => {
    const j = scrollProgress.journey
    const t = state.clock.elapsedTime

    // ── Organism plane ─────────────────────────────────────────────────────
    // Fades in as the Hero's DOM organism fades out, settles, then erodes.
    const handoff = smoothstep(0.86, 1.0, scrollProgress.hero)
    const eroded = remap(j, MILESTONE.dissolveStart, MILESTONE.dissolveEnd)

    const ou = organismMat.uniforms
    ou.uTexA.value = organismTex
    ou.uHasB.value = 0
    ou.uProgress.value = eroded
    ou.uAlpha.value = handoff
    ou.uTime.value = t

    // The organism is square with a transparent margin, so it is placed
    // directly rather than cover-fitted.
    ou.uScaleA.value.set(1, 1)
    ou.uOffsetA.value.set(0, 0)

    if (organismRef.current) {
      // §11: settle toward centre-right and ease back in scale before dissolving
      const settle = smoothstep(0.0, 0.12, j)
      const s = 1 - settle * 0.08
      organismRef.current.scale.setScalar(s)
      organismRef.current.position.x = organismBox.x - settle * viewport.width * 0.07
      organismRef.current.visible = handoff > 0.001 && eroded < 0.999
    }

    // ── Stage plane: cell cluster → nucleus ────────────────────────────────
    const su = stageMat.uniforms
    su.uTime.value = t

    const cellsAspect = textureAspect(cellsTex, 16 / 9)
    const nucleusAspect = textureAspect(nucleusTex, 16 / 9)

    su.uTexA.value = cellsTex
    su.uTexB.value = nucleusTex

    if (j < MILESTONE.dissolveEnd) {
      // Materialise: run the same erosion backward so the cluster resolves
      // out of the noise instead of cross-fading in.
      su.uHasB.value = 0
      su.uProgress.value = 1 - eroded
    } else {
      // Cross-dissolve into the nucleus under a camera push
      su.uHasB.value = 1
      su.uProgress.value = remap(j, MILESTONE.pushStart, MILESTONE.pushEnd)
    }

    // Camera push: the cluster zooms toward the selected cell while the
    // nucleus arrives already close and settles back to its natural framing.
    const push = smoothstep(MILESTONE.dissolveEnd, MILESTONE.pushEnd, j)
    const zoomA = 1 + push * 1.95 // 1 → 2.95
    const zoomB = 1.45 - push * 0.45

    coverScale(cellsAspect, planeAspect, tmp.cover)
    su.uScaleA.value.set(tmp.cover.x / zoomA, tmp.cover.y / zoomA)
    su.uOffsetA.value.set((FOCUS_CELL.x - 0.5) * push, (FOCUS_CELL.y - 0.5) * push)

    coverScale(nucleusAspect, planeAspect, tmp.cover)
    su.uScaleB.value.set(tmp.cover.x / zoomB, tmp.cover.y / zoomB)
    su.uOffsetB.value.set(0, 0)

    // Visible from the moment the organism starts breaking up until the
    // nucleus has fully shattered into particles.
    const fadeIn = smoothstep(MILESTONE.dissolveStart, MILESTONE.dissolveStart + 0.02, j)
    const fadeOut = 1 - smoothstep(MILESTONE.shatterStart, MILESTONE.shatterEnd, j)
    su.uAlpha.value = clamp01(fadeIn * fadeOut)
  })

  return (
    <group>
      {/* Cell cluster → nucleus, full-bleed */}
      <mesh renderOrder={1} frustumCulled={false}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <primitive object={stageMat} attach="material" />
      </mesh>

      {/* Organism, matched to the Hero's on-screen rectangle */}
      <mesh
        ref={organismRef}
        renderOrder={2}
        position={[organismBox.x, organismBox.y, 0.01]}
        frustumCulled={false}
      >
        <planeGeometry args={[organismBox.width, organismBox.height]} />
        <primitive object={organismMat} attach="material" />
      </mesh>
    </group>
  )
}
