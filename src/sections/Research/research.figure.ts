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

export const FIGURE_ROWS = {
  stateLabel: 42,
  cloudTop: 70,
  cloudBottom: 208,
  stemTop: 226,
  divider: 286,
  clusterTop: 320,
  clusterBottom: 448,
} as const

export const STATE_CENTERS = [146, 380, 614] as const

export const CLOUD_BOUNDS = { half: 96 } as const
const CLOUD_HALF = CLOUD_BOUNDS.half

export interface FigureDot {
  x: number
  y: number
  r: number
  shared: boolean
}

export interface FigureState {
  id: string
  label: string
  cx: number
  dots: FigureDot[]
  stem: string
}

export interface ClusterNode {
  x: number
  y: number
  r: number
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

const PROFILES = [
  { id: 'A', spread: 1, bias: 0.46, shared: 0.22 },
  { id: 'B', spread: 0.82, bias: 0.58, shared: 0.3 },
  { id: 'C', spread: 0.6, bias: 0.66, shared: 0.42 },
] as const

const STEM_TARGETS = [
  { x: 288, y: FIGURE_ROWS.clusterTop + 8 },
  { x: 380, y: FIGURE_ROWS.clusterTop - 4 },
  { x: 472, y: FIGURE_ROWS.clusterTop + 8 },
] as const

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
      const u = (rand() + rand()) / 2 - 0.5
      const v = rand()
      const x = cx + u * 2 * CLOUD_HALF * profile.spread
      const y = cloudTop + (v * 0.78 + profile.bias * 0.3) * cloudHeight
      dots.push({
        x: Math.round(x * 100) / 100,
        y: Math.round(Math.min(cloudBottom, y) * 100) / 100,
        r: Math.round((2 + rand() * 1.6) * 100) / 100,
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
      stem: `M ${cx} ${stemTop} C ${cx} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`,
    }
  })

  return { states, nodes: CLUSTER_NODES, edges: CLUSTER_EDGES }
}

export const FIGURE_DESCRIPTION =
  'Diagram: signal measurements from three biological states — A, B and C — each shown as a cloud of points. A subset of points from every state, highlighted in green, converges below into a single shared cluster of six connected relationships, with one central relationship supported by all three states.'
