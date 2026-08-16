/**
 * Section 08 — Final CTA / Closing Vision.
 *
 * The end of the narrative. Seven sections turned a living organism into
 * signals, candidates and evidence; this one turns the surviving evidence back
 * into biology and stops. §3 is the whole brief in one line — *the page should
 * end simpler than it began* — so almost everything this file exports is a
 * limit rather than a feature: one headline, one action, one small cell, one
 * metadata pair, and no scientific HUD at all (§28).
 *
 * Like every other section here the visual and the copy run on one normalized
 * progress, so the WebGL cell and the drawn one are the same arrangement rather
 * than two interpretations of a description — and so the whole thing is
 * testable without a GPU.
 */
import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export const CTA_INDEX = '08'
export const CTA_LABEL = 'Possibility'

/**
 * §28 — at most one small metadata line survives into the closing frame. The
 * absence of the rest is the point: SIGNAL_048, LOCUS and CONFIDENCE all belong
 * to the part of the story that has finished.
 */
export const CTA_META = { key: 'System', value: 'Resolved' } as const

/**
 * Two authored lines (§13).
 *
 * Authored rather than wrapped, for the same reason Impact's are: at 1440 a
 * browser wrap strands "possibility." on a line of its own, which §14 rules out
 * explicitly.
 */
export const CTA_HEADLINE = ['From biological complexity', 'to human possibility.'] as const

/**
 * The compact break (§46).
 *
 * "From biological complexity" is roughly 12.5em of Space Grotesk Bold, so at
 * any type size that still reads as a headline it cannot fit a 390px screen —
 * the two-line set is a desktop set. Three lines keep the longest measure down
 * to "human possibility.", and none of them is a one-word orphan.
 */
export const CTA_HEADLINE_COMPACT = [
  'From biological',
  'complexity to',
  'human possibility.',
] as const

/**
 * §16 offers two supporting lines and warns against using both. One is enough:
 * the second says what the closing visual is already saying.
 */
export const CTA_LEAD =
  'We build tools that help researchers move from living systems to meaningful discovery.'

/**
 * §54 — real targets, both of them. The primary returns to the platform, which
 * is what "the science" means on this page; the secondary goes to the evidence.
 * Neither is `href="#"`, and neither is a button that does nothing.
 */
export const CTA_PRIMARY = { label: 'Explore the science', target: 'technology' } as const
export const CTA_SECONDARY = { label: 'View selected research', target: 'research' } as const

export const CTA_BRAND = { name: 'NOVA/GEN', line: 'Biology, made programmable.' } as const

// ── Formation (§7) ──────────────────────────────────────────────────────────

/**
 * Milestones inside the 0–1 formation window, which runs across the 100vh in
 * which Impact's stage scrolls away.
 *
 * §7's sequence is: connections retract, nodes converge, a luminous core forms,
 * a membrane appears, one quiet cell remains. The first two of those have
 * already happened — Impact's own exit collapse did them — so this window
 * starts from the single point that collapse left and has only to make it
 * biological again.
 */
export const CTA_MILESTONE = {
  /** the inherited point steadies and the environment takes over */
  settleIn: 0.0,
  settleOn: 0.22,
  /** the membrane resolves around it */
  membraneIn: 0.18,
  membraneOn: 0.68,
  /** interior filaments and the orbiting signal points arrive last */
  interiorIn: 0.42,
  interiorOn: 0.9,
} as const

/** 0–1 formation of the membrane. */
export function ctaForm(p: number): number {
  return smoothstep(CTA_MILESTONE.membraneIn, CTA_MILESTONE.membraneOn, p)
}

/** 0–1 arrival of the interior detail, deliberately behind the membrane. */
export function ctaInterior(p: number): number {
  return smoothstep(CTA_MILESTONE.interiorIn, CTA_MILESTONE.interiorOn, p)
}

/**
 * How far the inherited point has grown into a drawing, 0–1.
 *
 * At 0 the fragment shader is byte-for-byte Impact's seed at its collapsed
 * size; at 1 it fills the cell's own frame. Kept separate from `ctaForm` so the
 * point steadies *before* a membrane starts appearing around it.
 */
export function ctaSpan(p: number): number {
  return smoothstep(CTA_MILESTONE.settleIn, CTA_MILESTONE.membraneOn, p)
}

/**
 * Whether the closing cell has anything to draw.
 *
 * Deliberately the exact complement of `impactVisible`, which gates on
 * `impact < 0.999`. Gating this on `ctaForm > 0` instead looks equivalent and
 * is not: both windows are open-ended at that boundary, so on the single frame
 * where `impact` clamps to 1 and `ctaForm` has not yet left 0, *neither* object
 * is drawn and the closing point blinks out and back. Complementary bounds mean
 * exactly one of the two is on screen at every frame, in both scroll directions.
 */
export function ctaVisible(): boolean {
  return scrollProgress.impact >= 0.999
}

// ── The cell (§21, §22) ─────────────────────────────────────────────────────

/**
 * Membrane radius as a fraction of the drawing's own half-extent.
 *
 * Exported because three separate things have to agree on it — the fragment
 * shader that draws the boundary, the orbit radii of the interior points, and
 * the scale the scene solves for to hit a perceived diameter in CSS pixels.
 */
export const CELL_RADIUS = 0.62

/**
 * Perceived membrane diameter in CSS pixels, per breakpoint (§21, §40–§45).
 *
 * A target rather than a scale factor: the cell is drawn by a perspective
 * camera whose world units mean nothing to the layout around it, so the scene
 * solves for the scale that produces this width on screen. That is also what
 * keeps §40's ceiling honest — the visual stops growing at 1600px wide instead
 * of tracking the viewport forever.
 */
export function cellDiameterPx(width: number): number {
  if (width >= 1600) return 420
  if (width >= 1367) return 340
  if (width >= 1101) return 300
  if (width >= 1025) return 285
  return 275
}

/**
 * Cell centre, as a fraction of the viewport.
 *
 * `from` is where Impact leaves its collapsed target — that scene is offset to
 * 17% of the frame width right of centre and lifted 3% — and `to` is §21's
 * resting position. The move is a few dozen pixels: the target settling out of
 * the headline's way, not a new object arriving somewhere else.
 */
export const CELL_POSITION = {
  from: { x: 0.67, y: 0.47 },
  // Deliberately at the far end of §21's band and a little low. The headline's
  // first line is ~12.3em wide and reaches past 80% of the frame at every
  // desktop size, so §21's position and §14's measure make some overlap
  // unavoidable — §11 anticipates that and asks for the visual "behind content
  // at very low visual density". What this position buys is that the *core*,
  // the one bright thing in the drawing, clears the type entirely and only the
  // faint upper arc of the membrane passes behind it.
  to: { x: 0.77, y: 0.44 },
} as const

/** §20 — 20–50 tiny signal points, and no more. */
export const CELL_POINTS = 34

export interface CellPoint {
  /** 0–1 of the membrane radius */
  radius: number
  /** starting angle, radians */
  phase: number
  /** radians per second — §23 asks for very slow */
  speed: number
  /** 0–1 flattening of the orbit, so the points read as a volume */
  tilt: number
  /** relative point size */
  size: number
}

/** Deterministic PRNG, matching every other generated arrangement on the page. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The interior population.
 *
 * Both presentations build it from here — the WebGL cell uploads it as
 * attributes, the drawn cell projects it into SVG coordinates — so a phone and
 * a desktop show the same cell rather than two drawings of one description.
 *
 * Radii are biased outward (`sqrt`) because a uniform radius distribution piles
 * points at the centre, where the core already is, and leaves the membrane
 * looking empty.
 */
export function buildCellPoints(count = CELL_POINTS, seed = 0x08c7a): CellPoint[] {
  const rnd = mulberry32(seed)
  const points: CellPoint[] = []
  for (let i = 0; i < count; i++) {
    points.push({
      radius: 0.16 + Math.sqrt(rnd()) * 0.74,
      phase: rnd() * Math.PI * 2,
      // Signed, so the interior does not rotate as one rigid disc.
      speed: (0.012 + rnd() * 0.026) * (rnd() < 0.5 ? -1 : 1),
      tilt: 0.35 + rnd() * 0.6,
      size: 0.6 + rnd() * 0.75,
    })
  }
  return points
}

/**
 * A point's position at time `t`, in units of the membrane radius.
 *
 * Shared by both presentations for the same reason the population is: the drawn
 * cell is a projection of this, not an approximation of it.
 */
export function cellPointAt(p: CellPoint, t: number): { x: number; y: number; z: number } {
  const a = p.phase + t * p.speed
  const r = p.radius
  return {
    x: Math.cos(a) * r,
    y: Math.sin(a) * r * p.tilt,
    z: Math.sin(a * 0.7 + p.phase) * r * 0.34,
  }
}

// ── Content entrance (§26) ──────────────────────────────────────────────────

/**
 * The closing sequence, in seconds.
 *
 * §26 asks the visual to settle before the words arrive, and gives a schedule
 * in milliseconds. It is played as a timeline rather than scrubbed: a headline
 * that reverses when the reader scrolls back two lines is a headline that never
 * settles, and this is the last thing the page says.
 */
export const CTA_ENTRANCE = {
  label: 0.65,
  headline: 0.75,
  headlineStagger: 0.12,
  lead: 1.1,
  actions: 1.25,
  brand: 1.45,
} as const

// ── Scroll budget ───────────────────────────────────────────────────────────

/**
 * Section height, in vh (§9).
 *
 * 100 of stage plus 18 of hold. The stage is `position: sticky`, so the tail is
 * what the footer travels through while the closing composition is still held —
 * without it the footer would begin covering the headline the instant the CTA
 * finished arriving, which is exactly what §41 rules out. §9 allows 110–130vh
 * including the footer transition, and this is 118 before the footer's own
 * ~300px is added.
 */
export const CTA_VH = 118
