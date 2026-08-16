function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function inset(v: number, pad: number) {
  return Math.min(1 - pad, Math.max(pad, v))
}

export interface SpatialMarker {
  x: number
  y: number
  r: number
  phase: number
}

export interface SpatialEdge {
  a: number
  b: number
  d: number
}

export interface SpatialField {
  markers: SpatialMarker[]
  edges: SpatialEdge[]
}

const SPATIAL_MAX_LINK = 0.155

export function buildSpatialField(count: number, seed = 20260505): SpatialField {
  const rnd = mulberry32(seed)

  const regions = [
    { x: 0.3, y: 0.36, s: 0.2 },
    { x: 0.62, y: 0.3, s: 0.15 },
    { x: 0.5, y: 0.62, s: 0.22 },
    { x: 0.78, y: 0.66, s: 0.16 },
    { x: 0.18, y: 0.72, s: 0.14 },
  ]

  const markers: SpatialMarker[] = []
  for (let i = 0; i < count; i++) {
    const loose = i % 5 === 4
    const reg = regions[i % regions.length]
    const ang = rnd() * Math.PI * 2
    const rad = Math.sqrt(rnd()) * reg.s
    const x = loose ? rnd() : reg.x + Math.cos(ang) * rad
    const y = loose ? rnd() : reg.y + Math.sin(ang) * rad * 0.92

    markers.push({
      x: inset(x, 0.05),
      y: inset(y, 0.06),
      r: 0.6 + rnd() * 0.8,
      phase: rnd() * Math.PI * 2,
    })
  }

  const seen = new Set<string>()
  const edges: SpatialEdge[] = []

  markers.forEach((m, a) => {
    const near = markers
      .map((n, b) => ({ b, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter((n) => n.b !== a && n.d < SPATIAL_MAX_LINK)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)

    for (const n of near) {
      const key = a < n.b ? a + '-' + n.b : n.b + '-' + a
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ a, b: n.b, d: n.d / SPATIAL_MAX_LINK })
    }
  })

  return { markers, edges }
}

export interface StructurePoint {
  x: number
  y: number
  r: number
  phase: number
}

export function buildStructurePoints(count: number, seed = 20260502): StructurePoint[] {
  const rnd = mulberry32(seed)
  const points: StructurePoint[] = []

  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.9
    const rad = 0.3 + rnd() * 0.16
    points.push({
      x: 0.5 + Math.cos(ang) * rad,
      y: 0.5 + Math.sin(ang) * rad * 0.95,
      r: 0.5 + rnd() * 0.7,
      phase: rnd() * Math.PI * 2,
    })
  }

  return points
}

export interface NetworkNode {
  x: number
  y: number
  r: number
  cluster: number
  weight: number
  phase: number
}

export interface NetworkEdge {
  a: number
  b: number
  cluster: number
}

export interface NetworkCluster {
  x: number
  y: number
  candidate: number
}

export interface Network {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  clusters: NetworkCluster[]
}

export function buildNetwork(nodeCount: number, seed = 20260503): Network {
  const rnd = mulberry32(seed)

  const seeds = [
    { x: 0.26, y: 0.36, s: 0.15, share: 0.26 },
    { x: 0.63, y: 0.27, s: 0.12, share: 0.2 },
    { x: 0.72, y: 0.66, s: 0.16, share: 0.24 },
    { x: 0.34, y: 0.71, s: 0.11, share: 0.16 },
  ]

  const nodes: NetworkNode[] = []

  seeds.forEach((s, ci) => {
    const n = Math.max(3, Math.round(nodeCount * s.share))
    for (let i = 0; i < n; i++) {
      const ang = rnd() * Math.PI * 2
      const rad = Math.sqrt(rnd()) * s.s
      nodes.push({
        x: inset(s.x + Math.cos(ang) * rad, 0.05),
        y: inset(s.y + Math.sin(ang) * rad, 0.06),
        r: 0.55 + rnd() * 0.75,
        cluster: ci,
        weight: rnd(),
        phase: rnd() * Math.PI * 2,
      })
    }
  })

  while (nodes.length < nodeCount) {
    nodes.push({
      x: inset(rnd(), 0.05),
      y: inset(rnd(), 0.06),
      r: 0.45 + rnd() * 0.4,
      cluster: -1,
      weight: rnd() * 0.4,
      phase: rnd() * Math.PI * 2,
    })
  }

  const clusters: NetworkCluster[] = seeds.map((s, ci) => {
    let best = -1
    let bestW = -1
    nodes.forEach((n, i) => {
      if (n.cluster === ci && n.weight > bestW) {
        bestW = n.weight
        best = i
      }
    })
    if (best >= 0) nodes[best].r = 1.6
    return { x: s.x, y: s.y, candidate: best }
  })

  const seen = new Set<string>()
  const edges: NetworkEdge[] = []
  const add = (a: number, b: number, cluster: number) => {
    if (a === b || a < 0 || b < 0) return
    const key = a < b ? a + '-' + b : b + '-' + a
    if (seen.has(key)) return
    seen.add(key)
    edges.push({ a, b, cluster })
  }

  nodes.forEach((m, a) => {
    if (m.cluster < 0) return
    const near = nodes
      .map((n, b) => ({ b, n, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter((c) => c.b !== a && c.n.cluster === m.cluster)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
    for (const c of near) add(a, c.b, m.cluster)
  })

  nodes.forEach((m, a) => {
    if (m.cluster >= 0) return
    let best = -1
    let bestD = Infinity
    nodes.forEach((n, b) => {
      if (b === a) return
      const d = Math.hypot(n.x - m.x, n.y - m.y)
      if (d < bestD) {
        bestD = d
        best = b
      }
    })
    add(a, best, -1)
  })

  clusters.forEach((c, ci) => {
    add(c.candidate, clusters[(ci + 1) % clusters.length].candidate, -1)
  })

  return { nodes, edges, clusters }
}

export function nearestCluster(clusters: NetworkCluster[], x: number, y: number): number {
  let best = 0
  let bestD = Infinity
  clusters.forEach((c, i) => {
    const d = Math.hypot(c.x - x, c.y - y)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

export const GENOME_LOCI = 7

export interface GenomeBar {
  x: number
  h: number
  locus: number
}

export interface GenomeTrackSegment {
  row: number
  x: number
  w: number
  locus: number
  level: number
}

export interface Genome {
  bars: GenomeBar[]
  wave: { x: number; y: number }[]
  segments: GenomeTrackSegment[]
}

export function buildGenome(barCount: number, seed = 20260504): Genome {
  const rnd = mulberry32(seed)

  const bars: GenomeBar[] = []
  for (let i = 0; i < barCount; i++) {
    const t = barCount === 1 ? 0.5 : i / (barCount - 1)
    const env = 0.42 + 0.34 * Math.sin(t * Math.PI * 1.7 + 0.6)
    bars.push({
      x: t,
      h: Math.min(1, Math.max(0.12, env + (rnd() - 0.5) * 0.42)),
      locus: locusAt(t),
    })
  }

  const SAMPLES = 96
  const wave: { x: number; y: number }[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1)
    const y =
      0.5 +
      0.22 * Math.sin(t * 11.3 + 0.4) +
      0.12 * Math.sin(t * 27.1 + 1.9) +
      0.06 * Math.sin(t * 53.7 + 3.1)
    wave.push({ x: t, y: Math.min(0.96, Math.max(0.04, y)) })
  }

  const segments: GenomeTrackSegment[] = []
  for (let row = 0; row < 3; row++) {
    let x = 0.01 + rnd() * 0.03
    while (x < 0.96) {
      const w = Math.min(0.03 + rnd() * 0.075, 0.98 - x)
      segments.push({
        row,
        x,
        w,
        locus: locusAt(x + w / 2),
        level: 0.25 + rnd() * 0.75,
      })
      x += w + 0.014 + rnd() * 0.03
    }
  }

  return { bars, wave, segments }
}

export function locusAt(x: number): number {
  return Math.min(GENOME_LOCI - 1, Math.max(0, Math.floor(x * GENOME_LOCI)))
}
