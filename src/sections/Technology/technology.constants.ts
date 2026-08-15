/**
 * Section 04 — Technology / Platform.
 *
 * One normalized 0–1 value describes the whole pipeline, exactly as the Journey
 * does, so the DOM copy, the pipeline rail and the WebGL scene all derive from
 * the same number and can never disagree. Every value below is a pure function
 * of that progress, which is what makes reverse scrubbing exact
 * (ACCEPTANCE_CRITERIA §9).
 *
 * The math helpers are the Journey's — they are generic curves, and a second
 * copy of smoothstep is a second place for CPU and GPU to drift apart.
 */
import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export type TechnologyStageId = 'sample' | 'map' | 'interpret' | 'predict' | 'validate'

export interface TechnologyStage {
  id: TechnologyStageId
  /** Two-digit number shown in the pipeline and the stage label */
  index: string
  label: string
  /** Two lines, revealed independently */
  title: [string, string]
  body: string
  /** Thin mono readouts shown while this stage is active — decorative (§62) */
  meta: [string, string][]
  /** Copy visibility window in section progress */
  enter: number
  exit: number
}

/**
 * The five stages.
 *
 * Windows are offset slightly ahead of the visual milestones below: the copy
 * names the stage a moment before the visualization completes it, so the reader
 * is told what they are about to see rather than what has just happened.
 */
export const TECHNOLOGY_STAGES: TechnologyStage[] = [
  {
    id: 'sample',
    index: '01',
    label: 'Sample',
    title: ['Capture biology', 'in context.'],
    body: 'Spatial, molecular and cellular information enters the platform without losing its biological context.',
    meta: [
      ['Input', 'Spatial + molecular'],
      ['Specimen', 'TS-114'],
    ],
    enter: 0.0,
    exit: 0.16,
  },
  {
    id: 'map',
    index: '02',
    label: 'Map',
    title: ['Resolve biology', 'across space.'],
    body: 'Cells, signals and structures are mapped into a common spatial representation.',
    meta: [
      ['Region', 'B08'],
      ['Cell count', '14,820'],
      // Not uppercased in CSS: text-transform maps the micro sign to Greek
      // capital Mu, which prints "8 MM" (the same trap as the Journey HUD).
      ['Spatial resolution', '8 µm'],
    ],
    enter: 0.2,
    exit: 0.36,
  },
  {
    id: 'interpret',
    index: '03',
    label: 'Interpret',
    title: ['Reveal hidden', 'relationships.'],
    body: 'Computational models connect signals across multiple biological layers.',
    meta: [
      ['Nodes', '218'],
      ['Pathways', '341'],
      ['Layers', '4'],
    ],
    enter: 0.4,
    exit: 0.56,
  },
  {
    id: 'predict',
    index: '04',
    label: 'Predict',
    title: ['Prioritize what', 'matters next.'],
    body: 'Predictive models narrow biological complexity into a focused set of high-confidence possibilities.',
    meta: [
      ['Candidate / 01', '82.4%'],
      ['Candidate / 02', '91.2%'],
      ['Candidate / 03', '98.7%'],
    ],
    enter: 0.6,
    exit: 0.76,
  },
  {
    id: 'validate',
    index: '05',
    label: 'Validate',
    title: ['Turn prediction', 'into evidence.'],
    body: 'High-confidence candidates are evaluated against experimental and biological evidence.',
    meta: [
      ['Candidate', 'NVG-042'],
      ['Confidence', '98.7%'],
      ['Status', 'Validated'],
    ],
    // Runs past 1 so the last stage has no exit — it holds through the handoff.
    enter: 0.8,
    exit: 1.02,
  },
]

// ── Visual milestones ───────────────────────────────────────────────────────
// Each stage is *established* between its own end and the next start, which is
// the plateau the brief asks for in §15; transitions overlap the copy windows
// above deliberately.

export const TECH_MILESTONE = {
  /** the specimen resolves out of the signal field */
  sampleIn: 0.01,
  sampleOn: 0.08,
  /** the specimen's interior unfolds into a spatial map */
  mapStart: 0.18,
  mapEnd: 0.28,
  /** mapped cells connect */
  interpretStart: 0.38,
  interpretEnd: 0.48,
  /** the network becomes selective */
  predictStart: 0.58,
  predictEnd: 0.68,
  /** one candidate separates and locks */
  validateStart: 0.78,
  validateEnd: 0.9,
  /** the validated candidate draws back toward Capabilities (§43) */
  exitStart: 0.94,
} as const

/**
 * Continuous 0→4 index across the five arrangements:
 * 0 sample · 1 map · 2 interpret · 3 predict · 4 validate
 *
 * The vertex shader mixes the target buffers with exactly this number, and the
 * pipeline rail fills with it too, so the rail and the scene are the same value
 * drawn twice.
 */
export function techMorph(p: number): number {
  return (
    smoothstep(TECH_MILESTONE.mapStart, TECH_MILESTONE.mapEnd, p) +
    smoothstep(TECH_MILESTONE.interpretStart, TECH_MILESTONE.interpretEnd, p) +
    smoothstep(TECH_MILESTONE.predictStart, TECH_MILESTONE.predictEnd, p) +
    smoothstep(TECH_MILESTONE.validateStart, TECH_MILESTONE.validateEnd, p)
  )
}

/**
 * Whether the platform scene has anything to draw.
 *
 * The section owns the viewport from the moment the ingress starts until its
 * progress reaches 1, and both ends are clamped by the timeline rather than
 * left at whatever the last scrubbed frame read — so this is exact in both
 * scroll directions. Every useFrame in the scene returns early on false, which
 * is what keeps the platform off the GPU's books during the other six sections.
 */
export function techVisible(): boolean {
  return scrollProgress.techIngress > 0.02 && scrollProgress.technology < 0.999
}

/** Index of the stage whose copy window contains `p`. */
export function techStageIndex(p: number): number {
  for (let i = TECHNOLOGY_STAGES.length - 1; i >= 0; i--) {
    if (p >= TECHNOLOGY_STAGES[i].enter) return i
  }
  return 0
}

/**
 * Scientific grid opacity, in the 1.5–3% band the brief allows, lifted while
 * the spatial map is being established and settling back afterwards (§38). The
 * environment gets narrative behaviour without ever becoming a cyber-grid.
 */
export const GRID_ALPHA: Record<TechnologyStageId, number> = {
  sample: 0.01,
  map: 0.04,
  interpret: 0.02,
  predict: 0.016,
  validate: 0.012,
}

// ── Scroll budget ───────────────────────────────────────────────────────────

/**
 * Section height, in vh, split three ways:
 *
 *   ingress  the Bone → platform transition, run while the stage is already
 *            stuck, so the microscopy plate can expand into a held viewport
 *   stage    the sticky viewport itself, which contributes no scrub
 *   story    the five stages
 *
 * 36 + 100 + 144 = 280vh, the top of the 220–280vh band in §7 — the extra
 * length all goes to the story, which is the part that has to stay readable.
 * Still well under the Journey's 460vh + handoff.
 */
export const TECH_SCROLL = { ingressVh: 36, storyVh: 144 } as const

export const TECHNOLOGY_VH = 100 + TECH_SCROLL.ingressVh + TECH_SCROLL.storyVh

/**
 * Candidate confidences, shared by the WebGL rings and the drawn diagrams.
 *
 * Ordered to match `TechTargets.candidates`, which ranks the shortlisted map
 * regions by importance — so index 0 is both the strongest cluster in the
 * network and the highest confidence on the dial. The two would drift apart if
 * either list were reordered independently.
 */
export const CANDIDATE_CONFIDENCE = [0.987, 0.912, 0.824, 0.765] as const

/** The candidate that survives validation — NVG-042 at 98.7%. */
export const WINNER = 0

export const SPECIMEN_SRC = '/assets/technology/sample-specimen.webp'
export const CANDIDATE_SRC = '/assets/story/07-molecular-candidate.webp'

export const SPECIMEN_ALT =
  'A biological specimen: a dense, irregular cluster of cells held together by a luminous green membrane network.'
