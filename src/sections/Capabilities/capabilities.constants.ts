/**
 * Section 05 — Capabilities.
 *
 * Where Technology explained how the platform works, this states what it
 * enables. One list, four entries, and no more: §10 caps the first
 * implementation at four, and the modules are sized so that the reader can
 * tell them apart before reading a single paragraph.
 *
 * Copy, metadata and reveal order all live here so the section's content is
 * one file rather than four components' worth of inline strings.
 */

export type CapabilityId = 'spatial' | 'protein' | 'ai' | 'genomic'

export interface Capability {
  id: CapabilityId
  /** Two-digit index shown inside the module */
  index: string
  title: string
  description: string
  /** One thin mono readout — decorative, never load-bearing (§13) */
  meta: [string, string]
  /**
   * Where this module sits in the scrubbed reveal (§33), as section-entry
   * progress. Deliberately uneven: the grid should arrive as one composition
   * settling, not as four equal fades.
   */
  reveal: number
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'spatial',
    index: '01',
    title: 'Spatial Biology',
    description:
      'Map cellular behavior while preserving the spatial context that gives biological signals meaning.',
    // Not uppercased in CSS: text-transform maps the micro sign to Greek
    // capital Mu, which prints "8 MM" (the same trap as the Journey HUD and
    // the Technology readouts).
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

/** Two authored lines — a browser wrap would strand "discovery." */
export const CAPABILITIES_HEADLINE = ['One platform.', 'Multiple modes of discovery.'] as const

export const CAPABILITIES_LEAD =
  'Explore biology across spatial, molecular and computational scales with tools designed to work as one connected system.'

/** Prepares 06 / Research without implementing it (§54). */
export const CAPABILITIES_EXIT = ['From capability', 'to evidence'] as const

// ── Assets ──────────────────────────────────────────────────────────────────

export const SPATIAL_SRC = '/assets/capabilities/spatial-biology.webp'
export const PROTEIN_SRC = '/assets/capabilities/protein-engineering.webp'

/**
 * Both images carry content the surrounding copy does not (§49): the module
 * text names what the capability does, not what the picture shows. Kept to one
 * sentence each — a paragraph of alt text is its own accessibility failure.
 */
export const SPATIAL_ALT =
  'Microscopic tissue field showing interconnected cells and spatial relationships.'

export const PROTEIN_ALT =
  'A folded protein structure with a bright active site at its core.'

// ── Interaction budget ──────────────────────────────────────────────────────

/**
 * Element counts, per §15, §22 and §45.
 *
 * The mobile column is not a smaller version of the desktop one for its own
 * sake: the same arrangement drawn into a 340px-wide module leaves markers
 * closer together than their own radius, so the reduction is what keeps the
 * science legible, and the battery saving is a side effect.
 */
export const DENSITY = {
  desktop: { spatialMarkers: 34, networkNodes: 52, genomeBars: 22, structurePoints: 9 },
  mobile: { spatialMarkers: 18, networkNodes: 26, genomeBars: 14, structurePoints: 6 },
} as const

/**
 * Pointer response radius for the spatial field, in CSS pixels (§15 asks for
 * 120–180). Markers outside it are untouched, which is what stops the
 * interaction from lighting the whole visual (§16).
 */
export const SPATIAL_RADIUS = 150

/** Perceived rotation limits for the protein, in degrees (§19). */
export const PROTEIN_TILT = { x: 5, y: 2.6 } as const
