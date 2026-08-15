import { describe, expect, it } from 'vitest'
import {
  GENOME_LOCI,
  buildGenome,
  buildNetwork,
  buildSpatialField,
  buildStructurePoints,
  locusAt,
  nearestCluster,
} from './capabilities.geometry'

/**
 * The visuals draw whatever these functions return, so a bad arrangement is
 * not a crash — it is a module that quietly looks wrong at one breakpoint.
 * These assert the properties the visuals actually depend on: bounds (nothing
 * drawn under the module's own border), determinism (the same field across
 * reloads and across a resize) and referential integrity (no edge pointing at
 * a node that is not there).
 */

describe('buildSpatialField', () => {
  const field = buildSpatialField(34)

  it('produces the requested marker count', () => {
    expect(field.markers).toHaveLength(34)
  })

  it('keeps every marker inside the module safe area', () => {
    for (const m of field.markers) {
      expect(m.x).toBeGreaterThanOrEqual(0.05)
      expect(m.x).toBeLessThanOrEqual(0.95)
      expect(m.y).toBeGreaterThanOrEqual(0.06)
      expect(m.y).toBeLessThanOrEqual(0.94)
    }
  })

  it('links only to real, distinct markers', () => {
    for (const e of field.edges) {
      expect(e.a).not.toBe(e.b)
      expect(field.markers[e.a]).toBeDefined()
      expect(field.markers[e.b]).toBeDefined()
      // Normalized against the link cutoff, so the visuals can fade long
      // relationships without knowing what the cutoff is.
      expect(e.d).toBeGreaterThanOrEqual(0)
      expect(e.d).toBeLessThanOrEqual(1)
    }
  })

  it('draws each pair once', () => {
    const keys = field.edges.map((e) => (e.a < e.b ? `${e.a}-${e.b}` : `${e.b}-${e.a}`))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('is deterministic — a resize must not reshuffle the field', () => {
    const again = buildSpatialField(34)
    expect(again.markers).toEqual(field.markers)
    expect(again.edges).toEqual(field.edges)
  })

  it('has local structure rather than one connected mesh', () => {
    // Two links per marker at most: past that the neighbourhoods stop reading
    // as neighbourhoods, which is the whole point of the visual.
    expect(field.edges.length).toBeLessThanOrEqual(field.markers.length * 2)
  })
})

describe('buildStructurePoints', () => {
  it('rings the structure rather than filling the box', () => {
    for (const p of buildStructurePoints(9)) {
      const r = Math.hypot(p.x - 0.5, p.y - 0.5)
      expect(r).toBeGreaterThan(0.25)
      expect(r).toBeLessThan(0.5)
    }
  })

  it('is deterministic', () => {
    expect(buildStructurePoints(9)).toEqual(buildStructurePoints(9))
  })
})

describe('buildNetwork', () => {
  const net = buildNetwork(52)

  it('produces exactly the requested node count', () => {
    expect(net.nodes).toHaveLength(52)
  })

  it('keeps the mobile count exact too', () => {
    expect(buildNetwork(26).nodes).toHaveLength(26)
  })

  it('gives every cluster a candidate that belongs to it', () => {
    net.clusters.forEach((c, i) => {
      expect(c.candidate).toBeGreaterThanOrEqual(0)
      expect(net.nodes[c.candidate].cluster).toBe(i)
    })
  })

  it('keeps some signal outside the clusters', () => {
    // §22: without weak unaffiliated signal the network resolves into four
    // tidy blobs, which is exactly the diagram the brief rules out.
    expect(net.nodes.some((n) => n.cluster === -1)).toBe(true)
  })

  it('never labels an edge with a cluster its ends do not share', () => {
    for (const e of net.edges) {
      expect(e.a).not.toBe(e.b)
      if (e.cluster < 0) continue
      expect(net.nodes[e.a].cluster).toBe(e.cluster)
      expect(net.nodes[e.b].cluster).toBe(e.cluster)
    }
  })

  it('draws each connection once', () => {
    const keys = net.edges.map((e) => (e.a < e.b ? `${e.a}-${e.b}` : `${e.b}-${e.a}`))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('selects the cluster nearest the pointer', () => {
    net.clusters.forEach((c, i) => {
      expect(nearestCluster(net.clusters, c.x, c.y)).toBe(i)
    })
  })

  it('is deterministic', () => {
    expect(buildNetwork(52)).toEqual(net)
  })
})

describe('buildGenome', () => {
  const genome = buildGenome(22)

  it('produces the requested bar count', () => {
    expect(genome.bars).toHaveLength(22)
  })

  it('keeps every bar within the drawable range', () => {
    for (const b of genome.bars) {
      expect(b.h).toBeGreaterThan(0)
      expect(b.h).toBeLessThanOrEqual(1)
      expect(b.locus).toBeGreaterThanOrEqual(0)
      expect(b.locus).toBeLessThan(GENOME_LOCI)
    }
  })

  it('keeps the waveform inside the band', () => {
    for (const p of genome.wave) {
      expect(p.y).toBeGreaterThanOrEqual(0.04)
      expect(p.y).toBeLessThanOrEqual(0.96)
    }
  })

  it('never runs a track segment past the strip', () => {
    for (const s of genome.segments) {
      expect(s.x + s.w).toBeLessThanOrEqual(0.98 + 1e-9)
      expect(s.row).toBeGreaterThanOrEqual(0)
      expect(s.row).toBeLessThan(3)
    }
  })

  it('covers every locus, so no region of the strip is dead', () => {
    const covered = new Set(genome.segments.map((s) => s.locus))
    for (let k = 0; k < GENOME_LOCI; k++) expect(covered.has(k)).toBe(true)
  })

  it('is deterministic', () => {
    expect(buildGenome(22)).toEqual(genome)
  })
})

describe('locusAt', () => {
  it('maps the strip left to right', () => {
    expect(locusAt(0)).toBe(0)
    expect(locusAt(0.5)).toBe(3)
    expect(locusAt(0.999)).toBe(GENOME_LOCI - 1)
  })

  it('clamps beyond the ends rather than indexing off the strip', () => {
    expect(locusAt(-0.4)).toBe(0)
    expect(locusAt(1)).toBe(GENOME_LOCI - 1)
    expect(locusAt(3.2)).toBe(GENOME_LOCI - 1)
  })
})
