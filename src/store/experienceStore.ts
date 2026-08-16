import { create } from 'zustand'
import type { ImpactStageId } from '@/sections/Impact/impact.constants'
import type { TechnologyStageId } from '@/sections/Technology/technology.constants'
import type { SectionId } from '@/lib/sections'

export type DeviceTier = 'high' | 'mid' | 'low'

interface ExperienceState {
  booted: boolean
  heroExitProgress: number
  deviceTier: DeviceTier
  currentSection: SectionId
  canvasActive: boolean
  technologyStage: TechnologyStageId | null
  impactStage: ImpactStageId | null
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

if (import.meta.env.DEV) {
  ;(window as unknown as { __experience?: typeof useExperienceStore }).__experience =
    useExperienceStore
}
