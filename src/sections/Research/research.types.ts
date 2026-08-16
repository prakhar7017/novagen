/**
 * Section 06 — Research.
 *
 * Three studies, three presentations: a lead editorial feature, a compact
 * reversed row, and a figure drawn in code. They share enough structure to be
 * one type and differ enough that a single component rendering all three would
 * be a card grid — which §56 fails the section for outright.
 */

/** One key/value line in a study's metadata block. */
export interface StudyMeta {
  key: string
  value: string
}

export interface ResearchStudy {
  id: string
  /** Two-digit index, shown as STUDY / 0n */
  index: string
  /** Authored line breaks — a browser wrap strands the last word (§14, §23) */
  title: readonly string[]
  summary: string
  meta: readonly StudyMeta[]
  /** Absent on the procedural figure, which ships no raster asset (§26) */
  image?: {
    src: string
    /** Narrow variant offered to phones through srcset (§51) */
    srcNarrow: string
    /** Intrinsic size of `src` — reserves layout space before decode */
    width: number
    height: number
    alt: string
  }
}

/** A thin readout pinned over the lead image (§18). */
export interface ResearchAnnotation {
  /** Position within the image frame, in percent */
  x: number
  y: number
  label: string
  value: string
  /** Which side the leader and text run relative to the marker */
  side: 'left' | 'right'
}
