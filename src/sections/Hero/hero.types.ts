export interface HeroRefs {
  section:       React.RefObject<HTMLElement | null>
  nav:           React.RefObject<HTMLElement | null>
  eyebrow:       React.RefObject<HTMLSpanElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  body:          React.RefObject<HTMLParagraphElement | null>
  ctaWrap:       React.RefObject<HTMLDivElement | null>
  primaryCta:    React.RefObject<HTMLAnchorElement | null>
  meta:          React.RefObject<HTMLDivElement | null>
  /* Three nested elements carry the organism's three independent motions.
     They are kept separate because GSAP writes a single `transform` per
     element: sharing one would mean the last animation to render each frame
     silently overwrites the others — which is how the scroll exit's scale-up
     ended up cancelled by the idle breath. */
  /** Scroll exit — scale, x, opacity. Mirrored by HERO_ORGANISM. */
  breathWrap:    React.RefObject<HTMLDivElement | null>
  /** Idle breathing — slow scale and y drift */
  breathInner:   React.RefObject<HTMLDivElement | null>
  /** Cursor parallax — x, y, rotation */
  organism:      React.RefObject<HTMLImageElement | null>
}
