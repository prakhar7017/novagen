// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  CONFIDENCE,
  IMPACT_METRICS,
  IMPACT_MILESTONE,
  IMPACT_VH,
  impactArc,
  impactCompress,
  impactExit,
  impactMorph,
  impactStageIndex,
} from './impact.constants'

describe('impact copy windows', () => {
  it('covers the whole section with exactly one metric at every progress', () => {
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const i = impactStageIndex(p)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(IMPACT_METRICS.length)
      expect(p).toBeGreaterThanOrEqual(IMPACT_METRICS[i].enter - 1e-9)
    }
  })

  it('orders the three states and leaves the last one holding to the end', () => {
    for (let i = 1; i < IMPACT_METRICS.length; i++) {
      expect(IMPACT_METRICS[i].enter).toBeGreaterThan(IMPACT_METRICS[i - 1].enter)
      expect(IMPACT_METRICS[i].enter).toBeLessThanOrEqual(IMPACT_METRICS[i - 1].exit)
    }
    expect(IMPACT_METRICS.at(-1)!.exit).toBeGreaterThan(1)
  })

  it('states each figure as text, with a unit and an explanation (§50)', () => {
    for (const m of IMPACT_METRICS) {
      expect(m.value).toMatch(/^[\d.]+$/)
      expect(m.suffix.length).toBeGreaterThan(0)
      expect(m.description.length).toBeGreaterThan(10)
      expect(m.statement.length).toBeGreaterThan(20)
    }
    expect(IMPACT_METRICS.map((m) => m.value + m.suffix)).toEqual(['14.8M', '72×', '91%'])
  })
})

describe('impactMorph', () => {
  it('runs 0 → 2 monotonically and settles on each arrangement', () => {
    expect(impactMorph(0)).toBe(0)
    expect(impactMorph(IMPACT_MILESTONE.filterStart)).toBe(0)
    expect(impactMorph(IMPACT_MILESTONE.filterEnd)).toBeCloseTo(1, 6)
    expect(impactMorph(IMPACT_MILESTONE.validateStart)).toBeCloseTo(1, 6)
    expect(impactMorph(1)).toBeCloseTo(2, 6)

    let prev = -1
    for (let p = 0; p <= 1.0001; p += 0.002) {
      const m = impactMorph(p)
      expect(m).toBeGreaterThanOrEqual(prev - 1e-9)
      expect(m).toBeLessThanOrEqual(2 + 1e-9)
      prev = m
    }
  })

  it('holds each arrangement still while its metric is on screen', () => {
    expect(impactMorph(0.2)).toBe(impactMorph(0.28))
    expect(impactMorph(IMPACT_MILESTONE.filterEnd)).toBeCloseTo(
      impactMorph(IMPACT_MILESTONE.validateStart),
      6,
    )
    expect(impactMorph(IMPACT_MILESTONE.validateEnd)).toBeCloseTo(impactMorph(1), 6)
  })
})

describe('impactCompress', () => {
  it('tightens inside PRIORITIZE and is fully released by VALIDATE', () => {
    expect(impactCompress(IMPACT_MILESTONE.compressStart)).toBe(0)
    expect(impactCompress(IMPACT_MILESTONE.compressEnd)).toBeGreaterThan(0.4)
    expect(impactCompress(IMPACT_MILESTONE.validateEnd)).toBeCloseTo(0, 6)
    expect(impactCompress(1)).toBeCloseTo(0, 6)
  })

  it('never leaves the 0–1 range', () => {
    for (let p = 0; p <= 1.0001; p += 0.002) {
      const c = impactCompress(p)
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThanOrEqual(1)
    }
  })
})

describe('impactArc', () => {
  it('ends at exactly the figure the metric states', () => {
    expect(CONFIDENCE).toBe(0.91)
    expect(IMPACT_METRICS[2].value).toBe(String(CONFIDENCE * 100))
    expect(impactArc(IMPACT_MILESTONE.arcStart)).toBe(0)
    expect(impactArc(IMPACT_MILESTONE.arcEnd)).toBeCloseTo(CONFIDENCE, 6)
    expect(impactArc(1)).toBeCloseTo(CONFIDENCE, 6)
  })
})

describe('impactExit', () => {
  it('is silent until the collapse and complete at the section end (§53)', () => {
    expect(impactExit(0)).toBe(0)
    expect(IMPACT_MILESTONE.humanOut).toBeLessThan(IMPACT_MILESTONE.exitStart)
    expect(impactExit(IMPACT_MILESTONE.humanOut)).toBe(0)
    expect(impactExit(IMPACT_MILESTONE.exitStart)).toBe(0)
    expect(impactExit(1)).toBeCloseTo(1, 6)
  })
})

describe('scroll budget', () => {
  it('stays inside the 220–280vh band and holds the stage long enough (§8, §33)', () => {
    expect(IMPACT_VH).toBeGreaterThanOrEqual(220)
    expect(IMPACT_VH).toBeLessThanOrEqual(280)
    expect(IMPACT_VH - 100).toBeGreaterThanOrEqual(140)
  })
})
