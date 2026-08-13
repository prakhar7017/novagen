import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Cell layout ───────────────────────────────────────────────────────────────
interface CellConfig {
  pos: [number, number, number]
  r: number
  spd: number
  phi: number
}

const CELLS: CellConfig[] = [
  { pos: [ 0.00,  0.08,  0.00], r: 0.52, spd: 1.00, phi: 0.0 },
  { pos: [ 0.60, -0.22,  0.10], r: 0.46, spd: 0.85, phi: 1.3 },
  { pos: [-0.62, -0.08,  0.00], r: 0.44, spd: 1.10, phi: 2.1 },
  { pos: [ 0.08, -0.68,  0.10], r: 0.40, spd: 0.95, phi: 0.6 },
  { pos: [ 0.58,  0.52, -0.10], r: 0.38, spd: 1.20, phi: 3.0 },
  { pos: [-0.52,  0.50,  0.00], r: 0.36, spd: 0.75, phi: 1.8 },
  { pos: [-0.05,  0.78,  0.00], r: 0.30, spd: 1.30, phi: 0.4 },
  { pos: [ 0.28, -0.52,  0.40], r: 0.27, spd: 0.90, phi: 2.5 },
  { pos: [-0.68, -0.48,  0.10], r: 0.24, spd: 1.15, phi: 1.1 },
  { pos: [ 0.88,  0.08,  0.20], r: 0.20, spd: 1.40, phi: 2.8 },
]

// Pairs of cells close enough to exchange signals
const SIGNAL_PAIRS: [number, number][] = (() => {
  const pairs: [number, number][] = []
  for (let i = 0; i < CELLS.length; i++) {
    for (let j = i + 1; j < CELLS.length; j++) {
      const [ax, ay, az] = CELLS[i].pos
      const [bx, by, bz] = CELLS[j].pos
      const d = Math.sqrt((ax-bx)**2 + (ay-by)**2 + (az-bz)**2)
      if (d < 0.84) pairs.push([i, j])
    }
  }
  return pairs
})()

// ── Shared vertex shader (used by membrane + glow) ────────────────────────────
const WORLD_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// ── Membrane shader ───────────────────────────────────────────────────────────
// Dark teal base, teal-cyan Fresnel rim, animated vein network with
// traveling energy pulse, inner nucleus fill, global heartbeat uniform.
const MEM_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uBreath;   // sin, per-cell breathing phase
  uniform float uHeartbeat; // sin, global collective pulse (0-1 mapped)

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 397.297, 491.187));
    p += dot(p.zxy, p.yxz + 19.19);
    return fract(p.x * p.y * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i),          hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
      f.z);
  }

  void main() {
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float nv      = abs(dot(normalize(vNormal), viewDir));
    float rim     = pow(1.0 - nv, 1.8);   // Fresnel — bright at silhouette
    float fill    = pow(nv, 2.8);          // face-on inner glow (nucleus light)

    // ── Vein network ──────────────────────────────────────────────────
    float v1 = vnoise(vNormal * 5.2 + uTime * 0.07);
    float v2 = vnoise(vNormal * 9.5 - uTime * 0.05);
    float vein = smoothstep(0.40, 0.52, v1) * smoothstep(0.43, 0.50, v2);

    // ── Traveling energy pulse along veins ────────────────────────────
    // A noise coordinate remapped to create a wavefront sweeping through
    // the vein network — gives the "signal firing" look from the image.
    float coord = vnoise(vNormal * 3.8) * 8.0;
    float wave  = smoothstep(0.25, 0.85, sin(coord - uTime * 2.2) * 0.5 + 0.5);
    float energy = vein * wave;

    float breath = 0.60 + 0.40 * uBreath;
    float heart  = 0.82 + 0.18 * uHeartbeat; // subtle collective brightening

    // ── Colors (matched to image.png) ────────────────────────────────
    vec3 base      = vec3(0.020, 0.130, 0.072);
    vec3 rimCol    = vec3(0.00,  0.74,  0.58);  // teal-cyan rim
    vec3 veinCol   = vec3(0.18,  0.95,  0.38);  // bright green veins
    vec3 energyCol = vec3(0.55,  1.00,  0.55);  // bright pulse on veins
    vec3 fillCol   = vec3(0.04,  0.32,  0.14);  // faint interior glow

    vec3 col = base
      + rimCol    * rim    * (0.80 * heart)
      + veinCol   * vein   * breath
      + energyCol * energy * 0.85
      + fillCol   * fill   * 0.30;

    float alpha = 0.13
      + rim    * 0.44
      + vein   * 0.18
      + energy * 0.24
      + fill   * 0.10;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
  }
`

// ── Nucleus core shader ───────────────────────────────────────────────────────
// Bright yellow-green sphere; flares with pulse; rim slightly cooler.
const NUC_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uPhase;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float nv      = max(0.0, dot(normalize(vNormal), viewDir));
    float flare   = 0.72 + 0.28 * sin(uTime * 2.5 + uPhase);
    // Center: warm yellow-green. Rim: slightly cooler green.
    vec3 col = mix(vec3(0.55, 1.0, 0.05), vec3(0.85, 1.0, 0.30), nv) * flare;
    gl_FragColor = vec4(col, 1.0);
  }
`

// ── Nucleus glow halo shader (reverse Fresnel, additive) ─────────────────────
// Multiple concentric spheres with this shader create a fake bloom effect
// matching the luminous nucleus glow in the reference image.
const GLOW_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uPhase;
  uniform float uOpacity;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float nv      = max(0.0, dot(normalize(vNormal), viewDir));
    // Reverse Fresnel: bright face-on, fades toward silhouette
    float glow    = pow(nv, 1.3);
    float pulse   = 0.68 + 0.32 * sin(uTime * 2.5 + uPhase);
    vec3  col     = vec3(0.62, 1.0, 0.06) * pulse;
    gl_FragColor  = vec4(col, glow * uOpacity * pulse);
  }
`

// ── Signal line shaders ───────────────────────────────────────────────────────
// aEndpoint: 0 at line start, 1 at line end — interpolated per fragment.
// A bright pulse front sweeps from 0→1 periodically (cell communication).
const SIG_VERT = /* glsl */`
  attribute float aEndpoint;
  varying float vT;
  void main() {
    vT = aEndpoint;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const SIG_FRAG = /* glsl */`
  uniform float uCycle; // advances 0→1 over time, looping

  varying float vT;

  void main() {
    float front = fract(uCycle);
    // Wrap-around distance from pulse front to this fragment's position on line
    float d = abs(vT - front);
    d = min(d, 1.0 - d);
    float pulse = smoothstep(0.14, 0.0, d);
    float alpha = 0.055 + pulse * 0.52;
    vec3 col    = mix(vec3(0.10, 0.82, 0.42), vec3(0.60, 1.0, 0.30), pulse);
    gl_FragColor = vec4(col, alpha);
  }
`

// ── Cell component ────────────────────────────────────────────────────────────
function Cell({ pos, r, spd, phi }: CellConfig) {
  const groupRef = useRef<THREE.Group>(null)

  const memMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WORLD_VERT,
    fragmentShader: MEM_FRAG,
    uniforms: {
      uTime:      { value: 0 },
      uBreath:    { value: 0 },
      uHeartbeat: { value: 0 },
    },
    transparent: true,
    side:        THREE.DoubleSide,
    depthWrite:  false,
  }), [])

  const nucMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WORLD_VERT,
    fragmentShader: NUC_FRAG,
    uniforms: { uTime: { value: 0 }, uPhase: { value: phi } },
  }), [phi])

  // Two halo spheres — inner (tight glow) and outer (soft corona)
  const innerGlowMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WORLD_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: { uTime: { value: 0 }, uPhase: { value: phi }, uOpacity: { value: 0.38 } },
    transparent: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  }), [phi])

  const outerGlowMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   WORLD_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: { uTime: { value: 0 }, uPhase: { value: phi }, uOpacity: { value: 0.16 } },
    transparent: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  }), [phi])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const breath    = Math.sin(t * spd + phi)
    const heartbeat = Math.sin(t * 0.85)        // global ~0.85 Hz heartbeat

    if (groupRef.current) {
      groupRef.current.scale.setScalar(1.0 + breath * 0.023)
    }
    memMat.uniforms.uTime.value      = t
    memMat.uniforms.uBreath.value    = breath
    memMat.uniforms.uHeartbeat.value = heartbeat
    nucMat.uniforms.uTime.value      = t
    innerGlowMat.uniforms.uTime.value = t
    outerGlowMat.uniforms.uTime.value = t
  })

  useEffect(() => () => {
    memMat.dispose(); nucMat.dispose()
    innerGlowMat.dispose(); outerGlowMat.dispose()
  }, [memMat, nucMat, innerGlowMat, outerGlowMat])

  return (
    <group ref={groupRef} position={pos}>
      {/* Membrane */}
      <mesh renderOrder={2}>
        <sphereGeometry args={[r, 48, 48]} />
        <primitive object={memMat} />
      </mesh>
      {/* Outer nucleus corona — largest halo, softest */}
      <mesh renderOrder={3}>
        <sphereGeometry args={[r * 0.52, 14, 14]} />
        <primitive object={outerGlowMat} />
      </mesh>
      {/* Inner nucleus glow ring */}
      <mesh renderOrder={4}>
        <sphereGeometry args={[r * 0.30, 12, 12]} />
        <primitive object={innerGlowMat} />
      </mesh>
      {/* Nucleus core — solid bright sphere */}
      <mesh renderOrder={5}>
        <sphereGeometry args={[r * 0.13, 16, 16]} />
        <primitive object={nucMat} />
      </mesh>
    </group>
  )
}

// ── Inter-cell signal lines ───────────────────────────────────────────────────
// Bright pulse sweeps along each connection between neighbouring cells,
// simulating the neural/chemical signalling visible in the reference image.
function CellSignals() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  const geo = useMemo(() => {
    const verts:     number[] = []
    const endpoints: number[] = []

    for (const [i, j] of SIGNAL_PAIRS) {
      const [ax, ay, az] = CELLS[i].pos
      const [bx, by, bz] = CELLS[j].pos
      verts.push(ax, ay, az, bx, by, bz)
      endpoints.push(0, 1)
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position',  new THREE.BufferAttribute(new Float32Array(verts),     3))
    g.setAttribute('aEndpoint', new THREE.BufferAttribute(new Float32Array(endpoints), 1))
    return g
  }, [])

  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader:   SIG_VERT,
      fragmentShader: SIG_FRAG,
      uniforms: { uCycle: { value: 0 } },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })
    matRef.current = m
    return m
  }, [])

  useFrame(({ clock }) => {
    // One signal sweep every ~2.6 s
    if (matRef.current) matRef.current.uniforms.uCycle.value = clock.elapsedTime * 0.38
  })

  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  return (
    <lineSegments geometry={geo} renderOrder={1}>
      <primitive object={mat} />
    </lineSegments>
  )
}

// ── Ambient halo + energy tendril ─────────────────────────────────────────────
// Scattered glow specks around the cluster (from image) + a rightward
// energy stream matching the particle trail visible in the image.
function Halo() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  const geo = useMemo(() => {
    const AMBIENT = 80
    const TENDRIL = 35
    const COUNT   = AMBIENT + TENDRIL

    const pos   = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const phis  = new Float32Array(COUNT)
    const tints = new Float32Array(COUNT) // 0=green, 1=teal

    // Ambient — spherical scatter around cluster
    for (let i = 0; i < AMBIENT; i++) {
      const r     = 1.4 + Math.random() * 1.15
      const theta = Math.random() * Math.PI * 2
      const psi   = Math.acos(2 * Math.random() - 1)
      pos[i*3]   = r * Math.sin(psi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(psi) * Math.sin(theta) * 0.78
      pos[i*3+2] = r * Math.cos(psi) * 0.5
      sizes[i]   = 1.2 + Math.random() * 3.8
      phis[i]    = Math.random() * Math.PI * 2
      tints[i]   = Math.random() < 0.35 ? 1.0 : 0.0
    }

    // Tendril — energy stream drifting rightward (matches image)
    for (let i = 0; i < TENDRIL; i++) {
      const idx = AMBIENT + i
      const t   = i / TENDRIL
      pos[idx*3]   = 1.3 + t * 1.4 + (Math.random() - 0.5) * 0.25
      pos[idx*3+1] = (Math.random() - 0.5) * 0.5 * (1 - t * 0.6)
      pos[idx*3+2] = (Math.random() - 0.5) * 0.3
      sizes[idx]   = 0.8 + Math.random() * 2.2
      phis[idx]    = Math.random() * Math.PI * 2
      tints[idx]   = 0.5 + Math.random() * 0.5 // tendril is more teal
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos,   3))
    g.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aPhi',     new THREE.BufferAttribute(phis,  1))
    g.setAttribute('aTint',    new THREE.BufferAttribute(tints, 1))
    return g
  }, [])

  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        attribute float aSize;
        attribute float aPhi;
        attribute float aTint;
        uniform float uTime;
        varying float vAlpha;
        varying float vTint;
        void main() {
          vec3 p = position;
          // Gentle drift with unique per-particle phase
          p.x += sin(uTime * 0.32 + aPhi)        * 0.09;
          p.y += cos(uTime * 0.26 + aPhi + 1.1)  * 0.07;
          p.z += sin(uTime * 0.19 + aPhi + 2.3)  * 0.05;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (265.0 / -mv.z);
          vAlpha = 0.20 + 0.80 * abs(sin(uTime * 0.85 + aPhi));
          vTint  = aTint;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        varying float vAlpha;
        varying float vTint;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if (d > 1.0) discard;
          float a = exp(-d * d * 6.0) * vAlpha * 0.48;
          // Green <-> teal mix per particle
          vec3 col = mix(vec3(0.15, 0.90, 0.42), vec3(0.00, 0.75, 0.65), vTint);
          gl_FragColor = vec4(col, a);
        }
      `,
      uniforms:    { uTime: { value: 0 } },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })
    matRef.current = m
    return m
  }, [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  return <points geometry={geo} renderOrder={0}><primitive object={mat} /></points>
}

// ── Root organism ─────────────────────────────────────────────────────────────
export default function Organism() {
  const clusterRef = useRef<THREE.Group>(null)

  useFrame(({ clock, pointer }) => {
    if (!clusterRef.current) return
    const t = clock.elapsedTime
    clusterRef.current.rotation.y = t * 0.040 + pointer.x * 0.12
    clusterRef.current.rotation.x = Math.sin(t * 0.026) * 0.07 - pointer.y * 0.07
  })

  return (
    <group position={[1.8, 0, 0]}>
      <group ref={clusterRef}>
        <CellSignals />
        {CELLS.map((c, i) => <Cell key={i} {...c} />)}
        <Halo />
      </group>
    </group>
  )
}
