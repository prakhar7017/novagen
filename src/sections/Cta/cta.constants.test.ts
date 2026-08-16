// @vitest-environment jsdom
// The constants module reaches for `window` through progressRef's dev-only
// debug handle, so this suite needs a DOM even though nothing it tests uses one.
import { describe, expect, it } from 'vitest'
import {
  CELL_POINTS,
  CELL_POSITION,
  CELL_RADIUS,
  CTA_ENTRANCE,
  CTA_HEADLINE,
  CTA_HEADLINE_COMPACT,
  CTA_MILESTONE,
  CTA_PRIMARY,
  CTA_SECONDARY,
  CTA_VH,
  buildCellPoints,
  cellDiameterPx,
  cellPointAt,
  ctaForm,
  ctaInterior,
  ctaSpan,
} from './cta.constants'
import { SECTION_IDS } from '@/lib/sections'

describe('closing formation', () => {
  it('starts at nothing and ends fully formed', () => {
    expect(ctaForm(0)).toBe(0)
    expect(ctaForm(1)).toBeCloseTo(1, 5)
    expect(ctaInterior(0)).toBe(0)
    expect(ctaInterior(1)).toBeCloseTo(1, 5)
    expect(ctaSpan(0)).toBe(0)
    expect(ctaSpan(1)).toBeCloseTo(1, 5)
  })

  it('never runs backwards, so a reversed scrub is exact rather than eased', () => {
    let form = -1
    let interior = -1
    let span = -1
    for (let p = 0; p <= 1.0001; p += 0.005) {
      expect(ctaForm(p)).toBeGreaterThanOrEqual(form)
      expect(ctaInterior(p)).toBeGreaterThanOrEqual(interior)
      expect(ctaSpan(p)).toBeGreaterThanOrEqual(span)
      form = ctaForm(p)
      interior = ctaInterior(p)
      span = ctaSpan(p)
    }
  })

  it('resolves the membrane before the detail inside it (§7)', () => {
    // The point becomes a boundary, and only then acquires an interior. The
    // reverse order draws filaments in open space.
    expect(CTA_MILESTONE.membraneIn).toBeLessThan(CTA_MILESTONE.interiorIn)
    expect(CTA_MILESTONE.membraneOn).toBeLessThan(CTA_MILESTONE.interiorOn)
    expect(ctaForm(0.5)).toBeGreaterThan(ctaInterior(0.5))
  })
})

describe('the cell', () => {
  it('keeps every interior point inside the membrane (§22)', () => {
    const points = buildCellPoints()
    expect(points).toHaveLength(CELL_POINTS)
    // §20 caps the interior at 50 points; anything denser stops reading as
    // "one preserved biological possibility" and starts reading as a scene.
    expect(CELL_POINTS).toBeGreaterThanOrEqual(20)
    expect(CELL_POINTS).toBeLessThanOrEqual(50)

    for (const p of points) {
      for (let t = 0; t < 600; t += 7) {
        const { x, y } = cellPointAt(p, t)
        expect(Math.hypot(x, y)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is deterministic — the closing frame must not differ between loads', () => {
    expect(buildCellPoints()).toEqual(buildCellPoints())
  })

  it('drifts slowly enough that no orbit reads as a loop (§23)', () => {
    for (const p of buildCellPoints()) {
      // Under one full turn per three minutes.
      expect(Math.abs(p.speed)).toBeLessThan(0.04)
      expect(Math.abs(p.speed)).toBeGreaterThan(0)
    }
  })

  it('holds §21 and §40 diameters at every required viewport', () => {
    expect(cellDiameterPx(1920)).toBeLessThanOrEqual(480)
    expect(cellDiameterPx(1600)).toBeLessThanOrEqual(480)
    expect(cellDiameterPx(1440)).toBeGreaterThanOrEqual(280)
    expect(cellDiameterPx(1440)).toBeLessThanOrEqual(420)
    expect(cellDiameterPx(1280)).toBeGreaterThanOrEqual(280)
    expect(cellDiameterPx(1280)).toBeLessThanOrEqual(340)
    expect(cellDiameterPx(1024)).toBeGreaterThanOrEqual(260)
    expect(cellDiameterPx(1024)).toBeLessThanOrEqual(320)

    // Monotonic: a narrower window must never receive a larger cell.
    let last = 0
    for (const w of [768, 1024, 1101, 1367, 1600, 1920]) {
      expect(cellDiameterPx(w)).toBeGreaterThanOrEqual(last)
      last = cellDiameterPx(w)
    }
  })

  it('rests in §21 territory and inherits Impact position', () => {
    expect(CELL_POSITION.to.x).toBeGreaterThanOrEqual(0.7)
    expect(CELL_POSITION.to.x).toBeLessThanOrEqual(0.77)
    expect(CELL_POSITION.to.y).toBeGreaterThanOrEqual(0.42)
    expect(CELL_POSITION.to.y).toBeLessThanOrEqual(0.5)
    // Impact's scene sits at 17% of the frame width right of centre and 3%
    // above it; the handoff is only continuous if this agrees with that.
    expect(CELL_POSITION.from.x).toBeCloseTo(0.5 + 0.17, 5)
    expect(CELL_POSITION.from.y).toBeCloseTo(0.5 - 0.03, 5)
    expect(CELL_RADIUS).toBeGreaterThan(0)
    expect(CELL_RADIUS).toBeLessThan(1)
  })
})

describe('closing copy', () => {
  it('states §13 as two authored lines and §46 as three', () => {
    expect(CTA_HEADLINE.join(' ')).toBe('From biological complexity to human possibility.')
    expect(CTA_HEADLINE_COMPACT.join(' ')).toBe(CTA_HEADLINE.join(' '))
    // §46 — no one-word orphan lines.
    for (const line of [...CTA_HEADLINE, ...CTA_HEADLINE_COMPACT]) {
      expect(line.trim().split(/\s+/).length).toBeGreaterThan(1)
    }
  })

  it('points both actions at sections that actually exist (§54)', () => {
    for (const action of [CTA_PRIMARY, CTA_SECONDARY]) {
      expect(SECTION_IDS).toContain(action.target)
      expect(action.target).not.toBe('')
    }
    expect(CTA_PRIMARY.target).not.toBe(CTA_SECONDARY.target)
  })

  it('lets the visual settle before the words arrive (§26)', () => {
    const order = [
      CTA_ENTRANCE.label,
      CTA_ENTRANCE.headline,
      CTA_ENTRANCE.lead,
      CTA_ENTRANCE.actions,
      CTA_ENTRANCE.brand,
    ]
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThanOrEqual(order[i - 1])
    }
    expect(CTA_ENTRANCE.label).toBeGreaterThan(0.4)
  })

  it('keeps the closing section inside §9 (no second pinned sequence)', () => {
    expect(CTA_VH).toBeGreaterThanOrEqual(100)
    expect(CTA_VH).toBeLessThanOrEqual(130)
  })
})
