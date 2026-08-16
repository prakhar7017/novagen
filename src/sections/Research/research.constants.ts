import type { ResearchAnnotation, ResearchStudy } from './research.types'

export const RESEARCH_INDEX = '06'
export const RESEARCH_LABEL = 'Research'

export const RESEARCH_META = {
  key: 'Selected studies',
  value: '2026 / Portfolio concept',
} as const

export const RESEARCH_HEADLINE = ['Research built', 'to reveal what matters.'] as const

export const RESEARCH_LEAD =
  'From cellular neighborhoods to molecular structure, NOVA/GEN brings biological context and computation together to surface relationships worth investigating.'

export const CELLULAR_FIELD_SRC = '/assets/research/research-cellular-field.webp'
export const CELLULAR_FIELD_SRC_NARROW = '/assets/research/research-cellular-field-820.webp'
export const PROTEIN_STUDY_SRC = '/assets/research/research-protein-study.webp'
export const PROTEIN_STUDY_SRC_NARROW = '/assets/research/research-protein-study-720.webp'

export const LEAD_STUDY: ResearchStudy = {
  id: 'cellular-field',
  index: '01',
  title: ['Mapping cellular', 'neighborhoods across', 'dynamic tissue.'],
  summary:
    'A spatial analysis of how neighboring cells, local structure and signal density change the interpretation of biological activity.',
  meta: [
    { key: 'Mode', value: 'Spatial biology' },
    { key: 'Scale', value: 'Multicellular' },
    { key: 'Status', value: 'Selected study' },
  ],
  image: {
    src: CELLULAR_FIELD_SRC,
    srcNarrow: CELLULAR_FIELD_SRC_NARROW,
    width: 1536,
    height: 1024,
    alt: 'Microscopic tissue field showing interconnected cells and spatial biological relationships.',
  },
}

export const SECOND_STUDY: ResearchStudy = {
  id: 'protein-study',
  index: '02',
  title: ['Resolving structure around', 'a high-confidence', 'active region.'],
  summary:
    'Structural analysis connects local molecular architecture with candidate activity to identify regions worth deeper investigation.',
  meta: [
    { key: 'Mode', value: 'Protein engineering' },
    { key: 'Scale', value: 'Molecular' },
  ],
  image: {
    src: PROTEIN_STUDY_SRC,
    srcNarrow: PROTEIN_STUDY_SRC_NARROW,
    width: 1200,
    height: 900,
    alt: 'Molecular protein structure highlighting a localized active region.',
  },
}

export const THIRD_STUDY: ResearchStudy = {
  id: 'signal-states',
  index: '03',
  title: ['Tracing signal', 'relationships across', 'biological states.'],
  summary:
    'A computational view of how signal patterns shift between biological conditions and converge around a smaller set of meaningful relationships.',
  meta: [
    { key: 'Mode', value: 'Computational interpretation' },
    { key: 'Scale', value: 'Cross-condition' },
  ],
}

export const LEAD_ANNOTATIONS: ResearchAnnotation[] = [
  { x: 44, y: 62, label: 'Region', value: 'A12', side: 'right' },
  { x: 62, y: 26, label: 'Cellular density', value: 'High', side: 'right' },
]

export const LEAD_SCALE = '60 µm'

export const SPOTLIGHT_DIAMETER = 220

export const RESEARCH_FOOTER = {
  statement: ['Research is strongest', 'when every layer can inform the next.'],
  support: ['From observation to interpretation,', 'context remains part of the model.'],
  marker: '14.8M',
} as const
