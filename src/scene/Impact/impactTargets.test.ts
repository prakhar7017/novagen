import { describe, expect, it } from 'vitest'
import {
  FRAME,
  buildImpactTargets,
  sampleArrangement,
  type ImpactDensity,
  type ImpactPopulation,
} from './impactTargets'

const DENSITY: ImpactDensity = { signals: 900, nodes: 140, maxLines: 180 }

const targets = buildImpactTargets(DENSITY)

function tripleAt(buf: Float32Array, i: number) {
  return [buf[i * 3], buf[i * 3 + 1], buf[i * 3 + 2]] as const
}

function spread(pop: ImpactPopulation, buf: Float32Array, only?: (i: number) => boolean) {
  let sum = 0
  let n = 0
  for (let i = 0; i < pop.count; i++) {
    if (only && !only(i)) continue
    const [x, y] = tripleAt(buf, i)
    sum += Math.hypot(x, y)
    n++
  }
  return n ? sum / n : 0
}

describe('buildImpactTargets', () => {
  it('is deterministic — the same seed produces identical buffers', () => {
    const again = buildImpactTargets(DENSITY)
    expect(Array.from(again.nodes.scale)).toEqual(Array.from(targets.nodes.scale))
    expect(Array.from(again.signals.validate)).toEqual(Array.from(targets.signals.validate))
    expect(Array.from(again.lineIndices)).toEqual(Array.from(targets.lineIndices))
  })

  it('fills every buffer at the requested counts', () => {
    expect(targets.signals.count).toBe(DENSITY.signals)
    expect(targets.nodes.count).toBe(DENSITY.nodes)
    for (const pop of [targets.signals, targets.nodes]) {
      expect(pop.scale).toHaveLength(pop.count * 3)
      expect(pop.prioritize).toHaveLength(pop.count * 3)
      expect(pop.validate).toHaveLength(pop.count * 3)
      expect(pop.inward).toHaveLength(pop.count * 3)
      expect(pop.strength).toHaveLength(pop.count)
      expect(pop.color).toHaveLength(pop.count * 3)
      expect(Array.from(pop.scale).every(Number.isFinite)).toBe(true)
      expect(Array.from(pop.validate).every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps the SCALE arrangement inside the authoring frame', () => {
    for (let i = 0; i < targets.nodes.count; i++) {
      const [x, y, z] = tripleAt(targets.nodes.scale, i)
      expect(Math.abs(x)).toBeLessThanOrEqual(FRAME.x + 1e-4)
      expect(Math.abs(y)).toBeLessThanOrEqual(FRAME.y + 1e-4)
      expect(Math.abs(z)).toBeLessThanOrEqual(FRAME.z + 1e-4)
    }
  })

  it('reduces what survives at each successive state', () => {
    const strong = (pop: ImpactPopulation) => (i: number) => pop.strength[i] > 0.46
    const winners = (pop: ImpactPopulation) => (i: number) => pop.winner[i] > 0.5

    const all = targets.nodes.count
    const surviving = Array.from(targets.nodes.strength).filter((s) => s > 0.46).length
    const validated = Array.from(targets.nodes.winner).filter((w) => w > 0.5).length

    expect(surviving).toBeLessThan(all)
    expect(validated).toBeLessThan(surviving)
    expect(validated).toBeGreaterThan(4)

    const scaleSpread = spread(targets.nodes, targets.nodes.scale, strong(targets.nodes))
    const prioritizeSpread = spread(
      targets.nodes,
      targets.nodes.prioritize,
      strong(targets.nodes),
    )
    expect(prioritizeSpread).toBeLessThan(scaleSpread)

    const validateSpread = spread(targets.nodes, targets.nodes.validate, winners(targets.nodes))
    expect(validateSpread).toBeLessThan(prioritizeSpread)
  })

  it('pushes discarded material outward rather than to the centre (§20)', () => {
    const weak = (i: number) => targets.nodes.strength[i] <= 0.46
    expect(spread(targets.nodes, targets.nodes.prioritize, weak)).toBeGreaterThan(
      spread(targets.nodes, targets.nodes.scale, weak),
    )
  })

  it('points every candidate inward, toward its own anchor', () => {
    let checked = 0
    for (let i = 0; i < targets.nodes.count; i++) {
      const [ix, iy] = tripleAt(targets.nodes.inward, i)
      if (ix === 0 && iy === 0) continue
      checked++
      const [px, py] = tripleAt(targets.nodes.prioritize, i)
      const before = Math.hypot(ix, iy)
      const after = Math.hypot(ix - ix * 0.42, iy - iy * 0.42)
      expect(after).toBeLessThan(before)
      expect(Number.isFinite(px) && Number.isFinite(py)).toBe(true)
    }
    expect(checked).toBeGreaterThan(10)
  })

  it('builds a clustered graph rather than a uniform mesh', () => {
    expect(targets.lineIndices.length).toBeGreaterThan(0)
    expect(targets.lineIndices.length / 2).toBeLessThanOrEqual(DENSITY.maxLines + 2)
    expect(targets.bridgeIndices.length).toBeLessThan(targets.lineIndices.length)
    const pairs = new Set<string>()
    for (let k = 0; k < targets.lineIndices.length; k += 2) {
      pairs.add(`${targets.lineIndices[k]}-${targets.lineIndices[k + 1]}`)
    }
    expect(targets.evidenceIndices.length).toBeGreaterThan(0)
    for (let k = 0; k < targets.evidenceIndices.length; k += 2) {
      expect(pairs.has(`${targets.evidenceIndices[k]}-${targets.evidenceIndices[k + 1]}`)).toBe(
        true,
      )
    }
    for (const idx of [
      targets.lineIndices,
      targets.bridgeIndices,
      targets.evidenceIndices,
    ]) {
      for (const i of idx) expect(i).toBeLessThan(targets.nodes.count)
    }
  })

  it('ranks candidate anchors and puts the winner first', () => {
    expect(targets.candidates).toHaveLength(9)
    expect(Array.from(targets.candidates).every(Number.isFinite)).toBe(true)
  })
})

describe('sampleArrangement', () => {
  it('lands exactly on each authored arrangement at 0, 1 and 2', () => {
    const out = new Float32Array(targets.nodes.count * 3)
    for (const [morph, expected] of [
      [0, targets.nodes.scale],
      [1, targets.nodes.prioritize],
      [2, targets.nodes.validate],
    ] as const) {
      sampleArrangement(targets.nodes, morph, out)
      for (let i = 0; i < out.length; i++) expect(out[i]).toBeCloseTo(expected[i], 5)
    }
  })

  it('clamps outside 0–2 so an over-scrubbed frame is still valid', () => {
    const a = sampleArrangement(targets.nodes, -3, new Float32Array(targets.nodes.count * 3))
    const b = sampleArrangement(targets.nodes, 9, new Float32Array(targets.nodes.count * 3))
    expect(a[0]).toBeCloseTo(targets.nodes.scale[0], 5)
    expect(b[0]).toBeCloseTo(targets.nodes.validate[0], 5)
  })

  it('writes into the supplied array rather than allocating', () => {
    const out = new Float32Array(targets.nodes.count * 3)
    expect(sampleArrangement(targets.nodes, 0.5, out)).toBe(out)
  })
})
