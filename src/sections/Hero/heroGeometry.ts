/**
 * Single source of truth for the Hero organism's on-screen box.
 *
 * The organism exists twice: as a DOM <img> during the Hero, and as a textured
 * plane once the Journey takes over. The handoff only reads as continuous if
 * both occupy the identical screen rectangle, so the CSS in HeroVisual and the
 * world-space placement in DissolveStage are both derived from here. Change
 * these numbers in one place only.
 *
 * Desktop and mobile use genuinely different layouts, not one scaled box:
 *   desktop — absolutely positioned, right-anchored, vertically centred
 *   mobile  — in normal flow at the top of the stage, bleeding off the right
 */

const MOBILE_BREAKPOINT = 768

/** Desktop `width: clamp(400px, 46vw, 700px)` */
const DESKTOP_W = { min: 400, vw: 0.46, max: 700 }
/** Mobile `width: clamp(300px, 78vw, 380px)` */
const MOBILE_W = { min: 300, vw: 0.78, max: 380 }

/** Fraction of viewport width the box bleeds past the right edge */
const DESKTOP_BLEED = 0.06
const MOBILE_BLEED = 0.05
/** Mobile `margin-top`, as a fraction of viewport height */
const MOBILE_TOP = -0.06

function clamp(min: number, v: number, max: number) {
  return Math.min(Math.max(min, v), max)
}

export interface OrganismRect {
  /** Side length in CSS px (the box is square) */
  width: number
  /** Centre in CSS px from the left edge of the viewport */
  centerX: number
  /** Centre in CSS px from the top edge of the viewport */
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
  // The right edge sits `bleed` px past the viewport edge in both layouts
  const centerX = viewportWidth + bleed - width / 2

  const centerY = mobile
    ? MOBILE_TOP * viewportHeight + width / 2 // stacked at the top
    : viewportHeight / 2 // vertically centred

  return { width, centerX, centerY }
}

export const HERO_ORGANISM = {
  rect: heroOrganismRect,
  /** Scale the organism reaches at the end of the Hero's pinned exit */
  exitScale: 1.14,
  /** Horizontal drift toward centre across that same exit, in px */
  exitX: -55,
} as const
