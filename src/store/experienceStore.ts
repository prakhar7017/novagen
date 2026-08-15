import { create } from 'zustand'

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

  setHeroExitProgress: (p: number) => void
  setDeviceTier: (t: ExperienceState['deviceTier']) => void
  setCanvasActive: (active: boolean) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  heroExitProgress: 0,
  deviceTier: 'high',
  canvasActive: true,
  setHeroExitProgress: (heroExitProgress) => set({ heroExitProgress }),
  setDeviceTier: (deviceTier) => set({ deviceTier }),
  setCanvasActive: (canvasActive) => set({ canvasActive }),
}))
