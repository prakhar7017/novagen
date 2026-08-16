export const FRAME = { x: 2.0, y: 1.35, z: 0.55 } as const

const CLUSTERS = 7

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Cluster {
  x: number
  y: number
  z: number
  spread: number
  weight: number
  importance: number
}

export interface TechTargets {
  count: number
  sample: Float32Array
  map: Float32Array
  interpret: Float32Array
  predict: Float32Array
  validate: Float32Array
  color: Float32Array
  size: Float32Array
  random: Float32Array
  strength: Float32Array
  winner: Float32Array
  lineIndices: Uint16Array
  bridgeIndices: Uint16Array
  candidates: Float32Array
}

const MINT = [0.776, 0.961, 0.882] as const
const GREEN = [0.651, 1.0, 0.416] as const

function smooth01(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
}

function buildClusters(rnd: () => number): Cluster[] {
  const out: Cluster[] = []
  const MIN_GAP = 0.86

  while (out.length < CLUSTERS) {
    let placed = false
    for (let attempt = 0; attempt < 24 && !placed; attempt++) {
      const x = (rnd() * 2 - 1) * FRAME.x * 0.82
      const y = (rnd() * 2 - 1) * FRAME.y * 0.78
      const far = out.every((c) => Math.hypot(c.x - x, c.y - y) > MIN_GAP)
      if (!far && attempt < 23) continue
      out.push({
        x,
        y,
        z: (Math.floor(rnd() * 3) - 1) * 0.3 + (rnd() - 0.5) * 0.14,
        spread: 0.15 + rnd() * 0.14,
        weight: 0.55 + rnd(),
        importance: rnd(),
      })
      placed = true
    }
  }
  return out
}

export function buildTechTargets(count: number, seed = 20260415): TechTargets {
  const rnd = mulberry32(seed)
  const clusters = buildClusters(rnd)

  const ranked = clusters
    .map((c, i) => ({ i, importance: c.importance }))
    .sort((a, b) => b.importance - a.importance)
  const shortlist = ranked.slice(0, 4).map((r) => r.i)
  const winnerCluster = shortlist[0]

  const candidates = new Float32Array(shortlist.length * 3)
  shortlist.forEach((ci, k) => {
    const c = clusters[ci]
    candidates[k * 3] = c.x * 0.66
    candidates[k * 3 + 1] = c.y * 0.66
    candidates[k * 3 + 2] = c.z * 0.5
  })

  const sample = new Float32Array(count * 3)
  const map = new Float32Array(count * 3)
  const interpret = new Float32Array(count * 3)
  const predict = new Float32Array(count * 3)
  const validate = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const random = new Float32Array(count)
  const strength = new Float32Array(count)
  const winner = new Float32Array(count)
  const nodeCluster = new Int32Array(count)

  const totalWeight = clusters.reduce((s, c) => s + c.weight, 0)

  for (let i = 0; i < count; i++) {
    const loose = rnd() < 0.1
    let ci = 0
    if (!loose) {
      let pick = rnd() * totalWeight
      for (let c = 0; c < clusters.length; c++) {
        pick -= clusters[c].weight
        if (pick <= 0) {
          ci = c
          break
        }
      }
    } else {
      ci = Math.floor(rnd() * clusters.length)
    }
    const cl = clusters[ci]
    nodeCluster[i] = loose ? -1 : ci

    const spread = loose ? 0.95 : cl.spread
    const ox = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.6 : 1)
    const oy = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.2 : 1)
    const oz = (rnd() + rnd() + rnd() - 1.5) * spread * 0.55

    const i3 = i * 3

    const mx = Math.max(-FRAME.x, Math.min(FRAME.x, cl.x + ox))
    const my = Math.max(-FRAME.y, Math.min(FRAME.y, cl.y + oy))
    const mz = Math.max(-FRAME.z, Math.min(FRAME.z, cl.z + oz))
    map[i3] = mx
    map[i3 + 1] = my
    map[i3 + 2] = mz

    const fold = 0.36
    const wob = 0.055
    sample[i3] = mx * fold + (rnd() - 0.5) * wob
    sample[i3 + 1] = my * fold + (rnd() - 0.5) * wob
    sample[i3 + 2] = mz * fold + (rnd() - 0.5) * wob + 0.12

    const tighten = loose ? 0 : 0.16
    interpret[i3] = mx - ox * tighten
    interpret[i3 + 1] = my - oy * tighten
    interpret[i3 + 2] = mz - oz * tighten

    const shortlistRank = shortlist.indexOf(ci)
    const s =
      shortlistRank >= 0 && !loose
        ? 0.62 + (3 - shortlistRank) * 0.1 + rnd() * 0.12
        : 0.06 + rnd() * 0.34
    strength[i] = Math.min(1, s)
    winner[i] = ci === winnerCluster && !loose ? 1 : 0

    if (shortlistRank >= 0 && !loose) {
      const k = shortlistRank * 3
      predict[i3] = candidates[k] + ox * 0.42
      predict[i3 + 1] = candidates[k + 1] + oy * 0.42
      predict[i3 + 2] = candidates[k + 2] + oz * 0.42
    } else {
      predict[i3] = mx * 1.14
      predict[i3 + 1] = my * 1.14
      predict[i3 + 2] = mz
    }

    if (winner[i] > 0.5) {
      const a = Math.atan2(oy, ox)
      const r = 1.0 + (rnd() - 0.5) * 0.14
      validate[i3] = Math.cos(a) * r * 1.06
      validate[i3 + 1] = Math.sin(a) * r
      validate[i3 + 2] = (rnd() - 0.5) * 0.2
    } else {
      validate[i3] = predict[i3] * 1.2
      validate[i3 + 1] = predict[i3 + 1] * 1.2
      validate[i3 + 2] = predict[i3 + 2]
    }

    const t = smooth01((strength[i] - 0.52) / 0.4)
    color[i3] = MINT[0] + (GREEN[0] - MINT[0]) * t
    color[i3 + 1] = MINT[1] + (GREEN[1] - MINT[1]) * t
    color[i3 + 2] = MINT[2] + (GREEN[2] - MINT[2]) * t

    size[i] = 0.85 + rnd() * 0.85 + strength[i] * 0.75
    random[i] = rnd()
  }

  return {
    count,
    sample,
    map,
    interpret,
    predict,
    validate,
    color,
    size,
    random,
    strength,
    winner,
    ...buildConnections(map, nodeCluster, count),
    candidates,
  }
}

function buildConnections(
  map: Float32Array,
  nodeCluster: Int32Array,
  count: number,
): { lineIndices: Uint16Array; bridgeIndices: Uint16Array } {
  const pairs: number[] = []
  const bridges: number[] = []
  const seen = new Set<number>()

  const add = (a: number, b: number, into: number[] = pairs) => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const key = lo * count + hi
    if (seen.has(key)) return
    seen.add(key)
    into.push(lo, hi)
  }

  const dist2 = (a: number, b: number) => {
    const dx = map[a * 3] - map[b * 3]
    const dy = map[a * 3 + 1] - map[b * 3 + 1]
    const dz = map[a * 3 + 2] - map[b * 3 + 2]
    return dx * dx + dy * dy + dz * dz
  }

  for (let i = 0; i < count; i++) {
    if (nodeCluster[i] < 0) continue
    let b1 = -1
    let b2 = -1
    let d1 = Infinity
    let d2 = Infinity
    for (let j = 0; j < count; j++) {
      if (j === i || nodeCluster[j] !== nodeCluster[i]) continue
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
    if (b1 >= 0) add(i, b1)
    if (b2 >= 0 && i % 3 !== 0) add(i, b2)
  }

  const regions = new Set(Array.from(nodeCluster).filter((c) => c >= 0))
  const list = Array.from(regions)
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) {
      let best = Infinity
      let bi = -1
      let bj = -1
      for (let i = 0; i < count; i++) {
        if (nodeCluster[i] !== list[a]) continue
        for (let j = 0; j < count; j++) {
          if (nodeCluster[j] !== list[b]) continue
          const d = dist2(i, j)
          if (d < best) {
            best = d
            bi = i
            bj = j
          }
        }
      }
      if (bi >= 0 && best < 1.05) add(bi, bj, bridges)
    }
  }

  return {
    lineIndices: new Uint16Array(pairs),
    bridgeIndices: new Uint16Array(bridges),
  }
}
