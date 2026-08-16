export const HANDOFF_VH = { desktop: 72, mobile: 54 } as const

export interface HeadlineLine {
  text: string
  accent?: boolean
}

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

export const SCALE_STAGES = ['Gene', 'Cell', 'Tissue', 'System'] as const

export interface Annotation {
  x: number
  y: number
  label: string
  value: string
  side: 'left' | 'right'
  secondary?: boolean
}

export const ANNOTATIONS: Annotation[] = [
  { x: 45, y: 50, label: 'Cell region', value: 'A04', side: 'left' },
  { x: 78, y: 20, label: 'Expression density', value: '72.8%', side: 'left' },
  { x: 20, y: 84, label: 'Scale', value: '40 µm', side: 'right', secondary: true },
]

export const MICROSCOPY_ALT =
  'Fluorescence microscopy of a cellular field: cells linked by a dense green network of connective structures, with one brightly expressing cell near the centre.'

export const MICROSCOPY_SRC = '/assets/innovation/innovation-microscopy.webp'

export const MICROSCOPY_SIZE = { width: 1122, height: 1402 } as const
