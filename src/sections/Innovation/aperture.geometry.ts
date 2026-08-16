const DISC_W = 1.04
const DISC_H = 0.94

const DISC_SOLID_STOP = 0.86

export const DISC_RX = (DISC_W / 2) * DISC_SOLID_STOP
export const DISC_RY = (DISC_H / 2) * DISC_SOLID_STOP

export const SEED_DIAMETER = 128

export function discRadiusX(vw: number, vh: number): number {
  return Math.max(vw, vh) * DISC_RX
}

export function seedScale(vw: number, vh: number): number {
  return SEED_DIAMETER / 2 / discRadiusX(vw, vh)
}

export function coverScale(vw: number, vh: number, originX: number): number {
  const vmax = Math.max(vw, vh)
  const dx = Math.max(originX, 1 - originX) * vw
  const dy = 0.5 * vh
  return Math.hypot(dx / (DISC_RX * vmax), dy / (DISC_RY * vmax)) * 1.06
}

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
