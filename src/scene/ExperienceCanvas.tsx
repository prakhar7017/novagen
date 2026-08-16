import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import HeroParticles from './HeroAtmosphere/HeroParticles'
import JourneyScene from './Journey/JourneyScene'
import TechnologyScene from './Technology/TechnologyScene'
import ImpactScene from './Impact/ImpactScene'
import CtaScene from './Cta/CtaScene'
import SceneWarmup from './SceneWarmup'
import CanvasRuntime from './CanvasRuntime'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import { TIER_DPR, TIER_SCALE } from '@/lib/deviceTier'

export default function ExperienceCanvas() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTabletPortrait = useMediaQuery('(max-width: 900px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const reduced = useReducedMotion()
  const tier = useExperienceStore((s) => s.deviceTier)

  const bounds = TIER_DPR[tier]

  const scale = TIER_SCALE[tier]
  const budget = (n: number) => Math.round(n * scale)

  const heroParticleCount = budget(isMobile ? 150 : isTablet ? 350 : 600)

  const journeyParticleCount = budget(
    isMobile ? 1000 : isTabletPortrait ? 2500 : isTablet ? 3500 : 6000,
  )

  const technologyNodes = budget(isTablet ? 160 : 218)

  const impactDensity = useMemo(() => {
    const [signals, nodes, maxLines] = isTabletPortrait
      ? [1300, 130, 160]
      : isTablet
        ? [2000, 180, 220]
        : [2600, 210, 260]
    return {
      signals: Math.round(signals * scale),
      nodes: Math.round(nodes * scale),
      maxLines: Math.round(maxLines * scale),
    }
  }, [isTabletPortrait, isTablet, scale])

  return (
    <Canvas
      dpr={bounds.initial}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.debug.checkShaderErrors = import.meta.env.DEV
      }}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 50 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <CanvasRuntime bounds={bounds} />

      <HeroParticles count={heroParticleCount} />

      {!reduced && (
        <JourneyScene
          particleCount={journeyParticleCount}
          pointerEnabled={!isCoarsePointer}
          offsetVisual={!isTabletPortrait}
        />
      )}

      {!reduced && !isMobile && (
        <TechnologyScene nodeCount={technologyNodes} offsetVisual={!isTabletPortrait} />
      )}

      {!reduced && !isMobile && (
        <ImpactScene
          density={impactDensity}
          offsetVisual={!isTabletPortrait}
          pointerEnabled={!isCoarsePointer}
        />
      )}

      {!reduced && !isMobile && <CtaScene pointerEnabled={!isCoarsePointer} />}

      <SceneWarmup />
    </Canvas>
  )
}
