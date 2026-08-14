import { describe, it, expect } from 'vitest'
import { buildParticleTargets } from './particleTargets'

/**
 * The particle buffers are built once and then only read by the GPU, so a bad
 * value here is invisible in code and shows up as a smear of geometry on
 * screen. These tests pin the invariants the shader relies on.
 */

const COUNT = 2000
const targets = buildParticleTargets(COUNT)

const ARRANGEMENTS = ['nucleus', 'field', 'signal', 'network', 'candidate'] as const

describe('buildParticleTargets', () => {
  it('sizes every attribute buffer to the population', () => {
    for (const key of ARRANGEMENTS) {
      expect(targets[key]).toHaveLength(COUNT * 3)
    }
    expect(targets.color).toHaveLength(COUNT * 3)
    expect(targets.random).toHaveLength(COUNT)
    expect(targets.size).toHaveLength(COUNT)
  })

  it('produces only finite, bounded coordinates', () => {
    // Scanned in plain JS with a single assertion: one expect() per coordinate
    // is ~30k calls and slow enough to trip the default test timeout.
    const bad: string[] = []
    for (const key of ARRANGEMENTS) {
      const buf = targets[key]
      for (let i = 0; i < buf.length; i++) {
        // Well outside the camera frustum would mean an unseen population
        if (!Number.isFinite(buf[i]) || Math.abs(buf[i]) >= 12) {
          bad.push(`${key}[${i}]=${buf[i]}`)
          if (bad.length > 5) break
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('is deterministic, so reloads and reverse scrubs match', () => {
    const again = buildParticleTargets(COUNT)
    for (const key of ARRANGEMENTS) {
      expect(Array.from(again[key])).toEqual(Array.from(targets[key]))
    }
    expect(Array.from(again.lineIndices)).toEqual(Array.from(targets.lineIndices))
  })

  it('keeps point sizes in the relative band the vertex shader expects', () => {
    const outOfBand: string[] = []
    for (let i = 0; i < COUNT; i++) {
      const s = targets.size[i]
      const r = targets.random[i]
      if (s < 0.6 || s > 1.8) outOfBand.push(`size[${i}]=${s}`)
      if (r < 0 || r >= 1) outOfBand.push(`random[${i}]=${r}`)
    }
    expect(outOfBand).toEqual([])
  })

  it('colours the population from the two-tone biological palette', () => {
    let green = 0
    let unlit = 0
    for (let i = 0; i < COUNT; i++) {
      const r = targets.color[i * 3]
      const b = targets.color[i * 3 + 2]
      // Bio green is far redder-than-blue; signal mint is nearly balanced
      if (r - b > 0.15) green++
      if (!(targets.color[i * 3 + 1] > 0)) unlit++
    }
    expect(unlit).toBe(0)
    const ratio = green / COUNT
    expect(ratio).toBeGreaterThan(0.7)
    expect(ratio).toBeLessThan(0.9)
  })
})

describe('network connections', () => {
  it('links only node particles, in pairs', () => {
    expect(targets.lineIndices.length % 2).toBe(0)
    expect(targets.lineIndices.length).toBeGreaterThan(0)
    for (const idx of targets.lineIndices) {
      expect(idx).toBeLessThan(targets.nodeCount)
    }
  })

  it('stays sparse — a biological network, never an all-to-all graph', () => {
    const degree = new Map<number, number>()
    for (const idx of targets.lineIndices) {
      degree.set(idx, (degree.get(idx) ?? 0) + 1)
    }
    for (const d of degree.values()) expect(d).toBeLessThanOrEqual(4)
    // All-to-all over n nodes would be n(n-1)/2 pairs; this must be nowhere near
    const pairs = targets.lineIndices.length / 2
    expect(pairs).toBeLessThan(targets.nodeCount * 2)
  })

  it('caps the node population so the line buffer stays 16-bit safe', () => {
    expect(targets.nodeCount).toBeLessThanOrEqual(284)
    expect(targets.nodeCount).toBeLessThan(65536)
  })
})
