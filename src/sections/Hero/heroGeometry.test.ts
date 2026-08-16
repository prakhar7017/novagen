import { describe, it, expect } from 'vitest'
import { heroOrganismRect, HERO_ORGANISM } from './heroGeometry'

describe('heroOrganismRect', () => {
  it('clamps width to the desktop band', () => {
    expect(heroOrganismRect(800, 900).width).toBe(400)
    expect(heroOrganismRect(1440, 900).width).toBeCloseTo(1440 * 0.46)
    expect(heroOrganismRect(2400, 900).width).toBe(700)
  })

  it('clamps width to the mobile band', () => {
    expect(heroOrganismRect(360, 800).width).toBe(300)
    expect(heroOrganismRect(500, 800).width).toBe(380)
  })

  it('switches layout at the 768px breakpoint', () => {
    const mobile = heroOrganismRect(768, 1024)
    const desktop = heroOrganismRect(769, 1024)
    expect(desktop.centerY).toBeCloseTo(512)
    expect(mobile.centerY).toBeLessThan(512)
  })

  it('bleeds off the right edge in both layouts', () => {
    for (const [w, h] of [
      [1440, 900],
      [1280, 800],
      [390, 844],
    ] as const) {
      const r = heroOrganismRect(w, h)
      const rightEdge = r.centerX + r.width / 2
      expect(rightEdge).toBeGreaterThan(w)
    }
  })

  it('never places the organism entirely off screen', () => {
    for (let w = 320; w <= 2560; w += 37) {
      const r = heroOrganismRect(w, 900)
      expect(r.centerX - r.width / 2).toBeLessThan(w)
      expect(r.width).toBeGreaterThan(0)
    }
  })
})

describe('HERO_ORGANISM handoff constants', () => {
  it('grows slightly and drifts toward the copy across the Hero exit', () => {
    expect(HERO_ORGANISM.exitScale).toBeGreaterThan(1)
    expect(HERO_ORGANISM.exitScale).toBeLessThan(1.3)
    expect(HERO_ORGANISM.exitX).toBeLessThan(0)
  })

  it('exposes the same rect function both renderers use', () => {
    expect(HERO_ORGANISM.rect).toBe(heroOrganismRect)
  })
})
