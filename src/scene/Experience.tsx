import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useState } from 'react'
import Organism from './Organism'

export default function Experience() {
  const [dpr, setDpr] = useState(1.5)

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100 }}
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
    >
      {/* Reduce DPR if frame rate drops */}
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 2))}
      />

      <Organism />
    </Canvas>
  )
}
