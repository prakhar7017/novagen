import { smoothstep } from '@/sections/Journey/journey.constants'
import { scrollProgress } from '@/store/progressRef'

export type ImpactStageId = 'scale' | 'prioritize' | 'validate'

export interface ImpactMetric {
  id: ImpactStageId
  index: string
  label: string
  value: string
  suffix: string
  description: string
  statement: string
  meta: [string, string][]
  enter: number
  exit: number
}

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
    enter: 0.64,
    exit: 1.02,
  },
]

export const IMPACT_INDEX = '07'
export const IMPACT_LABEL = 'Impact'

export const IMPACT_META = {
  key: 'Concept data',
  value: 'Portfolio demonstration',
} as const

export const IMPACT_HEADLINE = ['From biological scale', 'to meaningful possibility.'] as const

export const IMPACT_LEAD =
  'Millions of biological relationships can exist inside a single research question. NOVA/GEN is designed to narrow that complexity into signals, candidates and decisions researchers can act on.'

export const IMPACT_DISCLOSURE =
  'The figures in this section are illustrative concept data created for this portfolio piece. They do not describe measured results.'

export const HUMAN_SRC = '/assets/impact/human-impact.webp'

export const HUMAN_MOMENT = {
  label: 'The measure that matters',
  statement: ['Better science', 'creates better possibilities', 'for people.'],
  alt: 'A researcher in a laboratory transferring a sample by pipette beside a microscope, a fluorescence field visible on the monitor behind her.',
} as const

export const IMPACT_MILESTONE = {
  populateIn: 0.02,
  populateOn: 0.18,
  filterStart: 0.3,
  filterEnd: 0.5,
  compressStart: 0.52,
  compressEnd: 0.64,
  validateStart: 0.64,
  validateEnd: 0.8,
  arcStart: 0.7,
  arcEnd: 0.86,
  humanIn: 0.74,
  humanOut: 0.88,
  exitStart: 0.9,
} as const

export function impactMorph(p: number): number {
  return (
    smoothstep(IMPACT_MILESTONE.filterStart, IMPACT_MILESTONE.filterEnd, p) +
    smoothstep(IMPACT_MILESTONE.validateStart, IMPACT_MILESTONE.validateEnd, p)
  )
}

export function impactCompress(p: number): number {
  return (
    smoothstep(IMPACT_MILESTONE.compressStart, IMPACT_MILESTONE.compressEnd, p) *
    (1 - smoothstep(IMPACT_MILESTONE.validateStart, IMPACT_MILESTONE.validateEnd, p))
  )
}

export const CONFIDENCE = 0.91

export function impactArc(p: number): number {
  return CONFIDENCE * smoothstep(IMPACT_MILESTONE.arcStart, IMPACT_MILESTONE.arcEnd, p)
}

export function impactExit(p: number): number {
  return smoothstep(IMPACT_MILESTONE.exitStart, 1.0, p)
}

export function impactVisible(): boolean {
  return scrollProgress.impactIngress > 0.02 && scrollProgress.impact < 0.999
}

export function impactStageIndex(p: number): number {
  for (let i = IMPACT_METRICS.length - 1; i >= 0; i--) {
    if (p >= IMPACT_METRICS[i].enter) return i
  }
  return 0
}

export const IMPACT_SCROLL = { ingressVh: 36, storyVh: 124 } as const

export const IMPACT_VH = 100 + IMPACT_SCROLL.ingressVh + IMPACT_SCROLL.storyVh
