/**
 * Section 07 — Impact / Outcomes.
 *
 * Research showed what the science looks like; this states what it enables.
 * The whole section runs on one normalized 0–1 progress, exactly as the Journey
 * and Technology do, so the metric copy, the step indicator, the confidence arc
 * and the WebGL network are four drawings of the same number and cannot
 * disagree. That is also what makes reverse scrubbing exact rather than merely
 * approximate (ACCEPTANCE_CRITERIA §9, §57).
 *
 * The three figures are fictional portfolio content and are labelled as such in
 * the section's own metadata (§4, §50) — the site must never imply they are
 * measured company claims.
 */
import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export type ImpactStageId = 'scale' | 'prioritize' | 'validate'

export interface ImpactMetric {
  id: ImpactStageId
  /** Two-digit index shown in the step indicator and beside the state label */
  index: string
  /** SCALE · PRIORITIZE · VALIDATE */
  label: string
  /**
   * The figure, split so the unit can take Bio Green on its own (§30). Only the
   * suffix is ever accented — a fully green number would be the "huge glowing
   * number with no meaning" §55 fails the section for.
   */
  value: string
  suffix: string
  /** The line directly under the number — what the figure counts (§31) */
  description: string
  /** The sentence that gives the figure a consequence (§14, §18, §22) */
  statement: string
  /** Thin mono readouts. Illustrative, never load-bearing (§14, §18) */
  meta: [string, string][]
  /** Copy visibility window, in section progress */
  enter: number
  exit: number
}

/**
 * The three states.
 *
 * Windows follow §13's schedule: each metric arrives a little before the
 * visualization has finished expressing it, so the reader is told what they are
 * about to watch happen rather than what has just happened.
 *
 * Each window's exit is exactly the next one's entry. Not incidental — a gap
 * leaves the metric column empty mid-scroll, and an overlap puts two figures at
 * 170px in the same box at once. The constants test asserts it.
 */
export const IMPACT_METRICS: ImpactMetric[] = [
  {
    id: 'scale',
    index: '01',
    label: 'Scale',
    value: '14.8',
    suffix: 'M',
    description: 'biological interactions analyzed',
    statement:
      'Complex biological systems generate relationships at a scale that is difficult to interpret manually.',
    meta: [
      ['Dataset', 'Multimodal'],
      ['Signals', '14,800,000'],
      ['State', 'Analyzing'],
    ],
    enter: 0.0,
    exit: 0.3,
  },
  {
    id: 'prioritize',
    index: '02',
    label: 'Prioritize',
    value: '72',
    suffix: '×',
    description: 'faster candidate screening',
    statement:
      'Computational filtering reduces enormous candidate spaces into a smaller set of relationships worth testing.',
    meta: [
      ['Initial space', '12,840'],
      ['Prioritized', '178'],
      ['Filter mode', 'Active'],
    ],
    enter: 0.3,
    exit: 0.64,
  },
  {
    id: 'validate',
    index: '03',
    label: 'Validate',
    value: '91',
    suffix: '%',
    description: 'validation confidence',
    statement:
      'The final signal is not the largest network. It is the smallest set of relationships supported by meaningful evidence.',
    meta: [
      ['Candidate', 'NVG-042'],
      ['Evidence paths', '9'],
      ['State', 'Validated'],
    ],
    // Runs past 1 so the last state has no exit — it holds through the handoff.
    enter: 0.64,
    exit: 1.02,
  },
]

export const IMPACT_INDEX = '07'
export const IMPACT_LABEL = 'Impact'

/**
 * The provenance line, shown rather than hidden.
 *
 * §50 allows fictional metrics to be labelled as concept data in the content,
 * and Research already sets the precedent with "2026 / Portfolio concept". A
 * section whose entire argument is three numbers is the last place to be coy
 * about where they came from.
 */
export const IMPACT_META = {
  key: 'Concept data',
  value: 'Portfolio demonstration',
} as const

/** Two authored lines — a browser wrap would strand "possibility." (§10) */
export const IMPACT_HEADLINE = ['From biological scale', 'to meaningful possibility.'] as const

export const IMPACT_LEAD =
  'Millions of biological relationships can exist inside a single research question. NOVA/GEN is designed to narrow that complexity into signals, candidates and decisions researchers can act on.'

/** Stated once, in text, so the figures are never a claim about the world. */
export const IMPACT_DISCLOSURE =
  'The figures in this section are illustrative concept data created for this portfolio piece. They do not describe measured results.'

// ── The human moment (§26–§28) ──────────────────────────────────────────────

export const HUMAN_SRC = '/assets/impact/human-impact.webp'

export const HUMAN_MOMENT = {
  label: 'The measure that matters',
  statement: ['Better science', 'creates better possibilities', 'for people.'],
  alt: 'A researcher in a laboratory transferring a sample by pipette beside a microscope, a fluorescence field visible on the monitor behind her.',
} as const

// ── Visual milestones ───────────────────────────────────────────────────────
// Each state is *established* on a plateau between transitions, per §13. The
// copy windows above overlap these deliberately.

export const IMPACT_MILESTONE = {
  /** the dense field populates out of the ingress */
  populateIn: 0.02,
  populateOn: 0.18,
  /** SCALE → PRIORITIZE: weak signals dim, the field collapses to candidates */
  filterStart: 0.3,
  filterEnd: 0.5,
  /** a second, tighter contraction inside PRIORITIZE (§13 at 0.55) */
  compressStart: 0.52,
  compressEnd: 0.64,
  /** PRIORITIZE → VALIDATE: uncertain clusters lose their claim */
  validateStart: 0.64,
  validateEnd: 0.8,
  /** the confidence arc sweeps and the target stabilizes */
  arcStart: 0.7,
  arcEnd: 0.86,
  /** the human moment (§26) */
  humanIn: 0.74,
  humanOut: 0.88,
  /** everything scientific reduces toward one point for the Final CTA (§53) */
  exitStart: 0.9,
} as const

/**
 * Continuous 0→2 index across the three arrangements:
 * 0 scale · 1 prioritize · 2 validate
 *
 * The vertex shader mixes the target buffers with exactly this number, and the
 * drawn mobile diagrams sample the same function — so the two presentations
 * show the same arrangements rather than two interpretations of a description.
 */
export function impactMorph(p: number): number {
  return (
    smoothstep(IMPACT_MILESTONE.filterStart, IMPACT_MILESTONE.filterEnd, p) +
    smoothstep(IMPACT_MILESTONE.validateStart, IMPACT_MILESTONE.validateEnd, p)
  )
}

/**
 * Extra contraction of the surviving candidate regions, on top of the morph.
 *
 * §19 asks the reduction to read as MORE → LESS → FOCUSED rather than as a
 * single move, so the network tightens once more while 72× is still on screen.
 * Released as VALIDATE begins, because the validate arrangement carries its own
 * geometry and stacking two contractions would collapse the target to a dot.
 */
export function impactCompress(p: number): number {
  return (
    smoothstep(IMPACT_MILESTONE.compressStart, IMPACT_MILESTONE.compressEnd, p) *
    (1 - smoothstep(IMPACT_MILESTONE.validateStart, IMPACT_MILESTONE.validateEnd, p))
  )
}

/**
 * 0–1 confidence, drawn as arc length. Ends at 0.91 — the arc *is* the 91%, so
 * the two can never state different things (§25).
 */
export const CONFIDENCE = 0.91

export function impactArc(p: number): number {
  return CONFIDENCE * smoothstep(IMPACT_MILESTONE.arcStart, IMPACT_MILESTONE.arcEnd, p)
}

/**
 * The exit collapse (§53, §54).
 *
 * Exposed rather than kept private: the Final CTA is seeded by whatever this
 * leaves behind, and it should read the same number this section ends on rather
 * than re-derive it from its own trigger.
 */
export function impactExit(p: number): number {
  return smoothstep(IMPACT_MILESTONE.exitStart, 1.0, p)
}

/**
 * Whether the impact scene has anything to draw.
 *
 * The section owns the viewport from the moment its ingress starts until its
 * progress reaches 1, and both ends are clamped by the timeline rather than
 * left at whatever the last scrubbed frame read — so this is exact in both
 * scroll directions. Every useFrame in the scene returns early on false.
 */
export function impactVisible(): boolean {
  return scrollProgress.impactIngress > 0.02 && scrollProgress.impact < 0.999
}

/** Index of the metric whose copy window contains `p`. */
export function impactStageIndex(p: number): number {
  for (let i = IMPACT_METRICS.length - 1; i >= 0; i--) {
    if (p >= IMPACT_METRICS[i].enter) return i
  }
  return 0
}

// ── Scroll budget ───────────────────────────────────────────────────────────

/**
 * Section height, in vh, split three ways:
 *
 *   ingress  the Research → Impact handoff, run while the stage is already
 *            stuck, so the Bone can dim into the dark environment in a held
 *            viewport rather than as a scrolling seam
 *   stage    the sticky viewport itself, which contributes no scrub
 *   story    the three metric states
 *
 * 36 + 100 + 124 = 260vh. §8 recommends 240 and allows 220–280; §33 asks the
 * stage to stay stuck for 180–220vh, which at 240vh total is arithmetically
 * impossible (the stage is stuck for height − 100vh). 260 splits the
 * difference: 160vh of held sequence, and still comfortably shorter than
 * Technology's 280 and a fraction of the Journey's 460.
 */
export const IMPACT_SCROLL = { ingressVh: 36, storyVh: 124 } as const

export const IMPACT_VH = 100 + IMPACT_SCROLL.ingressVh + IMPACT_SCROLL.storyVh
