import { describe, it, expect } from 'vitest'
import {
  JOURNEY_STATES,
  MILESTONE,
  clamp01,
  remap,
  smoothstep,
  morphIndex,
  stageIndex,
} from './journey.constants'

describe('math helpers', () => {
  it('clamps to the unit range', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(9)).toBe(1)
  })

  it('remaps and clamps', () => {
    expect(remap(0.5, 0, 1)).toBe(0.5)
    expect(remap(0.25, 0.2, 0.3)).toBeCloseTo(0.5)
    expect(remap(-1, 0.2, 0.3)).toBe(0)
    expect(remap(9, 0.2, 0.3)).toBe(1)
  })

  it('smoothsteps with zero slope at both ends', () => {
    expect(smoothstep(0, 1, 0)).toBe(0)
    expect(smoothstep(0, 1, 1)).toBe(1)
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5)
    expect(smoothstep(0, 1, 0.25)).toBeLessThan(0.25)
    expect(smoothstep(0, 1, 0.75)).toBeGreaterThan(0.75)
  })
})

describe('morphIndex', () => {
  it('spans the five arrangements across the section', () => {
    expect(morphIndex(0)).toBe(0)
    expect(morphIndex(1)).toBeCloseTo(4, 5)
  })

  it('never moves backward as progress increases', () => {
    let prev = -1
    for (let i = 0; i <= 1000; i++) {
      const m = morphIndex(i / 1000)
      expect(m).toBeGreaterThanOrEqual(prev - 1e-9)
      expect(m).toBeGreaterThanOrEqual(0)
      expect(m).toBeLessThanOrEqual(4)
      prev = m
    }
  })

  it('is exactly deterministic, so scrubbing backward retraces the same path', () => {
    const forward: number[] = []
    for (let i = 0; i <= 200; i++) forward.push(morphIndex(i / 200))
    for (let i = 200; i >= 0; i--) expect(morphIndex(i / 200)).toBe(forward[i])
  })

  it.each([
    ['particle field', 1, MILESTONE.shatterEnd, MILESTONE.signalStart],
    ['genetic signal', 2, MILESTONE.signalEnd, MILESTONE.networkStart],
    ['research network', 3, MILESTONE.networkEnd, MILESTONE.candidateStart],
  ])('rests exactly on %s (step %i)', (_label, step, from, to) => {
    expect(to).toBeGreaterThan(from)
    const mid = (from + to) / 2
    for (const p of [from, mid, to]) expect(morphIndex(p)).toBeCloseTo(step, 6)
  })
})

describe('story states', () => {
  it('has the seven biological states in order', () => {
    expect(JOURNEY_STATES).toHaveLength(7)
    expect(JOURNEY_STATES.map((s) => s.index)).toEqual([
      '01', '02', '03', '04', '05', '06', '07',
    ])
  })

  it('gives every state a two-line headline and metadata', () => {
    for (const s of JOURNEY_STATES) {
      expect(s.headline).toHaveLength(2)
      expect(s.body.length).toBeGreaterThan(20)
      expect(s.meta.length).toBeGreaterThan(0)
      expect(s.exit).toBeGreaterThan(s.enter)
    }
  })

  it('spaces each exit exactly one OUT before the next enter', () => {
    for (let i = 0; i < JOURNEY_STATES.length - 1; i++) {
      expect(JOURNEY_STATES[i + 1].enter - JOURNEY_STATES[i].exit).toBeCloseTo(0.02, 6)
    }
  })

  it('resolves the active state from progress', () => {
    expect(stageIndex(0)).toBe(0)
    expect(stageIndex(0.2)).toBe(1)
    expect(stageIndex(0.99)).toBe(6)
  })
})

describe('visual milestones', () => {
  it('advances monotonically through the section', () => {
    const ordered = [
      MILESTONE.dissolveStart,
      MILESTONE.dissolveEnd,
      MILESTONE.pushStart,
      MILESTONE.pushEnd,
      MILESTONE.shatterStart,
      MILESTONE.shatterEnd,
      MILESTONE.signalStart,
      MILESTONE.signalEnd,
      MILESTONE.networkStart,
      MILESTONE.networkEnd,
      MILESTONE.candidateStart,
      MILESTONE.candidateEnd,
    ]
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i]).toBeGreaterThanOrEqual(ordered[i - 1])
    }
    expect(ordered[0]).toBeGreaterThan(0)
    expect(ordered[ordered.length - 1]).toBeLessThanOrEqual(1)
  })
})
