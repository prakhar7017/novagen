import { describe, expect, it } from 'vitest'
import {
  CLOUD_BOUNDS,
  FIGURE_ROWS,
  FIGURE_VIEWBOX,
  STATE_CENTERS,
  buildResearchFigure,
} from './research.figure'

const COUNTS = [26, 22, 18] as const

describe('buildResearchFigure', () => {
  it('is deterministic for a given seed', () => {
    expect(buildResearchFigure(COUNTS)).toEqual(buildResearchFigure(COUNTS))
  })

  it('draws the requested number of dots per state', () => {
    const figure = buildResearchFigure(COUNTS)
    expect(figure.states.map((s) => s.dots.length)).toEqual([26, 22, 18])
  })

  it('keeps every dot inside the frame and its own column', () => {
    for (const counts of [COUNTS, [12, 10, 8] as const]) {
      const figure = buildResearchFigure(counts)
      figure.states.forEach((state, i) => {
        for (const dot of state.dots) {
          expect(dot.y).toBeGreaterThanOrEqual(FIGURE_ROWS.cloudTop)
          expect(dot.y).toBeLessThanOrEqual(FIGURE_ROWS.cloudBottom)
          expect(dot.x - dot.r).toBeGreaterThan(0)
          expect(dot.x + dot.r).toBeLessThan(FIGURE_VIEWBOX.width)
          expect(Math.abs(dot.x - STATE_CENTERS[i])).toBeLessThanOrEqual(CLOUD_BOUNDS.half)
        }
      })
    }
  })

  it('carries shared signal out of every state', () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8]
    const totals = [0, 0, 0]
    for (const seed of seeds) {
      buildResearchFigure(COUNTS, seed).states.forEach((state, i) => {
        totals[i] += state.dots.filter((d) => d.shared).length
      })
    }
    for (const total of totals) expect(total).toBeGreaterThan(0)
    expect(totals[2] / COUNTS[2]).toBeGreaterThan(totals[0] / COUNTS[0])
  })

  it('never lets a state consist only of shared points', () => {
    const figure = buildResearchFigure(COUNTS)
    for (const state of figure.states) {
      expect(state.dots.some((d) => !d.shared)).toBe(true)
    }
  })

  it('gives every state a stem into the cluster', () => {
    const figure = buildResearchFigure(COUNTS)
    expect(figure.states).toHaveLength(3)
    for (const state of figure.states) {
      expect(state.stem.startsWith('M ')).toBe(true)
      expect(state.stem).toContain('C ')
    }
  })

  it('resolves every cluster edge to a real node', () => {
    const { nodes, edges } = buildResearchFigure(COUNTS)
    expect(nodes.length).toBeGreaterThan(3)
    for (const edge of edges) {
      expect(nodes[edge.a]).toBeDefined()
      expect(nodes[edge.b]).toBeDefined()
      expect(edge.a).not.toBe(edge.b)
    }
  })

  it('keeps the cluster inside its band', () => {
    const { nodes } = buildResearchFigure(COUNTS)
    expect(nodes.filter((n) => n.primary)).toHaveLength(1)
    for (const node of nodes) {
      expect(node.y - node.r).toBeGreaterThanOrEqual(FIGURE_ROWS.clusterTop - node.r)
      expect(node.y + node.r).toBeLessThanOrEqual(FIGURE_ROWS.clusterBottom)
      expect(node.x).toBeGreaterThan(0)
      expect(node.x).toBeLessThan(FIGURE_VIEWBOX.width)
    }
  })
})
