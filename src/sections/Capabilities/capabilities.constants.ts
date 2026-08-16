export type CapabilityId = 'spatial' | 'protein' | 'ai' | 'genomic'

export interface Capability {
  id: CapabilityId
  index: string
  title: string
  description: string
  meta: [string, string]
  reveal: number
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'spatial',
    index: '01',
    title: 'Spatial Biology',
    description:
      'Map cellular behavior while preserving the spatial context that gives biological signals meaning.',
    meta: ['Spatial resolution', '8 µm'],
    reveal: 0.25,
  },
  {
    id: 'protein',
    index: '02',
    title: 'Protein Engineering',
    description:
      'Explore structure, function and molecular behavior to identify new opportunities for biological design.',
    meta: ['Structure model', 'Active'],
    reveal: 0.4,
  },
  {
    id: 'ai',
    index: '03',
    title: 'AI Discovery',
    description:
      'Connect complex biological signals and prioritize the relationships most likely to drive meaningful discovery.',
    meta: ['Signals linked', '4 clusters'],
    reveal: 0.55,
  },
  {
    id: 'genomic',
    index: '04',
    title: 'Genomic Intelligence',
    description:
      'Turn gene-expression patterns into interpretable signals across cells, tissues and biological states.',
    meta: ['Expression tracks', '3 / 7 loci'],
    reveal: 0.7,
  },
]

export const CAPABILITIES_HEADLINE = ['One platform.', 'Multiple modes of discovery.'] as const

export const CAPABILITIES_LEAD =
  'Explore biology across spatial, molecular and computational scales with tools designed to work as one connected system.'

export const CAPABILITIES_EXIT = ['From capability', 'to evidence'] as const

export const SPATIAL_SRC = '/assets/capabilities/spatial-biology.webp'
export const PROTEIN_SRC = '/assets/capabilities/protein-engineering.webp'

export const SPATIAL_ALT =
  'Microscopic tissue field showing interconnected cells and spatial relationships.'

export const PROTEIN_ALT =
  'A folded protein structure with a bright active site at its core.'

export const DENSITY = {
  desktop: { spatialMarkers: 34, networkNodes: 52, genomeBars: 22, structurePoints: 9 },
  mobile: { spatialMarkers: 18, networkNodes: 26, genomeBars: 14, structurePoints: 6 },
} as const

export const SPATIAL_RADIUS = 150

export const PROTEIN_TILT = { x: 5, y: 2.6 } as const
