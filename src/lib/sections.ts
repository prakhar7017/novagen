export type SectionId =
  | 'hero'
  | 'journey'
  | 'innovation'
  | 'technology'
  | 'capabilities'
  | 'research'
  | 'impact'
  | 'cta'

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
  target: SectionId
  covers: readonly SectionId[]
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Platform', target: 'technology', covers: ['journey', 'technology'] },
  { label: 'Research', target: 'research', covers: ['research'] },
  { label: 'Capabilities', target: 'capabilities', covers: ['capabilities'] },
  { label: 'Impact', target: 'impact', covers: ['impact', 'cta'] },
]

export const NAV_PRIMARY = { label: 'Explore', target: 'technology' as SectionId }

export const FOOTER_LINKS: readonly { label: string; target: SectionId }[] = [
  { label: 'Platform', target: 'technology' },
  { label: 'Research', target: 'research' },
  { label: 'Capabilities', target: 'capabilities' },
  { label: 'Impact', target: 'impact' },
]
