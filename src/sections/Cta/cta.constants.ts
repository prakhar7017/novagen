import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export const CTA_INDEX = '08'
export const CTA_LABEL = 'Possibility'

export const CTA_META = { key: 'System', value: 'Resolved' } as const

export const CTA_HEADLINE = ['From biological complexity', 'to human possibility.'] as const

export const CTA_HEADLINE_COMPACT = [
  'From biological',
  'complexity to',
  'human possibility.',
] as const

export const CTA_LEAD =
  'We build tools that help researchers move from living systems to meaningful discovery.'

export const CTA_PRIMARY = { label: 'Explore the science', target: 'technology' } as const
export const CTA_SECONDARY = { label: 'View selected research', target: 'research' } as const

export const CTA_BRAND = { name: 'NOVA/GEN', line: 'Biology, made programmable.' } as const

export const CTA_MILESTONE = {
  settleIn: 0.0,
  settleOn: 0.22,
  membraneIn: 0.18,
  membraneOn: 0.68,
  interiorIn: 0.42,
  interiorOn: 0.9,
} as const

export function ctaForm(p: number): number {
  return smoothstep(CTA_MILESTONE.membraneIn, CTA_MILESTONE.membraneOn, p)
}

export function ctaInterior(p: number): number {
  return smoothstep(CTA_MILESTONE.interiorIn, CTA_MILESTONE.interiorOn, p)
}

export function ctaSpan(p: number): number {
  return smoothstep(CTA_MILESTONE.settleIn, CTA_MILESTONE.membraneOn, p)
}

export function ctaVisible(): boolean {
  return scrollProgress.impact >= 0.999
}

export const CELL_RADIUS = 0.62

export function cellDiameterPx(width: number): number {
  if (width >= 1600) return 420
  if (width >= 1367) return 340
  if (width >= 1101) return 300
  if (width >= 1025) return 285
  return 275
}

export const CELL_POSITION = {
  from: { x: 0.67, y: 0.47 },
  to: { x: 0.77, y: 0.44 },
} as const

export const CELL_POINTS = 34

export interface CellPoint {
  radius: number
  phase: number
  speed: number
  tilt: number
  size: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildCellPoints(count = CELL_POINTS, seed = 0x08c7a): CellPoint[] {
  const rnd = mulberry32(seed)
  const points: CellPoint[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      radius: 0.16 + Math.sqrt(rnd()) * 0.74,
      phase: rnd() * Math.PI * 2,
      speed: (0.012 + rnd() * 0.026) * (rnd() < 0.5 ? -1 : 1),
      tilt: 0.35 + rnd() * 0.6,
      size: 0.6 + rnd() * 0.75,
    })
  }
  return points
}

export function cellPointAt(p: CellPoint, t: number): { x: number; y: number; z: number } {
  const a = p.phase + t * p.speed
  const r = p.radius
  return {
    x: Math.cos(a) * r,
    y: Math.sin(a) * r * p.tilt,
    z: Math.sin(a * 0.7 + p.phase) * r * 0.34,
  }
}

export const CTA_ENTRANCE = {
  label: 0.65,
  headline: 0.75,
  headlineStagger: 0.12,
  lead: 1.1,
  actions: 1.25,
  brand: 1.45,
} as const

export const CTA_VH = 118
