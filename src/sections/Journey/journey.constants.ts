export interface JourneyState {
  id: string
  index: string
  label: string
  headline: [string, string]
  body: string
  meta: [string, string][]
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

export const MILESTONE = {
  dissolveStart: 0.14,
  dissolveEnd: 0.29,
  pushStart: 0.35,
  pushEnd: 0.50,
  shatterStart: 0.50,
  shatterEnd: 0.62,
  signalStart: 0.66,
  signalEnd: 0.76,
  networkStart: 0.78,
  networkEnd: 0.88,
  candidateStart: 0.90,
  candidateEnd: 0.99,
} as const

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function remap(v: number, a: number, b: number): number {
  return clamp01((v - a) / (b - a))
}

export function smoothstep(a: number, b: number, v: number): number {
  const t = remap(v, a, b)
  return t * t * (3 - 2 * t)
}

export function morphIndex(p: number): number {
  return (
    smoothstep(MILESTONE.shatterStart, MILESTONE.shatterEnd, p) +
    smoothstep(MILESTONE.signalStart, MILESTONE.signalEnd, p) +
    smoothstep(MILESTONE.networkStart, MILESTONE.networkEnd, p) +
    smoothstep(MILESTONE.candidateStart, MILESTONE.candidateEnd, p)
  )
}

export function stageIndex(p: number): number {
  for (let i = JOURNEY_STATES.length - 1; i >= 0; i--) {
    if (p >= JOURNEY_STATES[i].enter) return i
  }
  return 0
}
