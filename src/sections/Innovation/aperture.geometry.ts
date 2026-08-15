/**
 * Geometry of the Journey → Innovation aperture.
 *
 * Kept separate from the timeline, and pure, because getting it wrong is not
 * obvious from reading the code: an under-sized disc still animates perfectly
 * and simply leaves a wedge of the dark Journey stage on screen at the moment
 * the two sections meet.
 *
 * These constants mirror `.innovation-aperture-disc` in innovation.css and have
 * to move with it. The disc is sized in vmax and its gradient uses
 * `ellipse closest-side`, so 100% of the gradient ray is exactly half the
 * element box on each axis — which is what makes a stop percentage convert to a
 * pixel radius at all. With the browser default (`farthest-corner`) the ray
 * would be the half-diagonal instead, and every radius here would be a factor
 * of √2 too large.
 */

/** Element size as a fraction of one vmax. */
const DISC_W = 1.04
const DISC_H = 0.94

/** First gradient stop: the point at which the Bone fill stops being solid. */
const DISC_SOLID_STOP = 0.86

/** Solid-fill radii at scale 1, as a fraction of one vmax. */
export const DISC_RX = (DISC_W / 2) * DISC_SOLID_STOP
export const DISC_RY = (DISC_H / 2) * DISC_SOLID_STOP

/** Width, in px, of the aperture at the moment it first becomes visible. */
export const SEED_DIAMETER = 128

/** Solid-fill horizontal radius, in px, of the disc at scale 1. */
export function discRadiusX(vw: number, vh: number): number {
  return Math.max(vw, vh) * DISC_RX
}

/** Element scale at which the aperture is `SEED_DIAMETER` px across. */
export function seedScale(vw: number, vh: number): number {
  return SEED_DIAMETER / 2 / discRadiusX(vw, vh)
}

/**
 * Element scale at which the disc's solid fill clears every corner of the
 * viewport from its own off-centre origin.
 *
 * A point is inside the ellipse when (dx/rx)² + (dy/ry)² ≤ 1, so the scale the
 * farthest corner needs is that magnitude. The margin on top keeps the soft
 * edge off screen too, rather than parking it exactly on the corner.
 *
 * @param originX horizontal origin as a fraction of the viewport width
 */
export function coverScale(vw: number, vh: number, originX: number): number {
  const vmax = Math.max(vw, vh)
  const dx = Math.max(originX, 1 - originX) * vw
  const dy = 0.5 * vh
  return Math.hypot(dx / (DISC_RX * vmax), dy / (DISC_RY * vmax)) * 1.06
}

/**
 * Does a disc at `scale` cover every corner of the viewport?
 * Exposed for the test that guards the property the whole handoff rests on.
 */
export function coversViewport(
  vw: number,
  vh: number,
  originX: number,
  scale: number,
): boolean {
  const vmax = Math.max(vw, vh)
  const rx = DISC_RX * vmax * scale
  const ry = DISC_RY * vmax * scale

  const corners: [number, number][] = [
    [-originX * vw, -0.5 * vh],
    [(1 - originX) * vw, -0.5 * vh],
    [-originX * vw, 0.5 * vh],
    [(1 - originX) * vw, 0.5 * vh],
  ]

  return corners.every(([dx, dy]) => (dx / rx) ** 2 + (dy / ry) ** 2 <= 1)
}
