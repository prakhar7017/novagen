import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import HeroParticles from './HeroAtmosphere/HeroParticles'
import JourneyScene from './Journey/JourneyScene'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'

/**
 * The single persistent WebGL surface for the whole site.
 *
 * PAGE_STRUCTURE §14 forbids a canvas per section, so this one is fixed to the
 * viewport behind all content and every section draws into it. Because it never
 * unmounts, textures, geometry and the GL context survive across sections and
 * the Hero → Journey handoff needs no context re-initialisation.
 *
 * It is inert to input (`pointer-events: none`) and hidden from assistive tech;
 * all meaningful text lives in the DOM above it.
 */
export default function ExperienceCanvas() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTabletPortrait = useMediaQuery('(max-width: 900px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const reduced = useReducedMotion()
  const canvasActive = useExperienceStore((s) => s.canvasActive)

  const [dpr, setDpr] = useState(isMobile ? 1 : 1.5)

  const heroParticleCount = isMobile ? 150 : isTablet ? 350 : 600

  // Desktop sits at the low end of the 5–8k band; the morph is vertex-bound so
  // this leaves headroom on integrated GPUs (prompt §19).
  const journeyParticleCount = isMobile
    ? 1000
    : isTabletPortrait
      ? 2500
      : isTablet
        ? 3500
        : 6000

  return (
    <Canvas
      dpr={dpr}
      // Innovation and everything below it are opaque, so once one of them owns
      // the viewport there is nothing to draw. 'never' halts the loop entirely;
      // scrolling back flips it to 'always' and the scene resumes from the same
      // scroll-derived state, since every value is a pure function of progress.
      frameloop={canvasActive ? 'always' : 'never'}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 50 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.5))}
        onIncline={() => setDpr((d) => Math.min(isMobile ? 1.25 : 2, d + 0.25))}
      />

      <HeroParticles count={heroParticleCount} />

      {/* Under reduced motion the Journey is a static document instead — see
          JourneyStatic — so none of its scroll-driven WebGL is built. */}
      {!reduced && (
        <JourneyScene
          particleCount={journeyParticleCount}
          pointerEnabled={!isCoarsePointer}
          offsetVisual={!isTabletPortrait}
        />
      )}
    </Canvas>
  )
}
