// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { buildTechTargets, FRAME } from './techTargets'
import {
  TECHNOLOGY_STAGES,
  TECH_MILESTONE,
  techMorph,
  techStageIndex,
} from '@/sections/Technology/technology.constants'

const COUNT = 218
const targets = buildTechTargets(COUNT)

const ARRANGEMENTS = ['sample', 'map', 'interpret', 'predict', 'validate'] as const

describe('buildTechTargets', () => {
  it('sizes every attribute buffer to the population', () => {
    for (const key of ARRANGEMENTS) expect(targets[key]).toHaveLength(COUNT * 3)
    expect(targets.color).toHaveLength(COUNT * 3)
    expect(targets.size).toHaveLength(COUNT)
    expect(targets.random).toHaveLength(COUNT)
    expect(targets.strength).toHaveLength(COUNT)
    expect(targets.winner).toHaveLength(COUNT)
  })

  it('is deterministic — the composition cannot change between renders', () => {
    const again = buildTechTargets(COUNT)
    for (const key of ARRANGEMENTS) {
      expect(Array.from(again[key])).toEqual(Array.from(targets[key]))
    }
    expect(Array.from(again.lineIndices)).toEqual(Array.from(targets.lineIndices))
    expect(Array.from(again.bridgeIndices)).toEqual(Array.from(targets.bridgeIndices))
  })

  it('produces only finite, bounded coordinates', () => {
    const bad: string[] = []
    for (const key of ARRANGEMENTS) {
      const buf = targets[key]
      for (let i = 0; i < buf.length; i++) {
        if (!Number.isFinite(buf[i]) || Math.abs(buf[i]) >= 4) {
          bad.push(`${key}[${i}]=${buf[i]}`)
          if (bad.length > 5) break
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('folds the sample out of the map rather than scattering it', () => {
    let mismatched = 0
    for (let i = 0; i < COUNT; i++) {
      const dx = targets.sample[i * 3] - targets.map[i * 3] * 0.36
      const dy = targets.sample[i * 3 + 1] - targets.map[i * 3 + 1] * 0.36
      if (Math.abs(dx) > 0.03 || Math.abs(dy) > 0.03) mismatched++
    }
    expect(mismatched).toBe(0)

    for (let i = 0; i < COUNT; i++) {
      expect(Math.abs(targets.sample[i * 3])).toBeLessThan(FRAME.x * 0.4)
    }
  })

  it('keeps the interpretation network on the mapped cells', () => {
    let moved = 0
    for (let i = 0; i < COUNT; i++) {
      const d = Math.hypot(
        targets.interpret[i * 3] - targets.map[i * 3],
        targets.interpret[i * 3 + 1] - targets.map[i * 3 + 1],
      )
      if (d > 0.2) moved++
    }
    expect(moved).toBe(0)
  })

  it('connects nodes into a readable, clustered network', () => {
    const segments = (targets.lineIndices.length + targets.bridgeIndices.length) / 2
    expect(segments).toBeGreaterThanOrEqual(150)
    expect(segments).toBeLessThanOrEqual(400)

    for (const idx of targets.lineIndices) expect(idx).toBeLessThan(COUNT)
    for (const idx of targets.bridgeIndices) expect(idx).toBeLessThan(COUNT)

    expect(targets.bridgeIndices.length / 2).toBeLessThan(targets.lineIndices.length / 20)

    const linked = new Set(Array.from(targets.lineIndices))
    expect(linked.size).toBeLessThan(COUNT)

    let longest = 0
    const all = [...targets.lineIndices, ...targets.bridgeIndices]
    for (let i = 0; i < all.length / 2; i++) {
      const a = all[i * 2]
      const b = all[i * 2 + 1]
      longest = Math.max(
        longest,
        Math.hypot(
          targets.map[a * 3] - targets.map[b * 3],
          targets.map[a * 3 + 1] - targets.map[b * 3 + 1],
        ),
      )
    }
    expect(longest).toBeLessThan(1.15)
  })

  it('shortlists four candidates and validates exactly one of them', () => {
    expect(targets.candidates).toHaveLength(4 * 3)

    const winners = Array.from(targets.winner).filter((w) => w > 0.5).length
    expect(winners).toBeGreaterThan(4)
    expect(winners).toBeLessThan(COUNT / 2)

    for (let i = 0; i < COUNT; i++) {
      if (targets.winner[i] < 0.5) continue
      const r = Math.hypot(targets.validate[i * 3], targets.validate[i * 3 + 1])
      expect(r).toBeGreaterThan(0.85)
      expect(r).toBeLessThan(1.2)
    }
  })
})

describe('technology progress map', () => {
  it('walks the five arrangements in order and settles on each', () => {
    expect(techMorph(0)).toBe(0)
    expect(techMorph(1)).toBeCloseTo(4, 5)

    expect(techMorph(TECH_MILESTONE.sampleOn)).toBeCloseTo(0, 5)
    expect(techMorph(0.28)).toBeCloseTo(1, 5)
    expect(techMorph(0.48)).toBeCloseTo(2, 5)
    expect(techMorph(0.68)).toBeCloseTo(3, 5)
    expect(techMorph(0.9)).toBeCloseTo(4, 5)

    let previous = -1
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const m = techMorph(p)
      expect(m).toBeGreaterThanOrEqual(previous)
      previous = m
    }
  })

  it('maps progress onto the stage whose copy is showing', () => {
    expect(techStageIndex(0)).toBe(0)
    expect(techStageIndex(0.99)).toBe(4)
    TECHNOLOGY_STAGES.forEach((stage, i) => {
      expect(techStageIndex(stage.enter + 0.01)).toBe(i)
    })
  })

  it('leaves no gap between one stage leaving and the next arriving', () => {
    for (let i = 0; i < TECHNOLOGY_STAGES.length - 1; i++) {
      expect(TECHNOLOGY_STAGES[i].exit).toBeLessThan(TECHNOLOGY_STAGES[i + 1].enter)
      expect(TECHNOLOGY_STAGES[i + 1].enter - TECHNOLOGY_STAGES[i].exit).toBeLessThan(0.06)
    }
  })
})
