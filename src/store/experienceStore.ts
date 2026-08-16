import { create } from 'zustand'
import type { ImpactStageId } from '@/sections/Impact/impact.constants'
import type { TechnologyStageId } from '@/sections/Technology/technology.constants'
import type { SectionId } from '@/lib/sections'

export type DeviceTier = 'high' | 'mid' | 'low'

interface ExperienceState {
  /**
   * False until the loader has handed over. Everything that animates *in* on
   * arrival — the header, the Hero's entrance — waits on this, so the page
   * does not play its opening behind a cover and arrive already finished.
   */
  booted: boolean
  /** 0–1: scroll progress through the Hero exit tunnel */
  heroExitProgress: number
  /**
   * Device capability tier, resolved once on mount from pragmatic signals
   * (§40). Drives DPR and every scene's population, so it is read at mount
   * rather than watched: re-tiering mid-session would rebuild every buffer on
   * the page.
   */
  deviceTier: DeviceTier
  /**
   * Which section owns the viewport. Discrete and low-frequency — it changes
   * eight times in a full pass — so the header can subscribe to it without
   * re-rendering during scroll.
   */
  currentSection: SectionId
  /**
   * False once an opaque section has fully covered the persistent canvas, so
   * the render loop can stop instead of drawing frames nobody can see
   * (prompt §42 — Innovation should be the GPU's quiet phase).
   *
   * Discrete and low-frequency, which is why it belongs here rather than in
   * progressRef: it flips at most a handful of times per session.
   */
  canvasActive: boolean
  /**
   * Which Technology stage is current, or null while the section is out of
   * range. Discrete by design: continuous section progress travels through
   * progressRef, and this flips five times per pass (prompt §57).
   *
   * Null is also the scene's arming switch — nothing in the platform, including
   * its two textures, is mounted until the section is one viewport away.
   */
  technologyStage: TechnologyStageId | null
  /**
   * Which Impact metric is current, or null while the section is out of range.
   * Three flips per pass, so it belongs here and not in progressRef (§35).
   *
   * Null is also the scene's arming switch — no buffers, and no human-impact
   * image, are built until the section is one viewport away (§52).
   */
  impactStage: ImpactStageId | null
  /**
   * Whether the closing cell is built. Armed a viewport before section 08 and
   * disarmed on the way back up, exactly like `impactStage`.
   *
   * It is also the page's last piece of resource bookkeeping: the same trigger
   * that sets this true releases Impact's network, so the heaviest scene on the
   * page and the lightest are never allocated at the same time (§53).
   */
  ctaArmed: boolean

  setBooted: (booted: boolean) => void
  setHeroExitProgress: (p: number) => void
  setDeviceTier: (t: DeviceTier) => void
  setCurrentSection: (id: SectionId) => void
  setCanvasActive: (active: boolean) => void
  setTechnologyStage: (stage: TechnologyStageId | null) => void
  setImpactStage: (stage: ImpactStageId | null) => void
  setCtaArmed: (armed: boolean) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  booted: false,
  heroExitProgress: 0,
  deviceTier: 'high',
  currentSection: 'hero',
  canvasActive: true,
  technologyStage: null,
  impactStage: null,
  ctaArmed: false,
  setBooted: (booted) => set({ booted }),
  setHeroExitProgress: (heroExitProgress) => set({ heroExitProgress }),
  setDeviceTier: (deviceTier) => set({ deviceTier }),
  setCurrentSection: (currentSection) => set({ currentSection }),
  setCanvasActive: (canvasActive) => set({ canvasActive }),
  setTechnologyStage: (technologyStage) => set({ technologyStage }),
  setImpactStage: (impactStage) => set({ impactStage }),
  setCtaArmed: (ctaArmed) => set({ ctaArmed }),
}))

// Dev-only handle, matching progressRef's and Lenis's: the verification scripts
// need to see the discrete state — which stage is current, whether the render
// loop is running — rather than infer it from pixels.
if (import.meta.env.DEV) {
  ;(window as unknown as { __experience?: typeof useExperienceStore }).__experience =
    useExperienceStore
}
