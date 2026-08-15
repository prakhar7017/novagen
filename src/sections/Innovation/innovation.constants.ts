/**
 * Section 03 — Innovation / Our Approach.
 *
 * All copy and instrumentation live here so the components stay layout-only and
 * the section's text can be reviewed in one place. Nothing in this file is
 * scroll-dependent: Innovation is a quiet editorial section, not a second
 * scripted sequence like the Journey.
 */

/**
 * Scroll length, in vh, of the Journey → Innovation aperture handoff.
 *
 * The Journey section is made this much taller and its story timeline ends
 * this much earlier (`bottom bottom+=handoff`), which reserves a tail of scroll
 * where the Journey stage is still stuck to the top of the viewport but the
 * story has already resolved. The aperture opens inside that tail, so the Bone
 * surface has fully covered the stage by the moment the stage unsticks and
 * Innovation slides up behind it — Bone meeting Bone, with no seam.
 *
 * Story pacing is unchanged: the section grew by exactly the amount the
 * timeline's end moved.
 */
export const HANDOFF_VH = { desktop: 72, mobile: 54 } as const

export interface HeadlineLine {
  text: string
  /** Appends the section's one Bio Green full stop */
  accent?: boolean
}

/**
 * The editorial statement, split per line.
 *
 * "Biology isn’t static." cannot fit one line on a 390px screen at any size in
 * the 46–54px band the brief asks for, so narrow screens get their own break
 * rather than a browser wrap — which strands "static." alone on a line (§37).
 * Four balanced lines read as a deliberate stanza; three plus an orphan does
 * not.
 */
export const HEADLINE_WIDE: HeadlineLine[] = [
  { text: "Biology isn’t static", accent: true },
  { text: 'Neither is our platform.' },
]

export const HEADLINE_NARROW: HeadlineLine[] = [
  { text: 'Biology' },
  { text: "isn’t static", accent: true },
  { text: 'Neither is' },
  { text: 'our platform.' },
]

export interface Principle {
  index: string
  title: string
  detail: string
}

/**
 * Three understated editorial rows — deliberately not cards.
 * ACCEPTANCE_CRITERIA §27 fails the section if it reads as a feature grid.
 */
export const PRINCIPLES: Principle[] = [
  {
    index: '01',
    title: 'Multiscale',
    detail: 'From molecular signals to cellular environments.',
  },
  {
    index: '02',
    title: 'Contextual',
    detail: 'Relationships are interpreted within biological context.',
  },
  {
    index: '03',
    title: 'Adaptive',
    detail: 'Models evolve as new evidence enters the system.',
  },
]

/**
 * The biological scale line that closes the section: GENE → CELL → TISSUE →
 * SYSTEM. A single editorial rule, not the Technology pipeline — that arrives
 * in section 04 and must stay visually distinct from this.
 */
export const SCALE_STAGES = ['Gene', 'Cell', 'Tissue', 'System'] as const

export interface Annotation {
  /** Percentage position within the microscopy frame */
  x: number
  y: number
  label: string
  value: string
  /** Which side the leader line and text sit on relative to the marker */
  side: 'left' | 'right'
  /** Hidden below 1024px, where the frame is too small to carry three */
  secondary?: boolean
}

/**
 * Instrumentation over the microscopy frame — two or three thin mono readouts,
 * never a HUD (prompt §20). Positions target quiet regions of the image so the
 * text never lands on the bright focal nucleus.
 *
 * These are decorative: every fact they imply is already stated in the body
 * copy, so nothing is lost when they are hidden or unread (§43).
 */
export const ANNOTATIONS: Annotation[] = [
  { x: 45, y: 50, label: 'Cell region', value: 'A04', side: 'left' },
  { x: 78, y: 20, label: 'Expression density', value: '72.8%', side: 'left' },
  // Values are rendered without text-transform: uppercasing them would map the
  // micro sign to Greek capital Mu and print "40 MM".
  { x: 20, y: 84, label: 'Scale', value: '40 µm', side: 'right', secondary: true },
]

/** Alt text used when the microscopy image is treated as informational. */
export const MICROSCOPY_ALT =
  'Fluorescence microscopy of a cellular field: cells linked by a dense green network of connective structures, with one brightly expressing cell near the centre.'

export const MICROSCOPY_SRC = '/assets/innovation/innovation-microscopy.webp'

/** Intrinsic pixels of the built asset — set on <img> to reserve layout space. */
export const MICROSCOPY_SIZE = { width: 1122, height: 1402 } as const
