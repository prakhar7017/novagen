export interface HeroRefs {
  section:       React.RefObject<HTMLElement | null>
  nav:           React.RefObject<HTMLElement | null>
  eyebrow:       React.RefObject<HTMLSpanElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  body:          React.RefObject<HTMLParagraphElement | null>
  ctaWrap:       React.RefObject<HTMLDivElement | null>
  primaryCta:    React.RefObject<HTMLAnchorElement | null>
  meta:          React.RefObject<HTMLDivElement | null>
  breathWrap:    React.RefObject<HTMLDivElement | null>
  organism:      React.RefObject<HTMLImageElement | null>
}
