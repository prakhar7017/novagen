import { describe, it, expect } from 'vitest'
import {
  SEED_DIAMETER,
  coverScale,
  coversViewport,
  discRadiusX,
  seedScale,
} from './aperture.geometry'

const VIEWPORTS: [number, number][] = [
  [1920, 1080],
  [1600, 1000],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 800],
  [320, 1180],
  [2560, 700],
]

const ORIGINS = [0.5, 0.63]

describe('coverScale', () => {
  it('covers every corner at every specified viewport', () => {
    for (const [vw, vh] of VIEWPORTS) {
      for (const ox of ORIGINS) {
        const s = coverScale(vw, vh, ox)
        expect(
          coversViewport(vw, vh, ox, s),
          `${vw}x${vh} @ originX ${ox} (scale ${s.toFixed(3)})`,
        ).toBe(true)
      }
    }
  })

  it('leaves no coverage at a scale below the computed one', () => {
    for (const [vw, vh] of VIEWPORTS) {
      const s = coverScale(vw, vh, 0.63)
      expect(coversViewport(vw, vh, 0.63, s * 0.9)).toBe(false)
    }
  })

  it('needs a larger disc the further the origin sits from centre', () => {
    expect(coverScale(1440, 900, 0.63)).toBeGreaterThan(coverScale(1440, 900, 0.5))
    expect(coverScale(1440, 900, 0.8)).toBeGreaterThan(coverScale(1440, 900, 0.63))
  })
})

describe('seedScale', () => {
  it('opens at the specified diameter regardless of viewport', () => {
    for (const [vw, vh] of VIEWPORTS) {
      const px = seedScale(vw, vh) * discRadiusX(vw, vh) * 2
      expect(px).toBeCloseTo(SEED_DIAMETER, 6)
    }
  })

  it('starts far smaller than it finishes', () => {
    for (const [vw, vh] of VIEWPORTS) {
      expect(seedScale(vw, vh)).toBeLessThan(coverScale(vw, vh, 0.63) * 0.5)
    }
  })
})
