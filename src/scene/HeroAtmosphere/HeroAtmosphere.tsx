import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useState } from 'react'
import HeroParticles from './HeroParticles'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export default function HeroAtmosphere() {
  const isMobile  = useMediaQuery('(max-width: 768px)')
  const isTablet  = useMediaQuery('(max-width: 1024px)')
  const [dpr, setDpr] = useState(isMobile ? 1 : 1.5)

  const particleCount = isMobile ? 150 : isTablet ? 350 : 600

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 50 }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => setDpr(Math.max(0.75, dpr - 0.5))}
        onIncline={() => setDpr(Math.min(isMobile ? 1.5 : 2, dpr + 0.25))}
      />
      <HeroParticles count={particleCount} />
    </Canvas>
  )
}
