/**
 * The page's section registry.
 *
 * One list, consumed by the header's active-section indicator, the footer and
 * the scroll-progress observer. Before this existed the navigation carried its
 * own copy of the ids and drifted out of sync with the document — "Platform"
 * pointed at `#platform`, which no section has ever had.
 */

export type SectionId =
  | 'hero'
  | 'journey'
  | 'innovation'
  | 'technology'
  | 'capabilities'
  | 'research'
  | 'impact'
  | 'cta'

/** Every section in document order. */
export const SECTION_IDS: readonly SectionId[] = [
  'hero',
  'journey',
  'innovation',
  'technology',
  'capabilities',
  'research',
  'impact',
  'cta',
]

export interface NavItem {
  label: string
  /** The section this entry navigates to — always a real element id. */
  target: SectionId
  /**
   * Sections that light this entry up. Platform covers Technology *and* the
   * Journey that leads into it: a reader three screens deep in the biological
   * sequence is inside the platform story, and an indicator that stays dark
   * for a third of the page reads as broken rather than as restrained.
   */
  covers: readonly SectionId[]
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Platform', target: 'technology', covers: ['journey', 'technology'] },
  { label: 'Research', target: 'research', covers: ['research'] },
  { label: 'Capabilities', target: 'capabilities', covers: ['capabilities'] },
  { label: 'Impact', target: 'impact', covers: ['impact', 'cta'] },
]

/** The primary action in the header and the mobile menu. */
export const NAV_PRIMARY = { label: 'Explore', target: 'technology' as SectionId }

/**
 * The site footer's link list (§55).
 *
 * Deliberately its own list rather than a reuse of NAV_ITEMS: the header shows
 * four entries because a bar has room for four, while the footer names the four
 * *subjects* of the site and "Platform" there means Technology alone, not the
 * Journey that leads into it. Both are typed against the same SectionId, so
 * neither can point at a section the document does not have.
 */
export const FOOTER_LINKS: readonly { label: string; target: SectionId }[] = [
  { label: 'Platform', target: 'technology' },
  { label: 'Research', target: 'research' },
  { label: 'Capabilities', target: 'capabilities' },
  { label: 'Impact', target: 'impact' },
]
