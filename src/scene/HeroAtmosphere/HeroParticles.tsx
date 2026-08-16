import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollProgress } from '@/store/progressRef'
import { smoothstep } from '@/sections/Journey/journey.constants'

interface Props {
  count: number
}

const VERT = /* glsl */`
  attribute float aSize;
  attribute float aPhi;
  attribute float aSpeed;
  attribute vec3  aColor;
  uniform   float uTime;
  uniform   float uFade;
  uniform   float uPixelRatio;
  varying   vec3  vColor;
  varying   float vAlpha;

  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * aSpeed * 0.18 + aPhi)           * 0.12;
    pos.y += cos(uTime * aSpeed * 0.14 + aPhi + 1.3)     * 0.09;
    pos.z += sin(uTime * aSpeed * 0.10 + aPhi + 2.6)     * 0.06;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (8.0 / -mv.z);

    vColor = aColor;
    vAlpha = (0.25 + 0.75 * abs(sin(uTime * aSpeed * 0.35 + aPhi))) * uFade;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */`
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = exp(-d * d * 5.0) * vAlpha * 0.55;
    gl_FragColor = vec4(vColor, a);
  }
`

const BIO_GREEN   = new THREE.Color('#a6ff6a')
const SIGNAL_MINT = new THREE.Color('#c6f5e1')

export default function HeroParticles({ count }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  const geo = useMemo(() => {
    const pos    = new Float32Array(count * 3)
    const sizes  = new Float32Array(count)
    const phis   = new Float32Array(count)
    const speeds = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const bias    = Math.random() < 0.72
      const xRange  = bias ? [0.2, 3.8] : [-2.0, 4.5]
      const yRange  = bias ? [-1.8, 1.8] : [-2.2, 2.2]
      const zRange  = bias ? [-0.8, 0.8] : [-1.2, 1.2]

      pos[i*3]   = xRange[0] + Math.random() * (xRange[1] - xRange[0])
      pos[i*3+1] = yRange[0] + Math.random() * (yRange[1] - yRange[0])
      pos[i*3+2] = zRange[0] + Math.random() * (zRange[1] - zRange[0])

      sizes[i]  = 0.8 + Math.random() * 1.8
      phis[i]   = Math.random() * Math.PI * 2
      speeds[i] = 0.3 + Math.random() * 0.7

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
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uPixelRatio: { value: 1.5 },
      },
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })
    matRef.current = m
    return m
  }, [])

  useFrame(({ clock, gl }) => {
    if (!matRef.current) return
    matRef.current.uniforms.uTime.value = clock.elapsedTime
    matRef.current.uniforms.uPixelRatio.value = gl.getPixelRatio()
    matRef.current.uniforms.uFade.value = 1 - smoothstep(0.0, 0.14, scrollProgress.journey)
  })

  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  return (
    <points geometry={geo}>
      <primitive object={mat} />
    </points>
  )
}
