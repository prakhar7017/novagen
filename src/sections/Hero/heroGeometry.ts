const MOBILE_BREAKPOINT = 768

const DESKTOP_W = { min: 400, vw: 0.46, max: 700 }
const MOBILE_W = { min: 300, vw: 0.78, max: 380 }

const DESKTOP_BLEED = 0.06
const MOBILE_BLEED = 0.05
const MOBILE_TOP = -0.06

function clamp(min: number, v: number, max: number) {
  return Math.min(Math.max(min, v), max)
}

export interface OrganismRect {
  width: number
  centerX: number
  centerY: number
}

export function heroOrganismRect(
  viewportWidth: number,
  viewportHeight: number,
): OrganismRect {
  const mobile = viewportWidth <= MOBILE_BREAKPOINT

  const width = mobile
    ? clamp(MOBILE_W.min, viewportWidth * MOBILE_W.vw, MOBILE_W.max)
    : clamp(DESKTOP_W.min, viewportWidth * DESKTOP_W.vw, DESKTOP_W.max)

  const bleed = (mobile ? MOBILE_BLEED : DESKTOP_BLEED) * viewportWidth
  const centerX = viewportWidth + bleed - width / 2

  const centerY = mobile
    ? MOBILE_TOP * viewportHeight + width / 2
    : viewportHeight / 2

  return { width, centerX, centerY }
}

export const HERO_ORGANISM = {
  rect: heroOrganismRect,
  exitScale: 1.14,
  exitX: -55,
} as const
