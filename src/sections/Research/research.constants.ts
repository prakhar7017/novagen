import type { ResearchAnnotation, ResearchStudy } from './research.types'

/**
 * Section 06 — Research.
 *
 * All copy, metadata and asset paths in one file, as with every section before
 * it: the components stay layout-only and the section's text can be read
 * without opening five of them.
 *
 * Everything here is portfolio content. The labels are deliberately written as
 * internal study descriptors — MODE, SCALE, STATUS — rather than as citations,
 * volumes or dates, because a fictional site must not imply peer-reviewed
 * publication (§14, §10).
 */

export const RESEARCH_INDEX = '06'
export const RESEARCH_LABEL = 'Research'

/** The right-hand readout the previous four sections all carry. */
export const RESEARCH_META = {
  key: 'Selected studies',
  value: '2026 / Portfolio concept',
} as const

/** Two authored lines: a wrap would leave "matters." alone (§11). */
export const RESEARCH_HEADLINE = ['Research built', 'to reveal what matters.'] as const

export const RESEARCH_LEAD =
  'From cellular neighborhoods to molecular structure, NOVA/GEN brings biological context and computation together to surface relationships worth investigating.'

// ── Assets ──────────────────────────────────────────────────────────────────

export const CELLULAR_FIELD_SRC = '/assets/research/research-cellular-field.webp'
export const CELLULAR_FIELD_SRC_NARROW = '/assets/research/research-cellular-field-820.webp'
export const PROTEIN_STUDY_SRC = '/assets/research/research-protein-study.webp'
export const PROTEIN_STUDY_SRC_NARROW = '/assets/research/research-protein-study-720.webp'

// ── Studies ─────────────────────────────────────────────────────────────────

export const LEAD_STUDY: ResearchStudy = {
  id: 'cellular-field',
  index: '01',
  // Three authored lines rather than two: the lead study's text column is the
  // narrowest in the section, and a two-line break wraps at every viewport
  // under 1600 — which strands a single word on a third line anyway.
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

/** No raster asset: this one is drawn (§26). */
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

// ── Lead image instrumentation ──────────────────────────────────────────────

/**
 * Two readouts and a scale bar over the tissue field (§18).
 *
 * The image is used uncropped, so these percentages address the biology
 * directly: the two markers sit on cell-dense regions and their labels run out
 * into quiet, near-black areas of the field. Decorative by construction —
 * nothing they state is missing from the study copy beside them.
 *
 * Values are authored in final case: text-transform maps the micro sign to
 * Greek capital Mu, which prints "60 MM".
 */
export const LEAD_ANNOTATIONS: ResearchAnnotation[] = [
  // On the dense cluster low-left of centre, labelled out to its right across
  // the darker channel that runs between the two bright neighbourhoods.
  { x: 44, y: 62, label: 'Region', value: 'A12', side: 'right' },
  // On the filament field top-right, where the label has near-black to sit on.
  { x: 62, y: 26, label: 'Cellular density', value: 'High', side: 'right' },
]

/** The scale bar in the lower-left corner of the lead frame. */
export const LEAD_SCALE = '60 µm'

/**
 * Region spotlight diameter in CSS pixels (§20 asks for 180–260). The nearest
 * annotation inside half this distance is the one that activates.
 */
export const SPOTLIGHT_DIAMETER = 220

// ── Section footer ──────────────────────────────────────────────────────────

/** Closes Research and sets up Impact without implementing it (§38, §39). */
export const RESEARCH_FOOTER = {
  statement: ['Research is strongest', 'when every layer can inform the next.'],
  support: ['From observation to interpretation,', 'context remains part of the model.'],
  /**
   * The first hint of section 07. Fictional portfolio figure, kept faint and
   * unexplained here on purpose: Impact is where it acquires a meaning, and a
   * number with a claim attached would be one this section cannot support.
   */
  marker: '14.8M',
} as const
