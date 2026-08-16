/**
 * Impact's population: one dense biological field, three arrangements.
 *
 * §37 asks for exactly this model — every point carries a scale position, a
 * candidate position and a validated position, and progress mixes between them.
 * Nothing is created or destroyed between states, which is what makes 14.8M →
 * 72× → 91% read as a *reduction of one thing* rather than as three pictures
 * shown in sequence (§55 fails the section for the latter).
 *
 * Two populations, one geometry:
 *
 *   signal  ~2,400 tiny points with no connections. The perceived scale (§15) —
 *           14.8 million relationships cannot be drawn, and the abstraction
 *           that stands in for them is a field far denser than the part of it
 *           that is legible.
 *   node    ~200 larger points that carry the connection graph. These are the
 *           relationships the platform can actually name.
 *
 * Both are built from the same regions and contract toward the same anchors, so
 * the dust and the network compress together rather than as two effects.
 *
 * Pure typed-array math with no three.js import, so the mobile and
 * reduced-motion SVG diagrams can project the identical arrangements without
 * pulling WebGL into the bundle — and so the whole thing is testable.
 */

/** Authoring half-extents. The scene scales this box to fit the viewport. */
export const FRAME = { x: 2.15, y: 1.42, z: 0.72 } as const

/**
 * How the authored box is fitted to the actual frustum.
 *
 * Exported rather than inlined in the scene because section 08 has to place its
 * closing cell exactly where this section leaves its collapsed target, and a
 * second copy of this arithmetic is a second copy that can drift. The ceiling
 * stops the composition inflating on ultrawide screens.
 */
export function impactFit(viewportWidth: number): number {
  return Math.max(0.5, Math.min(1.12, viewportWidth / 8.2))
}

/**
 * The closing seed's geometry (§53).
 *
 * The Final CTA's cell begins as a pixel-exact copy of this point, so both
 * sections read the numbers from here instead of each hard-coding them. Its
 * on-screen half-extent is `plane / 2 * finalScale * impactFit(viewport.width)`.
 */
export const SEED = { plane: 2.4, restScale: 0.92, finalScale: 0.68 } as const

/**
 * Biological regions in the SCALE field.
 *
 * More than Technology's seven and deliberately uneven in weight: this field
 * has to read as too much to interpret, and a small number of tidy blobs reads
 * as an already-organised diagram.
 */
const REGIONS = 11

/** Regions that survive filtering — the "three dominant candidate regions" (§19). */
const CANDIDATES = 3

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

interface Region {
  x: number
  y: number
  z: number
  spread: number
  weight: number
  importance: number
}

/** One population's buffers. Identical layout for signals and nodes. */
export interface ImpactPopulation {
  count: number
  /** 14.8M — the dense, unfiltered field */
  scale: Float32Array
  /** 72× — candidate regions contract onto anchors; everything else recedes */
  prioritize: Float32Array
  /** 91% — one validated target with a small evidence ring around it */
  validate: Float32Array
  color: Float32Array
  size: Float32Array
  random: Float32Array
  /** 0–1 importance — drives selective brightness and the filter (§20) */
  strength: Float32Array
  /** 1 for points belonging to the validated candidate, else 0 */
  winner: Float32Array
  /**
   * Direction from this point's candidate anchor, so the extra PRIORITIZE
   * contraction (§19) can tighten toward the anchor without needing the anchor
   * itself in the shader. Zero for points with no candidate.
   */
  inward: Float32Array
}

export interface ImpactTargets {
  signals: ImpactPopulation
  nodes: ImpactPopulation
  /** Node pairs inside a region — the readable part of the network */
  lineIndices: Uint16Array
  /**
   * Node pairs *between* regions. Retired as filtering begins: once the
   * candidate regions contract, a link to a region that stayed behind stops
   * being a relationship and becomes a line across the composition (§20 asks
   * for connection pruning, not for everything flying to the centre).
   */
  bridgeIndices: Uint16Array
  /** Node pairs that survive into VALIDATE — the few strong evidence paths (§24) */
  evidenceIndices: Uint16Array
  /** Candidate anchors in prioritize space, 3 floats each, strongest first */
  candidates: Float32Array
}

export interface ImpactDensity {
  signals: number
  nodes: number
  /** Cap on intra-region node pairs, so connection count is bounded (§51) */
  maxLines: number
}

const MINT = [0.776, 0.961, 0.882] as const
const GREEN = [0.651, 1.0, 0.416] as const
/** Deep, desaturated mint for the bulk of the field — most of it is noise. */
const FAINT = [0.42, 0.63, 0.56] as const

function smooth01(t: number) {
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  return c * c * (3 - 2 * c)
}

/**
 * Region centres, placed by rejection sampling.
 *
 * A ring reads as the "generic network sphere" §16 rules out and a grid reads
 * as a coordinate plot; rejection sampling produces the irregular, asymmetric
 * spacing of actual tissue while still keeping the regions far enough apart to
 * be legible as separate places once the field thins out.
 */
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
        // Four loose depth planes rather than a continuous cloud, so the field
        // reads as layered biology rather than as a flat scatter (§16).
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

/**
 * Fill one population's buffers.
 *
 * `looseness` separates the two populations without duplicating the model: the
 * signal dust scatters wider and sits further out of the regions than the nodes
 * do, which is what gives the field its haze around a legible core.
 */
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

    // ── Which region this point belongs to ───────────────────────────────
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

    // Sum of three uniforms ≈ gaussian: dense at the centre, thinning outward.
    const spread = (loose ? 1.05 : rg.spread) * opts.spreadScale
    const ox = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.7 : 1)
    const oy = (rnd() + rnd() + rnd() - 1.5) * spread * (loose ? 1.25 : 1)
    const oz = (rnd() + rnd() + rnd() - 1.5) * spread * 0.8

    // ── SCALE: the dense, unfiltered field ───────────────────────────────
    const sx = Math.max(-FRAME.x, Math.min(FRAME.x, rg.x + ox))
    const sy = Math.max(-FRAME.y, Math.min(FRAME.y, rg.y + oy))
    const sz = Math.max(-FRAME.z, Math.min(FRAME.z, rg.z + oz))
    scale[i3] = sx
    scale[i3 + 1] = sy
    scale[i3 + 2] = sz

    // ── Importance ───────────────────────────────────────────────────────
    // Candidate regions are strong, everything else is weak — but with enough
    // overlap that the filter reads as a judgement rather than as two
    // pre-separated groups.
    const rank = loose ? -1 : candidateIds.indexOf(ci)
    const s =
      rank >= 0
        ? 0.6 + (CANDIDATES - rank) * 0.11 + rnd() * 0.1
        : 0.04 + rnd() * 0.38
    strength[i] = Math.min(1, s)
    winner[i] = ci === winnerRegion && !loose ? 1 : 0

    // ── PRIORITIZE: candidates group, the rest are deactivated ───────────
    // §20 rules out everything flying toward screen centre, so the survivors
    // move only a third of the way in and the discarded material drifts
    // *outward* — the field empties rather than implodes.
    if (rank >= 0) {
      const k = rank * 3
      const px = candidates[k] + ox * 0.5
      const py = candidates[k + 1] + oy * 0.5
      const pz = candidates[k + 2] + oz * 0.5
      prioritize[i3] = px
      prioritize[i3 + 1] = py
      prioritize[i3 + 2] = pz
      // Toward the anchor, for the second contraction. Unnormalized on
      // purpose: points furthest from the anchor should travel furthest, which
      // is what makes the extra squeeze read as tightening rather than as a
      // uniform shrink.
      inward[i3] = candidates[k] - px
      inward[i3 + 1] = candidates[k + 1] - py
      inward[i3 + 2] = candidates[k + 2] - pz
    } else {
      prioritize[i3] = sx * 1.24
      prioritize[i3 + 1] = sy * 1.24
      prioritize[i3 + 2] = sz * 1.05
    }

    // ── VALIDATE: one target, one small evidence network ─────────────────
    if (winner[i] > 0.5) {
      // A polar remap of the winning region: a point's direction from its own
      // region centre becomes its angle around the target, so neighbours stay
      // neighbours and connections stay short chords instead of crossing it.
      const a = Math.atan2(oy, ox)
      // Three quarters of the winning region collapses into the target itself
      // and the rest forms the supporting evidence around it — §24 asks for
      // "one primary candidate plus a small supporting network", which is a
      // dense centre with a few points near it, not a ring of equals.
      //
      // Both radii are held well inside the confidence arc that frames this in
      // the DOM: evidence spilling past the ring turns a framed target into a
      // scribble with a circle behind it.
      const core = rnd() < 0.76
      const r = core ? 0.04 + rnd() * 0.13 : 0.42 + (rnd() - 0.5) * 0.22
      validate[i3] = Math.cos(a) * r * 1.05
      validate[i3 + 1] = Math.sin(a) * r
      validate[i3 + 2] = (rnd() - 0.5) * (core ? 0.1 : 0.2)
    } else {
      // Non-winners keep travelling outward as they fade, so the frame empties
      // instead of blinking off (§23 — uncertainty *loses* its claim).
      validate[i3] = prioritize[i3] * 1.28
      validate[i3 + 1] = prioritize[i3 + 1] * 1.28
      validate[i3 + 2] = prioritize[i3 + 2]
    }

    // ── Appearance ───────────────────────────────────────────────────────
    // A faint mint for the bulk of the field, Signal Mint for material with
    // some weight, and Bio Green reserved for what the platform considers
    // important (§29). Colour never carries meaning alone — the copy and the
    // metadata state the same thing.
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

  // The candidate regions, most important first. A property of the field, not
  // a new set of objects invented at the 72× stage — which is the continuity
  // §37 is really asking for.
  const candidateIds = regions
    .map((c, i) => ({ i, importance: c.importance }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, CANDIDATES)
    .map((r) => r.i)

  const winnerRegion = candidateIds[0]

  // Anchors pull ~40% toward the centre and spread the three survivors apart in
  // y, so the prioritized state is a legible grouping rather than the same
  // regions sitting where they always were.
  const candidates = new Float32Array(CANDIDATES * 3)
  candidateIds.forEach((ci, k) => {
    const c = regions[ci]
    candidates[k * 3] = c.x * 0.58
    candidates[k * 3 + 1] = c.y * 0.62
    candidates[k * 3 + 2] = c.z * 0.45
  })

  const ctx: BuildContext = { regions, candidateIds, candidates, winnerRegion }

  // The dust is deliberately loose and small: at ~2,400 points it is the only
  // thing carrying "millions", and any structure in it would compete with the
  // network it exists to surround (§16).
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

/**
 * The relationship graph.
 *
 * Nearest-neighbour *within* a region plus a handful of bridges between
 * adjacent regions — dense where the biology is dense, sparse elsewhere, and
 * plenty of nodes with no connection at all. A uniform k-NN over the whole
 * population produces the even mesh that reads as the generic AI-brain
 * animation §16 rules out.
 */
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

  // Intra-region: each node reaches its two nearest neighbours in the same
  // region. Loose nodes (region -1) stay unconnected on purpose — the haze is
  // material the platform has not related to anything.
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
    // Intermittent second link, so regions do not fill in solid and the denser
    // ones stay visibly denser.
    if (b2 >= 0 && i % 3 !== 0) add(i, b2, pairs)
  }

  // Inter-region: the single shortest link between each adjacent pair, so the
  // bridges read as deliberate routes rather than as noise.
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
      // Only genuinely adjacent regions. `best` is a *squared* distance, so
      // this is a ~0.72-unit reach — a sixth of the frame width. At the 1.07
      // this started at, two thirds of the region pairs qualified and the field
      // triangulated itself into the constellation §16 rules out.
      if (bi >= 0 && best < 0.52) add(bi, bj, bridges)
    }
  }

  // Evidence: the subset of intra-region pairs that belong to the winner, which
  // is what remains at 91%. Derived from the same list rather than generated
  // separately, so the final few paths were visibly there all along (§24).
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

/**
 * The arrangement at a given morph value, on the CPU.
 *
 * The GPU does this in the vertex shader; this exists so the mobile and
 * reduced-motion diagrams can draw the *same* three arrangements as SVG rather
 * than a second designer's impression of them (§41, §49). Writes into a caller-
 * supplied array so nothing allocates per call.
 */
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
