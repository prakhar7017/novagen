import type { DeviceTier } from '@/store/experienceStore'

export function resolveDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high'

  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 0
  const memory = nav.deviceMemory ?? 0
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const width = Math.min(window.screen.width, window.screen.height)

  if ((cores > 0 && cores <= 4) || (memory > 0 && memory <= 2)) return 'low'

  if (coarse && width <= 480) return 'low'
  if (coarse) return 'mid'

  if ((cores > 0 && cores < 8) || (memory > 0 && memory < 8)) return 'mid'

  return 'high'
}

export const TIER_DPR: Record<DeviceTier, { initial: number; max: number; min: number }> = {
  high: { initial: 1.5, max: 1.75, min: 1.25 },
  mid: { initial: 1.25, max: 1.5, min: 1 },
  low: { initial: 1, max: 1.15, min: 0.85 },
}

export const TIER_SCALE: Record<DeviceTier, number> = {
  high: 1,
  mid: 0.68,
  low: 0.42,
}
