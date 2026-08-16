import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export type TechnologyStageId = 'sample' | 'map' | 'interpret' | 'predict' | 'validate'

export interface TechnologyStage {
  id: TechnologyStageId
  index: string
  label: string
  title: [string, string]
  body: string
  meta: [string, string][]
  enter: number
  exit: number
}

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
    enter: 0.8,
    exit: 1.02,
  },
]

export const TECH_MILESTONE = {
  sampleIn: 0.01,
  sampleOn: 0.08,
  mapStart: 0.18,
  mapEnd: 0.28,
  interpretStart: 0.38,
  interpretEnd: 0.48,
  predictStart: 0.58,
  predictEnd: 0.68,
  validateStart: 0.78,
  validateEnd: 0.9,
  exitStart: 0.94,
} as const

export function techMorph(p: number): number {
  return (
    smoothstep(TECH_MILESTONE.mapStart, TECH_MILESTONE.mapEnd, p) +
    smoothstep(TECH_MILESTONE.interpretStart, TECH_MILESTONE.interpretEnd, p) +
    smoothstep(TECH_MILESTONE.predictStart, TECH_MILESTONE.predictEnd, p) +
    smoothstep(TECH_MILESTONE.validateStart, TECH_MILESTONE.validateEnd, p)
  )
}

export function techVisible(): boolean {
  return scrollProgress.techIngress > 0.02 && scrollProgress.technology < 0.999
}

export function techStageIndex(p: number): number {
  for (let i = TECHNOLOGY_STAGES.length - 1; i >= 0; i--) {
    if (p >= TECHNOLOGY_STAGES[i].enter) return i
  }
  return 0
}

export const GRID_ALPHA: Record<TechnologyStageId, number> = {
  sample: 0.01,
  map: 0.04,
  interpret: 0.02,
  predict: 0.016,
  validate: 0.012,
}

export const TECH_SCROLL = { ingressVh: 36, storyVh: 144 } as const

export const TECHNOLOGY_VH = 100 + TECH_SCROLL.ingressVh + TECH_SCROLL.storyVh

export const CANDIDATE_CONFIDENCE = [0.987, 0.912, 0.824, 0.765] as const

export const WINNER = 0

export const SPECIMEN_SRC = '/assets/technology/sample-specimen.webp'
export const CANDIDATE_SRC = '/assets/story/07-molecular-candidate.webp'

export const SPECIMEN_ALT =
  'A biological specimen: a dense, irregular cluster of cells held together by a luminous green membrane network.'
