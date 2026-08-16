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

// Kept out of the frame callback so nothing allocates there. The travel is a
// few dozen pixels — the target settling out of the headline's way (§21).
function posX(p: number) {
  return CELL_POSITION.from.x + (CELL_POSITION.to.x - CELL_POSITION.from.x) * smoothstep(0, 0.8, p)
}

function posY(p: number) {
  return CELL_POSITION.from.y + (CELL_POSITION.to.y - CELL_POSITION.from.y) * smoothstep(0, 0.8, p)
}

interface Props {
  /** Desktop pointer only — the closing frame gets less interaction than the Hero (§24) */
  pointerEnabled: boolean
}

/**
 * The closing biological cell (§7, §20–§24).
 *
 * Two draws: one quad for the membrane, core, glow and filaments, and thirty-four
 * points for the interior signals. That is the entire section's GPU cost, which
 * is the point — §52 asks the last dark scene on the page to be the lightest,
 * and everything expensive that ran above it has been disposed by the time this
 * is on screen.
 *
 * The one subtle piece of arithmetic is `uSpan`. The cell has to *begin* as a
 * pixel-exact copy of the point Impact collapsed to, then grow a frame around
 * that point without the point itself changing size. Scaling the mesh would
 * scale both. So the mesh is fixed at its final size and the shader divides
 * distance by `uSpan`, which starts at exactly the ratio between the seed's
 * on-screen half-extent and this cell's. At the handoff frame the two objects
 * are indistinguishable; one frame later only this one is drawn.
 */
export default function CtaCell({ pointerEnabled }: Props) {
  const viewport = useThree((s) => s.viewport)
  const size = useThree((s) => s.size)

  // ── Sizing ───────────────────────────────────────────────────────────────
  // Solved from a CSS-pixel target rather than authored in world units: §21 and
  // §40–§45 state the cell as a perceived diameter, and world units mean nothing
  // to the layout it has to sit beside.
  const { half, span0 } = useMemo(() => {
    const worldPerPx = viewport.width / Math.max(1, size.width)
    const halfPx = cellDiameterPx(size.width) / (2 * CELL_RADIUS)
    const halfWorld = halfPx * worldPerPx

    // Where Impact leaves its target, in the same units.
    const seedHalf = (SEED.plane / 2) * SEED.finalScale * impactFit(viewport.width)

    return { half: halfWorld, span0: Math.min(1, seedHalf / Math.max(1e-4, halfWorld)) }
  }, [viewport.width, size.width])

  // ── Interior population ──────────────────────────────────────────────────
  const pointGeo = useMemo(() => {
    const points = buildCellPoints()
    const g = new THREE.BufferGeometry()
    const n = points.length

    // The orbits are solved in the vertex shader, so `position` is never read —
    // but three's bounding-sphere machinery requires the attribute to exist.
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
          // The same three values Impact's seed ends on, plus the membrane —
          // §22's dark emerald, which on an additive surface over Abyss reads as
          // a translucent skin rather than as a filled disc.
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

    // span0 → 1: the inherited point holds its size on screen while the frame
    // around it opens out. At p = 0 this is Impact's seed exactly.
    const span = span0 + (1 - span0) * ctaSpan(p)

    const cu = cellMat.uniforms
    cu.uSpan.value = span
    // The point grows by a third while its frame roughly doubles: §22 asks for
    // a small central core, and the whole difference between a cell and a
    // target is which of the two is the subject.
    cu.uCoreSpan.value = span0 * (1 + 0.34 * ctaSpan(p))
    cu.uForm.value = form
    cu.uInterior.value = interior
    cu.uTime.value = t
    // Impact's seed ends at 0.95, not 1 — starting anywhere else would put a
    // step in the brightness at the exact frame the handoff happens.
    cu.uOpacity.value = 0.95 + 0.05 * form

    const pu = pointMat.uniforms
    pu.uTime.value = t
    pu.uSpan.value = span
    pu.uScale.value = half
    pu.uPixel.value = state.gl.getPixelRatio()
    pu.uOpacity.value = interior * 0.62

    if (points.current) points.current.visible = interior > 0.004

    // §23 — under a fifth of a degree, on a 90-second period. Present in a
    // long look, invisible in a short one.
    g.rotation.z = Math.sin(t * 0.07) * 0.0032

    // §24 — about four perceived pixels, and less than the Hero's. Frame-rate
    // independent smoothing, matching every other scene on the page.
    const worldPerPx = viewport.width / Math.max(1, size.width)
    const tx = pointerEnabled ? state.pointer.x * 4 * worldPerPx : 0
    const ty = pointerEnabled ? state.pointer.y * 3 * worldPerPx : 0
    const k = 1 - Math.exp(-Math.min(0.05, delta) * 3.2)
    drift.current.x += (tx - drift.current.x) * k
    drift.current.y += (ty - drift.current.y) * k

    // The cell travels with the page once the closing stage is released, so it
    // does not float over the footer that rises past it.
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
