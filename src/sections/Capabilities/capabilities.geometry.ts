/**
 * Section 05 — Capabilities. Procedural geometry for the four scientific
 * visuals.
 *
 * Everything here is authored in normalized 0–1 space and pure: the same seed
 * always produces the same arrangement, so a module looks identical across
 * reloads, across resizes and between the animated and reduced-motion
 * presentations. The visuals scale these numbers into whatever pixel box the
 * module happens to have — which is why none of them need to know their own
 * size, and why a resize mid-interaction cannot reshuffle the science.
 *
 * The PRNG is the Journey's and the platform's — a third copy of mulberry32 is
 * a third place for arrangements to drift apart.
 */

/** Deterministic PRNG — the arrangement must be identical on every render. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Clamp into the module's safe area so nothing is drawn under its own border. */
function inset(v: number, pad: number) {
  return Math.min(1 - pad, Math.max(pad, v))
}

// ── 01 · Spatial Biology ────────────────────────────────────────────────────

export interface SpatialMarker {
  /** Normalized position within the microscopy field */
  x: number
  y: number
  /** Relative marker radius, 0.6–1.4 — cell regions are not one size */
  r: number
  /** Idle phase offset, so markers never breathe in unison */
  phase: number
}

export interface SpatialEdge {
  a: number
  b: number
  /** 0–1 length against the linking cutoff — short relationships read first */
  d: number
}

export interface SpatialField {
  markers: SpatialMarker[]
  edges: SpatialEdge[]
}

/** Longest link the field will draw, in normalized units. */
const SPATIAL_MAX_LINK = 0.155

/**
 * Cell regions over the microscopy field.
 *
 * Scattered around a handful of loose tissue regions rather than uniformly: a
 * flat field of dots reads as a texture, and the point of this visual is that
 * biological signals have *neighbourhoods*. Each marker keeps one or two links
 * to its nearest neighbours, which is what appears as a local pathway when the
 * pointer arrives.
 */
export function buildSpatialField(count: number, seed = 20260505): SpatialField {
  const rnd = mulberry32(seed)

  // Loose tissue regions. Spreads differ by design — an even scatter of
  // identical blobs is a grid with extra steps.
  const regions = [
    { x: 0.3, y: 0.36, s: 0.2 },
    { x: 0.62, y: 0.3, s: 0.15 },
    { x: 0.5, y: 0.62, s: 0.22 },
    { x: 0.78, y: 0.66, s: 0.16 },
    { x: 0.18, y: 0.72, s: 0.14 },
  ]

  const markers: SpatialMarker[] = []
  for (let i = 0; i < count; i++) {
    // Every fifth marker sits outside the regions, so the field has sparse
    // ground between its dense areas rather than five tidy islands.
    const loose = i % 5 === 4
    const reg = regions[i % regions.length]
    const ang = rnd() * Math.PI * 2
    // sqrt keeps the sample area-uniform; without it every region is a bullseye.
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

  // Nearest-neighbour links, capped at two per marker. Beyond that the field
  // becomes a mesh and the local relationships stop reading as local.
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

// ── 02 · Protein Engineering ────────────────────────────────────────────────

export interface StructurePoint {
  x: number
  y: number
  r: number
  phase: number
}

/**
 * The floating structural points around the folded protein.
 *
 * Placed on a jittered ring around the asset's bright active site rather than
 * randomly across the box: they have to read as belonging to the structure,
 * and points drifting over its empty corners read as dust. The angular jitter
 * is what keeps the ring from ever being visible as a ring.
 */
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

// ── 03 · AI Discovery ───────────────────────────────────────────────────────

export interface NetworkNode {
  x: number
  y: number
  r: number
  /** Index into `clusters`, or -1 for the weak scattered signals */
  cluster: number
  /** 0–1 relevance; the highest in each cluster becomes its candidate */
  weight: number
  phase: number
}

export interface NetworkEdge {
  a: number
  b: number
  /** Cluster index when both ends belong to it, else -1 (weak, cross-cluster) */
  cluster: number
}

export interface NetworkCluster {
  x: number
  y: number
  /** Node index of this cluster's strongest signal */
  candidate: number
}

export interface Network {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  clusters: NetworkCluster[]
}

/**
 * The discovery network.
 *
 * Deliberately irregular: four clusters of different size and density, plus a
 * scatter of unaffiliated weak signals. §22 fails this visual if it resolves
 * into a sphere, a brain or a tidy neural-net diagram — and all three are what
 * a uniform random graph looks like once it is drawn.
 *
 * The story is the site's story in miniature (§24): many weak relationships,
 * one selected cluster, one candidate. Edges therefore carry the cluster they
 * belong to, so an activation is one group's opacity rather than a per-frame
 * rewrite of every line.
 */
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

  // Whatever the cluster shares leave over becomes weak background signal.
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

  // Each cluster's strongest node is its candidate, and it is pulled up in size
  // so the emphasis has something to land on.
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

  // Intra-cluster: nearest neighbours, so density follows the cluster's own
  // shape instead of every node radiating from a centre.
  nodes.forEach((m, a) => {
    if (m.cluster < 0) return
    const near = nodes
      .map((n, b) => ({ b, n, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter((c) => c.b !== a && c.n.cluster === m.cluster)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
    for (const c of near) add(a, c.b, m.cluster)
  })

  // Weak links: scattered signals reach toward whatever is closest, and each
  // cluster keeps one thin thread to the next. These are the "many weak
  // relationships" that the selection has to cut through.
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

/** Index of the cluster whose centre is nearest a normalized point. */
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

// ── 04 · Genomic Intelligence ───────────────────────────────────────────────

/** How many loci the genomic strip is divided into, left to right. */
export const GENOME_LOCI = 7

export interface GenomeBar {
  x: number
  /** 0–1 signal height */
  h: number
  locus: number
}

export interface GenomeTrackSegment {
  /** Track row, 0-based from the top */
  row: number
  x: number
  w: number
  locus: number
  /** 0–1 expression level, drawn as segment opacity */
  level: number
}

export interface Genome {
  /** Left band — vertical signal bars */
  bars: GenomeBar[]
  /** Centre band — one continuous waveform, sampled left to right */
  wave: { x: number; y: number }[]
  /** Right band — compressed expression tracks */
  segments: GenomeTrackSegment[]
}

/**
 * The genomic strip: signal bars, a waveform, compressed expression tracks.
 *
 * Three readouts of the same coordinate rather than three decorations — every
 * element carries the locus it belongs to, so brightening a locus lights the
 * matching bar, the matching stretch of waveform and the matching track
 * segments at once. That is what makes a pointer sweep read as moving along a
 * genome rather than along a row of bars. §26 rules out a literal helix.
 */
export function buildGenome(barCount: number, seed = 20260504): Genome {
  const rnd = mulberry32(seed)

  const bars: GenomeBar[] = []
  for (let i = 0; i < barCount; i++) {
    const t = barCount === 1 ? 0.5 : i / (barCount - 1)
    // A slow envelope under the noise, so the bars have regions of activity
    // rather than a uniformly ragged skyline.
    const env = 0.42 + 0.34 * Math.sin(t * Math.PI * 1.7 + 0.6)
    bars.push({
      x: t,
      h: Math.min(1, Math.max(0.12, env + (rnd() - 0.5) * 0.42)),
      locus: locusAt(t),
    })
  }

  // Deterministic sum of sines: continuous, non-repeating across the strip, and
  // identical between the animated and static presentations.
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

/** Which locus a normalized x lands in. */
export function locusAt(x: number): number {
  return Math.min(GENOME_LOCI - 1, Math.max(0, Math.floor(x * GENOME_LOCI)))
}
