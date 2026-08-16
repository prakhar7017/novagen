import type { DeviceTier } from '@/store/experienceStore'

/**
 * Resolve a rendering budget from pragmatic signals (§40).
 *
 * Deliberately *not* fingerprinting: no GPU string parsing, no benchmark loop,
 * no canvas hashing. Four cheap, honest indicators — core count, declared
 * memory, pointer type and screen size — are enough to tell a phone from a
 * workstation, and everything they get wrong is corrected within a second or
 * two by the runtime DPR monitor that watches actual frame times.
 *
 * `deviceMemory` and `hardwareConcurrency` are both optional in the platform
 * and absent in Safari and Firefox respectively, so each only ever *lowers*
 * confidence — a missing value never demotes a machine on its own.
 */
export function resolveDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high'

  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 0
  const memory = nav.deviceMemory ?? 0
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const width = Math.min(window.screen.width, window.screen.height)

  // Anything that reports very little of either is drawing on a budget the
  // full desktop populations will not fit inside.
  if ((cores > 0 && cores <= 4) || (memory > 0 && memory <= 2)) return 'low'

  // A touch device with a small screen is a phone whatever it claims about
  // cores — recent ones report eight, and still throttle within a minute of
  // sustained full-rate shading.
  if (coarse && width <= 480) return 'low'
  if (coarse) return 'mid'

  if ((cores > 0 && cores < 8) || (memory > 0 && memory < 8)) return 'mid'

  return 'high'
}

/**
 * Device pixel ratio per tier (§40, ACCEPTANCE_CRITERIA §19).
 *
 * The bands are deliberately narrow. Every change of DPR reallocates the
 * drawing buffer and every render target attached to it, which is a stall of
 * its own — so a monitor with room to walk 1.5 → 0.85 in four steps spends more
 * time reallocating than it ever saves in fill rate. One step in each direction
 * is enough to correct a mis-tiered device; anything beyond that is the wrong
 * tier, not the wrong resolution.
 */
export const TIER_DPR: Record<DeviceTier, { initial: number; max: number; min: number }> = {
  high: { initial: 1.5, max: 1.75, min: 1.25 },
  mid: { initial: 1.25, max: 1.5, min: 1 },
  low: { initial: 1, max: 1.15, min: 0.85 },
}

/**
 * Population multiplier per tier. Applied on top of the per-breakpoint counts
 * each scene already chooses, so a low-tier laptop and a low-tier phone both
 * come down from their *own* baseline rather than meeting at one number.
 */
export const TIER_SCALE: Record<DeviceTier, number> = {
  high: 1,
  mid: 0.68,
  low: 0.42,
}
