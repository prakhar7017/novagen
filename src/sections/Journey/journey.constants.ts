/**
 * The Biological Journey — story definition and progress map.
 *
 * A single normalized 0–1 value drives every visual and textual state, so all
 * timing lives here rather than being scattered across components. Because
 * every derived value is a pure function of that number, scrubbing backward
 * reverses the whole sequence exactly (ACCEPTANCE_CRITERIA §9).
 */

export interface JourneyState {
  id: string
  /** Two-digit step number shown in the indicator */
  index: string
  label: string
  headline: [string, string]
  body: string
  /** Mono metadata pairs rendered in the HUD while this state is active */
  meta: [string, string][]
  /** Copy visibility window in global journey progress */
  enter: number
  exit: number
}

export const JOURNEY_STATES: JourneyState[] = [
  {
    id: 'origin',
    index: '01',
    label: 'ORIGIN',
    headline: ['Life begins', 'in complexity.'],
    body: 'We observe living systems as dynamic, connected environments.',
    meta: [
      ['SYSTEM', 'CELLULAR MODEL'],
      ['STATUS', 'ACTIVE'],
    ],
    enter: 0.0,
    exit: 0.17,
  },
  {
    id: 'explore',
    index: '02',
    label: 'EXPLORE',
    headline: ['From organism', 'to cell.'],
    body: 'We move from whole biological systems to individual cellular behavior.',
    meta: [
      // Avoid the micro sign here: the HUD is uppercased in CSS, and
      // text-transform maps U+00B5 to Greek capital Mu, rendering "20 MM".
      ['SCALE', '20 MICRON'],
      ['POPULATION', '11 CELLS'],
    ],
    enter: 0.19,
    exit: 0.35,
  },
  {
    id: 'decode',
    index: '03',
    label: 'DECODE',
    headline: ['Inside the cell,', 'biology becomes signal.'],
    body: 'We move beyond structure to the information encoded within it.',
    meta: [
      ['TARGET', 'CELL_014'],
      ['DEPTH', 'NUCLEAR'],
    ],
    enter: 0.37,
    exit: 0.53,
  },
  {
    id: 'signal',
    index: '04',
    label: 'SIGNAL',
    headline: ['Structure becomes', 'information.'],
    body: 'Thousands of biological interactions resolve into individual signals.',
    meta: [
      ['SIGNALS', 'RESOLVING'],
      ['CHANNEL', 'FLUORESCENCE'],
    ],
    enter: 0.55,
    exit: 0.69,
  },
  {
    id: 'read',
    index: '05',
    label: 'READ',
    headline: ['Biology speaks', 'in patterns.'],
    body: 'Signals organize into measurable genetic and cellular expression.',
    meta: [
      ['GENE EXPRESSION', 'SIGNAL_048'],
      ['LOCUS', 'A08'],
      ['CONFIDENCE', '98.7%'],
    ],
    enter: 0.71,
    exit: 0.81,
  },
  {
    id: 'interpret',
    index: '06',
    label: 'INTERPRET',
    headline: ['Signals become', 'relationships.'],
    body: 'Computational models reveal connections that are difficult to see in isolation.',
    meta: [
      ['NODES', '284'],
      ['PATHWAYS', 'MAPPED'],
    ],
    enter: 0.83,
    exit: 0.93,
  },
  {
    id: 'discover',
    index: '07',
    label: 'DISCOVER',
    headline: ['Complexity resolves', 'into possibility.'],
    body: 'High-confidence relationships guide the next generation of therapeutic candidates.',
    meta: [
      ['TARGET', 'IDENTIFIED'],
      ['CANDIDATE', 'NVG-042'],
      ['CONFIDENCE', '98.7%'],
      ['STATUS', 'VALIDATED'],
    ],
    enter: 0.95,
    exit: 1.01,
  },
]

// ── Visual milestones ───────────────────────────────────────────────────────
// These drive WebGL only; copy windows above overlap them deliberately so text
// leads the visual slightly rather than landing on the same frame.

export const MILESTONE = {
  /** organism holds, then dissolves into the cell cluster */
  dissolveStart: 0.14,
  dissolveEnd: 0.29,
  /** camera pushes through the cluster into one selected cell */
  pushStart: 0.35,
  pushEnd: 0.50,
  /** nucleus breaks apart; particles inherit its volume */
  shatterStart: 0.50,
  shatterEnd: 0.62,
  /** particle field reorganizes into a genetic signal */
  signalStart: 0.66,
  signalEnd: 0.76,
  /** signal detaches into a research network */
  networkStart: 0.78,
  networkEnd: 0.88,
  /** network contracts onto the molecular candidate */
  candidateStart: 0.90,
  candidateEnd: 0.99,
} as const

// ── Math helpers ────────────────────────────────────────────────────────────

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Linear remap of `v` from [a,b] to [0,1], clamped. */
export function remap(v: number, a: number, b: number): number {
  return clamp01((v - a) / (b - a))
}

/** Hermite ease — identical curve to GLSL smoothstep so CPU and GPU agree. */
export function smoothstep(a: number, b: number, v: number): number {
  const t = remap(v, a, b)
  return t * t * (3 - 2 * t)
}

/**
 * Continuous 0→4 morph index across the four procedural particle states:
 * 0 nucleus shell · 1 particle field · 2 genetic signal · 3 network · 4 candidate
 */
export function morphIndex(p: number): number {
  return (
    smoothstep(MILESTONE.shatterStart, MILESTONE.shatterEnd, p) +
    smoothstep(MILESTONE.signalStart, MILESTONE.signalEnd, p) +
    smoothstep(MILESTONE.networkStart, MILESTONE.networkEnd, p) +
    smoothstep(MILESTONE.candidateStart, MILESTONE.candidateEnd, p)
  )
}

/** Index of the story state whose copy window contains `p`. */
export function stageIndex(p: number): number {
  for (let i = JOURNEY_STATES.length - 1; i >= 0; i--) {
    if (p >= JOURNEY_STATES[i].enter) return i
  }
  return 0
}
