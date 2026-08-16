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
  const tier = useExperienceStore((s) => s.deviceTier)

  // The tier is resolved before the first paint and never changes, so this is
  // the resolution the canvas is created at; CanvasRuntime owns every change
  // to it from there, without re-rendering anything.
  const bounds = TIER_DPR[tier]

  // Applied to every population below, so a mid-tier laptop and a mid-tier
  // phone each come down from their own baseline rather than meeting at one
  // number (§40).
  const scale = TIER_SCALE[tier]
  const budget = (n: number) => Math.round(n * scale)

  const heroParticleCount = budget(isMobile ? 150 : isTablet ? 350 : 600)

  // Desktop sits at the low end of the 5–8k band; the morph is vertex-bound so
  // this leaves headroom on integrated GPUs (prompt §19).
  const journeyParticleCount = budget(
    isMobile ? 1000 : isTabletPortrait ? 2500 : isTablet ? 3500 : 6000,
  )

  // Deliberately two orders of magnitude below the Journey: this section reads
  // as an instrument, and §25 caps the network at 250 nodes because past that
  // the clusters stop being legible as separate regions — a limit of the eye
  // long before it is a limit of the GPU.
  const technologyNodes = budget(isTablet ? 160 : 218)

  // Impact's budget goes to the signal field rather than to the network: §15
  // asks for 1,500–3,000 lightweight particles behind 100–250 legible nodes,
  // because 14.8M is a claim about density and only the smaller population is
  // ever read as individual relationships. Below 769px the section is a
  // flowing document with drawn diagrams, so none of this is built there.
  //
  // Memoised, and that is load-bearing rather than tidiness. ImpactScene keys
  // `buildImpactTargets` off this object's identity, so an inline literal here
  // meant every render of this component — every DPR nudge, every canvasActive
  // flip — rebuilt 2,600 signal positions, 210 nodes, the neighbour graph and
  // every BufferGeometry on the main thread. Together with the DPR monitor
  // below that formed a loop: slow frames nudged the DPR, the nudge rebuilt the
  // buffers, the rebuild made the frames slower.
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
      // Three reads three info logs and a link status back from the driver the
      // first time each program is used. Those reads dominated the scroll
      // profile at 3.6s, but measuring with them removed showed why: they are
      // where the thread *observes* the compile, not where the cost is, and
      // taking them away simply moves the same wait to the first draw. The real
      // fix is SceneWarmup below. This stays off in production because a few
      // hundred native calls are still a few hundred native calls, and stays on
      // in development because shader errors are otherwise silent.
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
      {/* Frameloop and resolution, both driven from inside the canvas so that
          neither costs a render of this tree. */}
      <CanvasRuntime bounds={bounds} />

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

      {/* Below 769px Technology is a normally-flowing document with drawn
          diagrams rather than a pinned WebGL sequence (§49), so there is
          nothing for the canvas to do there either. */}
      {!reduced && !isMobile && (
        <TechnologyScene nodeCount={technologyNodes} offsetVisual={!isTabletPortrait} />
      )}

      {/* Same gate as Technology: below 769px, and under reduced motion, Impact
          is a normally-flowing document with drawn diagrams (§41, §49), so
          there is nothing for the canvas to do there either. */}
      {!reduced && !isMobile && (
        <ImpactScene
          density={impactDensity}
          offsetVisual={!isTabletPortrait}
          pointerEnabled={!isCoarsePointer}
        />
      )}

      {/* The closing cell (§20). Two draws and thirty-four points — the
          lightest scene on the page, by the time the heaviest has been
          disposed. Same gate as the two above it: below 769px and under
          reduced motion the cell is drawn in SVG instead. */}
      {!reduced && !isMobile && <CtaScene pointerEnabled={!isCoarsePointer} />}

      {/* Last, so every scene above has built its materials by the time this
          runs. See SceneWarmup for why the compile happens here at all. */}
      <SceneWarmup />
    </Canvas>
  )
}
