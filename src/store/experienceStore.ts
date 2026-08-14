import { create } from 'zustand'

interface ExperienceState {
  /** 0–1: scroll progress through the Hero exit tunnel */
  heroExitProgress: number
  /** Device capability tier — set once on mount */
  deviceTier: 'high' | 'mid' | 'low'

  setHeroExitProgress: (p: number) => void
  setDeviceTier: (t: ExperienceState['deviceTier']) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  heroExitProgress: 0,
  deviceTier: 'high',
  setHeroExitProgress: (heroExitProgress) => set({ heroExitProgress }),
  setDeviceTier: (deviceTier) => set({ deviceTier }),
}))
