import { describe, expect, it } from 'vitest'
import {
  DIAGRAM_VIEWBOX,
  buildDiagramSet,
  buildIngressScatter,
  type Diagram,
  type DiagramPoint,
} from './impact.diagram'

const [dense, prioritized, validated] = buildDiagramSet({
  signals: 620,
  nodes: 62,
  maxLines: 90,
})

/** Bounding box of everything a diagram draws. */
function bounds(d: Diagram) {
  const pts: DiagramPoint[] = [...d.signals, ...d.nodes]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    cx: xs.reduce((a, b) => a + b, 0) / xs.length,
    cy: ys.reduce((a, b) => a + b, 0) / ys.length,
  }
}

describe('buildDiagramSet', () => {
  it('draws the same three states the scene morphs between, each simpler', () => {
    expect(prioritized.nodes.length).toBeLessThan(dense.nodes.length)
    expect(validated.nodes.length).toBeLessThan(prioritized.nodes.length)
    expect(validated.nodes.length).toBeGreaterThan(2)
    expect(prioritized.edges.length).toBeLessThan(dense.edges.length)
    expect(validated.edges.length).toBeLessThan(prioritized.edges.length)
    expect(validated.edges.length).toBeGreaterThan(0)
  })

  // The projection zooms as the field reduces. Too little and the last state is
  // a speck in an empty box; too much and it is cropped by the viewBox — and an
  // SVG has no overflow to fall back on here.
  it('keeps every state inside its viewBox', () => {
    for (const d of [dense, prioritized, validated]) {
      const b = bounds(d)
      expect(b.minX).toBeGreaterThanOrEqual(0)
      expect(b.minY).toBeGreaterThanOrEqual(0)
      expect(b.maxX).toBeLessThanOrEqual(DIAGRAM_VIEWBOX.width)
      expect(b.maxY).toBeLessThanOrEqual(DIAGRAM_VIEWBOX.height)
    }
  })

  it('gives each state enough of the frame to be readable', () => {
    for (const d of [dense, prioritized, validated]) {
      const b = bounds(d)
      expect(b.maxX - b.minX).toBeGreaterThan(DIAGRAM_VIEWBOX.width * 0.3)
      expect(b.maxY - b.minY).toBeGreaterThan(DIAGRAM_VIEWBOX.height * 0.3)
    }
  })

  // The arc that frames this state is centred on its own box in CSS, so a
  // target drawn off to one side would sit outside the ring it belongs to.
  it('centres the validated target, which the confidence arc is drawn around', () => {
    const b = bounds(validated)
    expect(Math.abs(b.cx - DIAGRAM_VIEWBOX.width / 2)).toBeLessThan(
      DIAGRAM_VIEWBOX.width * 0.12,
    )
    expect(Math.abs(b.cy - DIAGRAM_VIEWBOX.height / 2)).toBeLessThan(
      DIAGRAM_VIEWBOX.height * 0.12,
    )
  })
})

describe('buildIngressScatter', () => {
  it('returns the requested number of marks, all inside the percentage box', () => {
    const scatter = buildIngressScatter(150)
    expect(scatter).toHaveLength(150)
    for (const p of scatter) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(100)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(100)
    }
  })
})
