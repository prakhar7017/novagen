export const FRAME = { x: 2.15, y: 1.42, z: 0.72 } as const

export function impactFit(viewportWidth: number): number {
  return Math.max(0.5, Math.min(1.12, viewportWidth / 8.2))
}

export const SEED = { plane: 2.4, restScale: 0.92, finalScale: 0.68 } as const

const REGIONS = 11

const CANDIDATES = 3

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Region {
  x: number
  y: number
  z: number
  spread: number
  weight: number
  importance: number
}

export interface ImpactPopulation {
  count: number
  scale: Float32Array
  prioritize: Float32Array
  validate: Float32Array
  color: Float32Array
  size: Float32Array
  random: Float32Array
  strength: Float32Array
  winner: Float32Array
  inward: Float32Array
}

export interface ImpactTargets {
  signals: ImpactPopulation
  nodes: ImpactPopulation
  lineIndices: Uint16Array
  bridgeIndices: Uint16Array
  evidenceIndices: Uint16Array
  candidates: Float32Array
}

export interface ImpactDensity {
  signals: number
  nodes: number
  maxLines: number
}

const MINT = [0.776, 0.961, 0.882] as const
const GREEN = [0.651, 1.0, 0.416] as const
const FAINT = [0.42, 0.63, 0.56] as const

function smooth01(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
}

function buildRegions(rnd: () => number): Region[] {
  const out: Region[] = []
  const MIN_GAP = 0.72

  while (out.length < REGIONS) {
    let placed = false
    for (let attempt = 0; attempt < 28 && !placed; attempt++) {
      const x = (rnd() * 2 - 1) * FRAME.x * 0.84
      const y = (rnd() * 2 - 1) * FRAME.y * 0.8
      const far = out.every((c) => Math.hypot(c.x - x, c.y - y) > MIN_GAP)
      if (!far && attempt < 27) continue
      out.push({
        x,
        y,
        z: (Math.floor(rnd() * 4) - 1.5) * 0.34 + (rnd() - 0.5) * 0.16,
        spread: 0.16 + rnd() * 0.2,
        weight: 0.4 + rnd() * 1.3,
        importance: rnd(),
      })
      placed = true
    }
  }
  return out
}

interface BuildContext {
  regions: Region[]
  candidateIds: number[]
  candidates: Float32Array
  winnerRegion: number
}

function fillPopulation(
  count: number,
  ctx: BuildContext,
  rnd: () => number,
  opts: { looseChance: number; spreadScale: number; sizeBase: number; sizeVar: number },
): { pop: ImpactPopulation; region: Int32Array } {
  const { regions, candidateIds, candidates, winnerRegion } = ctx

  const scale = new Float32Array(count * 3)
  const prioritize = new Float32Array(count * 3)
  const validate = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)
  const inward = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const random = new Float32Array(count)
  const strength = new Float32Array(count)
  const winner = new Float32Array(count)
  const region = new Int32Array(count)

  const totalWeight = regions.reduce((s, c) => s + c.weight, 0)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    const loose = rnd() < opts.looseChance
    let ci = 0
    if (loose) {
      ci = Math.floor(rnd() * regions.length)
    } else {
      let pick = rnd() * totalWeight
      for (let c = 0; c < regions.length; c++) {
        pick -= regions[c].weight
        if (pick <= 0) {
          ci = c
          break
        }
      }
    }
    const rg = regions[ci]
    region[i] = loose ? -1 : ci

    const spread = (loose ? 1.05 : rg.spread) * opts.spreadScale
    const ox = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.7 : 1)
    const oy = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.25 : 1)
    const oz = (rnd() + rnd() + rnd() - 1.5) * spread * 0.8

    const sx = Math.max(-FRAME.x, Math.min(FRAME.x, rg.x + ox))
    const sy = Math.max(-FRAME.y, Math.min(FRAME.y, rg.y + oy))
    const sz = Math.max(-FRAME.z, Math.min(FRAME.z, rg.z + oz))
    scale[i3] = sx
    scale[i3 + 1] = sy
    scale[i3 + 2] = sz

    const rank = loose ? -1 : candidateIds.indexOf(ci)
    const s =
      rank >= 0
        ? 0.6 + (CANDIDATES - rank) * 0.11 + rnd() * 0.1
        : 0.04 + rnd() * 0.38
    strength[i] = Math.min(1, s)
    winner[i] = ci === winnerRegion && !loose ? 1 : 0

    if (rank >= 0) {
      const k = rank * 3
      const px = candidates[k] + ox * 0.5
      const py = candidates[k + 1] + oy * 0.5
      const pz = candidates[k + 2] + oz * 0.5
      prioritize[i3] = px
      prioritize[i3 + 1] = py
      prioritize[i3 + 2] = pz
      inward[i3] = candidates[k] - px
      inward[i3 + 1] = candidates[k + 1] - py
      inward[i3 + 2] = candidates[k + 2] - pz
    } else {
      prioritize[i3] = sx * 1.24
      prioritize[i3 + 1] = sy * 1.24
      prioritize[i3 + 2] = sz * 1.05
    }

    if (winner[i] > 0.5) {
      const a = Math.atan2(oy, ox)
      const core = rnd() < 0.76
      const r = core ? 0.04 + rnd() * 0.13 : 0.42 + (rnd() - 0.5) * 0.22
      validate[i3] = Math.cos(a) * r * 1.05
      validate[i3 + 1] = Math.sin(a) * r
      validate[i3 + 2] = (rnd() - 0.5) * (core ? 0.1 : 0.2)
    } else {
      validate[i3] = prioritize[i3] * 1.28
      validate[i3 + 1] = prioritize[i3 + 1] * 1.28
      validate[i3 + 2] = prioritize[i3 + 2]
    }

    const t = smooth01((strength[i] - 0.5) / 0.42)
    const u = smooth01(strength[i] / 0.5)
    for (let c = 0; c < 3; c++) {
      const base = FAINT[c] + (MINT[c] - FAINT[c]) * u
      color[i3 + c] = base + (GREEN[c] - base) * t
    }

    size[i] = opts.sizeBase + rnd() * opts.sizeVar + strength[i] * opts.sizeVar * 0.8
    random[i] = rnd()
  }

  return {
    pop: { count, scale, prioritize, validate, color, size, random, strength, winner, inward },
    region,
  }
}

export function buildImpactTargets(
  density: ImpactDensity,
  seed = 20260807,
): ImpactTargets {
  const rnd = mulberry32(seed)
  const regions = buildRegions(rnd)

  const candidateIds = regions
    .map((c, i) => ({ i, importance: c.importance }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, CANDIDATES)
    .map((r) => r.i)

  const winnerRegion = candidateIds[0]

  const candidates = new Float32Array(CANDIDATES * 3)
  candidateIds.forEach((ci, k) => {
    const c = regions[ci]
    candidates[k * 3] = c.x * 0.58
    candidates[k * 3 + 1] = c.y * 0.62
    candidates[k * 3 + 2] = c.z * 0.45
  })

  const ctx: BuildContext = { regions, candidateIds, candidates, winnerRegion }

  const { pop: signals } = fillPopulation(density.signals, ctx, rnd, {
    looseChance: 0.3,
    spreadScale: 1.55,
    sizeBase: 0.34,
    sizeVar: 0.38,
  })

  const { pop: nodes, region: nodeRegion } = fillPopulation(density.nodes, ctx, rnd, {
    looseChance: 0.08,
    spreadScale: 1,
    sizeBase: 1.05,
    sizeVar: 0.85,
  })

  return {
    signals,
    nodes,
    candidates,
    ...buildConnections(nodes, nodeRegion, winnerRegion, density.maxLines),
  }
}

function buildConnections(
  nodes: ImpactPopulation,
  region: Int32Array,
  winnerRegion: number,
  maxLines: number,
): {
  lineIndices: Uint16Array
  bridgeIndices: Uint16Array
  evidenceIndices: Uint16Array
} {
  const count = nodes.count
  const pos = nodes.scale
  const pairs: number[] = []
  const bridges: number[] = []
  const seen = new Set<number>()

  const add = (a: number, b: number, into: number[]) => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const key = lo * count + hi
    if (seen.has(key)) return false
    seen.add(key)
    into.push(lo, hi)
    return true
  }

  const dist2 = (a: number, b: number) => {
    const dx = pos[a * 3] - pos[b * 3]
    const dy = pos[a * 3 + 1] - pos[b * 3 + 1]
    const dz = pos[a * 3 + 2] - pos[b * 3 + 2]
    return dx * dx + dy * dy + dz * dz
  }

  for (let i = 0; i < count && pairs.length < maxLines * 2; i++) {
    if (region[i] < 0) continue
    let b1 = -1
    let b2 = -1
    let d1 = Infinity
    let d2 = Infinity
    for (let j = 0; j < count; j++) {
      if (j === i || region[j] !== region[i]) continue
      const d = dist2(i, j)
      if (d < d1) {
        d2 = d1
        b2 = b1
        d1 = d
        b1 = j
      } else if (d < d2) {
        d2 = d
        b2 = j
      }
    }
    if (b1 >= 0) add(i, b1, pairs)
    if (b2 >= 0 && i % 3 !== 0) add(i, b2, pairs)
  }

  const list = Array.from(new Set(Array.from(region).filter((c) => c >= 0)))
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) {
      let best = Infinity
      let bi = -1
      let bj = -1
      for (let i = 0; i < count; i++) {
        if (region[i] !== list[a]) continue
        for (let j = 0; j < count; j++) {
          if (region[j] !== list[b]) continue
          const d = dist2(i, j)
          if (d < best) {
            best = d
            bi = i
            bj = j
          }
        }
      }
      if (bi >= 0 && best < 0.52) add(bi, bj, bridges)
    }
  }

  const evidence: number[] = []
  for (let k = 0; k < pairs.length; k += 2) {
    const a = pairs[k]
    const b = pairs[k + 1]
    if (region[a] === winnerRegion && region[b] === winnerRegion) evidence.push(a, b)
  }

  return {
    lineIndices: new Uint16Array(pairs),
    bridgeIndices: new Uint16Array(bridges),
    evidenceIndices: new Uint16Array(evidence),
  }
}

export function sampleArrangement(
  pop: ImpactPopulation,
  morph: number,
  out: Float32Array,
): Float32Array {
  const m = Math.max(0, Math.min(2, morph))
  const a = Math.min(1, m)
  const b = Math.max(0, m - 1)
  for (let i = 0; i < pop.count * 3; i++) {
    const p0 = pop.scale[i] + (pop.prioritize[i] - pop.scale[i]) * a
    out[i] = p0 + (pop.validate[i] - p0) * b
  }
  return out
}
