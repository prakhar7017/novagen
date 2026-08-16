/**
 * Flat projections of the impact field.
 *
 * The mobile and reduced-motion presentations have to show the *same* three
 * arrangements the WebGL scene morphs between (§41, §49) — not a second
 * designer's impression of them. Both draw from `buildImpactTargets` and this
 * file's projection, so if the geometry changes the static diagrams change with
 * it and the two presentations cannot describe different science.
 *
 * Pure math, no three.js and no React: cheap enough to run three times on a
 * phone, and testable.
 */
import {
  FRAME,
  buildImpactTargets,
  sampleArrangement,
  type ImpactDensity,
  type ImpactTargets,
} from '@/scene/Impact/impactTargets'

export interface DiagramPoint {
  x: number
  y: number
  r: number
  /** 0–1 — drives opacity and the mint → green ramp in CSS */
  strength: number
  /** True for points belonging to the validated candidate */
  winner: boolean
}

export interface DiagramEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  strength: number
}

export interface Diagram {
  width: number
  height: number
  signals: DiagramPoint[]
  nodes: DiagramPoint[]
  edges: DiagramEdge[]
}

export interface DiagramSize {
  width: number
  height: number
}

export const DIAGRAM_VIEWBOX: DiagramSize = { width: 640, height: 400 }

/**
 * World → viewBox. Orthographic, and y flips: SVG counts downward.
 *
 * `zoom` and the focus point are the static stand-in for what the WebGL scene
 * does with its compression: each successive arrangement occupies less of the
 * frame, and drawn at a fixed scale the validated target would be a speck in an
 * empty box — the opposite of the reading §3 asks for, where the last state is
 * the clearest one.
 */
function projector(
  width: number,
  height: number,
  zoom = 1,
  focusX = 0,
  focusY = 0,
) {
  const sx = ((width * 0.46) / FRAME.x) * zoom
  const sy = ((height * 0.44) / FRAME.y) * zoom
  return (v: Float32Array, i: number) => ({
    // Depth as a gentle scale about the centre, so the layered planes survive
    // the projection instead of flattening into one sheet.
    x: width / 2 + (v[i * 3] - focusX) * sx * (1 + v[i * 3 + 2] * 0.06),
    y: height / 2 - (v[i * 3 + 1] - focusY) * sy * (1 + v[i * 3 + 2] * 0.06),
  })
}

/** Mean position of the points a state actually draws, in world x/y. */
function focusOf(pos: Float32Array, count: number, keep: (i: number) => boolean) {
  let x = 0
  let y = 0
  let n = 0
  for (let i = 0; i < count; i++) {
    if (!keep(i)) continue
    x += pos[i * 3]
    y += pos[i * 3 + 1]
    n++
  }
  return n ? { x: x / n, y: y / n } : { x: 0, y: 0 }
}

/**
 * One arrangement, drawn flat.
 *
 * `morph` is the same 0→2 index the vertex shader mixes with: 0 dense field,
 * 1 prioritized candidates, 2 validated target. Points whose visibility the
 * shader would have taken to nothing are dropped here rather than rendered at
 * zero opacity — the whole point of the static states is that the third diagram
 * has visibly less in it than the first.
 */
export function buildDiagram(
  targets: ImpactTargets,
  morph: number,
  size: DiagramSize = DIAGRAM_VIEWBOX,
): Diagram {
  const { width, height } = size

  const filter = Math.min(1, morph)
  const validate = Math.max(0, morph - 1)

  const signalPos = sampleArrangement(
    targets.signals,
    morph,
    new Float32Array(targets.signals.count * 3),
  )
  const nodePos = sampleArrangement(
    targets.nodes,
    morph,
    new Float32Array(targets.nodes.count * 3),
  )

  // Framed on what survives, at a scale that keeps each state filling roughly
  // the same box. Both halves matter: what a state keeps is rarely centred on
  // the origin — the candidate regions sit wherever the sampler put them — so
  // zooming without recentring would only push the subject further off frame.
  const zoom = 1 + filter * 0.7 + validate * 1.25
  const keep =
    validate > 0.5
      ? (i: number) => targets.nodes.winner[i] > 0.5
      : filter > 0.5
        ? (i: number) => targets.nodes.strength[i] >= 0.46
        : null
  const focus = keep ? focusOf(nodePos, targets.nodes.count, keep) : { x: 0, y: 0 }
  const project = projector(width, height, zoom, focus.x, focus.y)

  const signals: DiagramPoint[] = []
  for (let i = 0; i < targets.signals.count; i++) {
    const s = targets.signals.strength[i]
    const w = targets.signals.winner[i] > 0.5
    // The same thresholds the shader uses, applied as inclusion rather than as
    // alpha: below 40% of the filter a signal has stopped being drawn at all.
    if (filter > 0.5 && s < 0.42) continue
    if (validate > 0.5 && !w) continue
    const { x, y } = project(signalPos, i)
    signals.push({ x, y, r: 0.7 + targets.signals.size[i] * 0.5, strength: s, winner: w })
  }

  const kept = new Set<number>()
  const nodes: DiagramPoint[] = []
  for (let i = 0; i < targets.nodes.count; i++) {
    const s = targets.nodes.strength[i]
    const w = targets.nodes.winner[i] > 0.5
    if (filter > 0.5 && s < 0.46) continue
    if (validate > 0.5 && !w) continue
    kept.add(i)
    const { x, y } = project(nodePos, i)
    nodes.push({ x, y, r: 1.1 + targets.nodes.size[i] * 0.9, strength: s, winner: w })
  }

  // Connections follow their endpoints: bridges are gone once filtering has
  // happened, and only the evidence paths survive validation (§20, §24).
  const index = validate > 0.5 ? targets.evidenceIndices : targets.lineIndices
  const edges: DiagramEdge[] = []
  for (let k = 0; k < index.length; k += 2) {
    const a = index[k]
    const b = index[k + 1]
    if (!kept.has(a) || !kept.has(b)) continue
    const pa = project(nodePos, a)
    const pb = project(nodePos, b)
    edges.push({
      x1: pa.x,
      y1: pa.y,
      x2: pb.x,
      y2: pb.y,
      strength: Math.min(targets.nodes.strength[a], targets.nodes.strength[b]),
    })
  }

  if (filter <= 0.5) {
    for (let k = 0; k < targets.bridgeIndices.length; k += 2) {
      const a = targets.bridgeIndices[k]
      const b = targets.bridgeIndices[k + 1]
      if (!kept.has(a) || !kept.has(b)) continue
      const pa = project(nodePos, a)
      const pb = project(nodePos, b)
      edges.push({
        x1: pa.x,
        y1: pa.y,
        x2: pb.x,
        y2: pb.y,
        strength: Math.min(targets.nodes.strength[a], targets.nodes.strength[b]) * 0.7,
      })
    }
  }

  return { width, height, signals, nodes, edges }
}

/** The three static states, built once per density. */
export function buildDiagramSet(density: ImpactDensity): Diagram[] {
  const targets = buildImpactTargets(density)
  return [0, 1, 2].map((m) => buildDiagram(targets, m))
}

/**
 * The scatter used by the Research → Impact handoff (§7).
 *
 * The *same* dense arrangement the section opens on, projected flat and thinned
 * to the points that read at a glance — so the marks that settle onto the Bone
 * are literally the field the network is about to become, rather than decorative
 * confetti that happens to precede it.
 */
export function buildIngressScatter(count = 150): DiagramPoint[] {
  const targets = buildImpactTargets({ signals: count * 4, nodes: 0, maxLines: 0 })
  const { signals } = buildDiagram(targets, 0, { width: 100, height: 100 })
  // Evenly sampled rather than sliced: taking the first N would take whichever
  // regions the generator happened to fill first.
  const step = Math.max(1, Math.floor(signals.length / count))
  const out: DiagramPoint[] = []
  for (let i = 0; i < signals.length && out.length < count; i += step) out.push(signals[i])
  return out
}
