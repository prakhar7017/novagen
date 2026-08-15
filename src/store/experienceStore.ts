import { create } from 'zustand'
import type { TechnologyStageId } from '@/sections/Technology/technology.constants'

interface ExperienceState {
  /** 0–1: scroll progress through the Hero exit tunnel */
  heroExitProgress: number
  /** Device capability tier — set once on mount */
  deviceTier: 'high' | 'mid' | 'low'
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

  setHeroExitProgress: (p: number) => void
  setDeviceTier: (t: ExperienceState['deviceTier']) => void
  setCanvasActive: (active: boolean) => void
  setTechnologyStage: (stage: TechnologyStageId | null) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  heroExitProgress: 0,
  deviceTier: 'high',
  canvasActive: true,
  technologyStage: null,
  setHeroExitProgress: (heroExitProgress) => set({ heroExitProgress }),
  setDeviceTier: (deviceTier) => set({ deviceTier }),
  setCanvasActive: (canvasActive) => set({ canvasActive }),
  setTechnologyStage: (technologyStage) => set({ technologyStage }),
}))
