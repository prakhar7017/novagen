/**
 * Section 06 — Study 03. Geometry for the procedural research figure (§27).
 *
 * §26 rules out a third raster asset, so this study is drawn: three biological
 * states, each with its own signal distribution, converging into one shared
 * relationship cluster. Everything here is pure and seeded, which is what lets
 * the figure be identical across reloads, across a resize and between the
 * animated and reduced-motion presentations — a figure that reshuffles when the
 * window changes width is a figure nobody can point at.
 *
 * Authored in a fixed 760 × 470 viewBox and scaled by the SVG, so nothing in
 * the component needs to know its own pixel size.
 *
 * The distributions are abstract on purpose (§29): no axis values, no counts
 * presented as measurements. The figure shows a shape of evidence, not data.
 */

/** Same PRNG as the Journey, the platform and the capability visuals. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const FIGURE_VIEWBOX = { width: 760, height: 470 } as const

/**
 * Vertical anatomy of the figure, in viewBox units.
 *
 * Tuned so the drawing occupies its panel rather than floating in the middle
 * of it: the clouds start close under their labels, the cluster reaches most
 * of the way to the lower edge, and the whitespace that remains is between the
 * two halves of the argument rather than around the outside of it.
 */
export const FIGURE_ROWS = {
  /** Baseline of the STATE / n labels */
  stateLabel: 42,
  /** Signal clouds live between these */
  cloudTop: 70,
  cloudBottom: 208,
  /** Where each state's stem leaves its cloud */
  stemTop: 226,
  /** The hairline the SHARED SIGNAL label sits on */
  divider: 286,
  /** Cluster bounds */
  clusterTop: 320,
  clusterBottom: 448,
} as const

/** Horizontal centres of the three state columns. */
export const STATE_CENTERS = [146, 380, 614] as const

/** Half-width of a signal cloud — no dot may leave its own column. */
export const CLOUD_BOUNDS = { half: 96 } as const
const CLOUD_HALF = CLOUD_BOUNDS.half

export interface FigureDot {
  x: number
  y: number
  /** 2–3.6 — signal points are not one size */
  r: number
  /**
   * True for the points this state contributes to the shared cluster. They are
   * the only Bio Green in the figure's clouds, which is what makes the
   * convergence legible before a single label is read.
   */
  shared: boolean
}

export interface FigureState {
  id: string
  label: string
  cx: number
  dots: FigureDot[]
  /** Path from the cloud's foot to the shared cluster */
  stem: string
}

export interface ClusterNode {
  x: number
  y: number
  r: number
  /** The one node every state's evidence agrees on */
  primary: boolean
}

export interface ClusterEdge {
  a: number
  b: number
}

export interface ResearchFigureModel {
  states: FigureState[]
  nodes: ClusterNode[]
  edges: ClusterEdge[]
}

/**
 * Three distributions with three characters, from the same generator.
 *
 * `spread` scales the cloud's horizontal reach and `bias` shifts its vertical
 * mass, so state A reads as broad and diffuse, B as split, and C as tight and
 * settled — the visual argument that a relationship survives all three.
 */
const PROFILES = [
  { id: 'A', spread: 1, bias: 0.46, shared: 0.22 },
  { id: 'B', spread: 0.82, bias: 0.58, shared: 0.3 },
  { id: 'C', spread: 0.6, bias: 0.66, shared: 0.42 },
] as const

/** Where each state's stem enters the cluster. */
const STEM_TARGETS = [
  { x: 288, y: FIGURE_ROWS.clusterTop + 8 },
  { x: 380, y: FIGURE_ROWS.clusterTop - 4 },
  { x: 472, y: FIGURE_ROWS.clusterTop + 8 },
] as const

/**
 * The shared relationship cluster (§27).
 *
 * Authored rather than generated: six nodes and seven edges is a shape, not a
 * sample, and the point of the figure is that it resolves to something small
 * enough to describe. Coordinates are relative to the cluster band.
 */
const CLUSTER_NODES: ClusterNode[] = [
  { x: 250, y: 424, r: 4.2, primary: false },
  { x: 322, y: 366, r: 4.6, primary: false },
  { x: 380, y: 420, r: 6, primary: true },
  { x: 444, y: 358, r: 4.4, primary: false },
  { x: 512, y: 412, r: 4.2, primary: false },
  { x: 392, y: 336, r: 3.6, primary: false },
]

const CLUSTER_EDGES: ClusterEdge[] = [
  { a: 0, b: 1 },
  { a: 1, b: 2 },
  { a: 2, b: 3 },
  { a: 3, b: 4 },
  { a: 0, b: 2 },
  { a: 2, b: 4 },
  { a: 1, b: 5 },
  { a: 5, b: 3 },
]

/**
 * Builds the figure.
 *
 * @param counts dots per state — the mobile figure draws fewer, because the
 *   same cloud in a 320px-wide frame is a smudge rather than a distribution.
 * @param seed   fixed by default; only the tests vary it.
 */
export function buildResearchFigure(
  counts: readonly [number, number, number],
  seed = 0x5e51,
): ResearchFigureModel {
  const rand = mulberry32(seed)
  const { cloudTop, cloudBottom, stemTop } = FIGURE_ROWS
  const cloudHeight = cloudBottom - cloudTop

  const states = PROFILES.map((profile, i) => {
    const cx = STATE_CENTERS[i]
    const count = Math.max(1, Math.round(counts[i]))
    const dots: FigureDot[] = []

    for (let n = 0; n < count; n++) {
      // Two samples averaged: a flat random scatter reads as noise, and the
      // mild centre bias this gives reads as a distribution.
      const u = (rand() + rand()) / 2 - 0.5
      const v = rand()
      const x = cx + u * 2 * CLOUD_HALF * profile.spread
      const y = cloudTop + (v * 0.78 + profile.bias * 0.3) * cloudHeight
      dots.push({
        x: Math.round(x * 100) / 100,
        y: Math.round(Math.min(cloudBottom, y) * 100) / 100,
        r: Math.round((2 + rand() * 1.6) * 100) / 100,
        // Taken from the tail of the sequence rather than by position, so the
        // carried points are scattered through the cloud instead of forming a
        // block at one edge of it.
        shared: rand() < profile.shared,
      })
    }

    const target = STEM_TARGETS[i]
    const midY = (stemTop + target.y) / 2
    return {
      id: profile.id,
      label: `State / ${profile.id}`,
      cx,
      dots,
      // Cubic rather than a straight line: three converging straights meeting
      // at a point is a funnel diagram, which is what §27 warns the figure not
      // to become.
      stem: `M ${cx} ${stemTop} C ${cx} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`,
    }
  })

  return { states, nodes: CLUSTER_NODES, edges: CLUSTER_EDGES }
}

/**
 * The figure's textual equivalent (§52).
 *
 * Read by assistive technology in place of the drawing, so it has to carry the
 * same argument the picture makes rather than describe its appearance.
 */
export const FIGURE_DESCRIPTION =
  'Diagram: signal measurements from three biological states — A, B and C — each shown as a cloud of points. A subset of points from every state, highlighted in green, converges below into a single shared cluster of six connected relationships, with one central relationship supported by all three states.'
