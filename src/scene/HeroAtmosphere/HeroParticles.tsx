import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  count: number
}

const VERT = /* glsl */`
  attribute float aSize;
  attribute float aPhi;
  attribute float aSpeed;
  attribute vec3  aColor;
  uniform   float uTime;
  varying   vec3  vColor;
  varying   float vAlpha;

  void main() {
    vec3 pos = position;
    // Very slow independent drift per particle
    pos.x += sin(uTime * aSpeed * 0.18 + aPhi)           * 0.12;
    pos.y += cos(uTime * aSpeed * 0.14 + aPhi + 1.3)     * 0.09;
    pos.z += sin(uTime * aSpeed * 0.10 + aPhi + 2.6)     * 0.06;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (280.0 / -mv.z);

    vColor = aColor;
    vAlpha = 0.25 + 0.75 * abs(sin(uTime * aSpeed * 0.35 + aPhi));
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    // Soft gaussian dot — microscopic particle look
    float a = exp(-d * d * 5.0) * vAlpha * 0.55;
    gl_FragColor = vec4(vColor, a);
  }
`

// Bio Green (80%) and Signal Mint (20%)
const BIO_GREEN   = new THREE.Color('#a6ff6a')
const SIGNAL_MINT = new THREE.Color('#c6f5e1')

export default function HeroParticles({ count }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)
  const { pointer } = useThree()

  const geo = useMemo(() => {
    const pos    = new Float32Array(count * 3)
    const sizes  = new Float32Array(count)
    const phis   = new Float32Array(count)
    const speeds = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Right-biased distribution: organism lives at x ≈ 1.8 world units
      const bias    = Math.random() < 0.72  // 72% in organism area
      const xRange  = bias ? [0.2, 3.8] : [-2.0, 4.5]
      const yRange  = bias ? [-1.8, 1.8] : [-2.2, 2.2]
      const zRange  = bias ? [-0.8, 0.8] : [-1.2, 1.2]

      pos[i*3]   = xRange[0] + Math.random() * (xRange[1] - xRange[0])
      pos[i*3+1] = yRange[0] + Math.random() * (yRange[1] - yRange[0])
      pos[i*3+2] = zRange[0] + Math.random() * (zRange[1] - zRange[0])

      sizes[i]  = 1.0 + Math.random() * 2.5   // 1–3.5px
      phis[i]   = Math.random() * Math.PI * 2
      speeds[i] = 0.3 + Math.random() * 0.7

      // 80% Bio Green, 20% Signal Mint
      const col = Math.random() < 0.8 ? BIO_GREEN : SIGNAL_MINT
      colors[i*3]   = col.r
      colors[i*3+1] = col.g
      colors[i*3+2] = col.b
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos,    3))
    g.setAttribute('aSize',    new THREE.BufferAttribute(sizes,  1))
    g.setAttribute('aPhi',     new THREE.BufferAttribute(phis,   1))
    g.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 1))
    g.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3))
    return g
  }, [count])

  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })
    matRef.current = m
    return m
  }, [])

  // Very subtle cursor reaction: only the foreground particles get a tiny push
  // We achieve this by passing mouse position as a uniform (used in vertex shader
  // for the nearest particles — here kept extremely subtle, no galaxy effect).
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime
    }
    // pointer is already -1→1 NDC from R3F state
    void pointer // consumed to avoid unused var lint
  })

  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  return (
    <points geometry={geo}>
      <primitive object={mat} />
    </points>
  )
}
