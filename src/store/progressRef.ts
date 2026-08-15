/**
 * Per-frame scroll channel between GSAP (writer) and R3F (reader).
 *
 * ScrollTrigger updates these values on every scroll frame. Routing them
 * through React state — or through Zustand's setState — would re-render the
 * tree 60x/second, which PAGE_STRUCTURE §17 and ACCEPTANCE_CRITERIA §20
 * explicitly forbid. A plain mutable singleton read inside useFrame costs
 * nothing and stays perfectly in sync with the scrubbed timeline.
 *
 * Discrete, low-frequency state (device tier, current stage index) belongs in
 * the Zustand store instead — see experienceStore.ts.
 */
export const scrollProgress = {
  /** 0–1 through the Hero's pinned exit tunnel */
  hero: 0,
  /** 0–1 through the entire Biological Journey */
  journey: 0,
  /**
   * 0–1 through the Journey → Innovation handoff, which occupies a tail of
   * scroll *after* `journey` has already reached 1. Kept separate so the story
   * timeline's mapping is untouched by the transition.
   */
  handoff: 0,
}

// Dev-only handle so the verification scripts can assert on the same numbers
// the shaders read, rather than inferring them from pixels.
if (import.meta.env.DEV) {
  ;(window as unknown as { __scrollProgress?: typeof scrollProgress }).__scrollProgress =
    scrollProgress
}
