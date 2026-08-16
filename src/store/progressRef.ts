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
  /**
   * 0–1 through the Innovation → Technology ingress, where the microscopy plate
   * expands and the Bone surface gives way to the platform environment. Drives
   * the WebGL gate: the Technology scene draws nothing until this leaves 0.
   */
  techIngress: 0,
  /** 0–1 through the Technology pipeline: sample → map → interpret → predict → validate */
  technology: 0,
  /**
   * 0–1 through the Research → Impact handoff, where the Bone surface dims and
   * the detaching signal points become the Impact network. Drives the WebGL
   * gate: the impact scene draws nothing until this leaves 0.
   */
  impactIngress: 0,
  /** 0–1 through Impact: 14.8M scale → 72x prioritization → 91% validation */
  impact: 0,
  /**
   * 0–1 through Impact's closing collapse, where every scientific detail
   * reduces toward the single soft point the Final CTA grows out of (§53).
   *
   * Derived from `impact` rather than from its own trigger, and kept here so
   * section 08 can read the state this section ends on instead of re-deriving
   * it — the seed has to be in the same place both sections agree on.
   */
  impactExit: 0,
  /**
   * 0–1 through the Final CTA's formation, run across the 100vh in which
   * Impact's stage scrolls away (§6).
   *
   * Its zero is the exact scroll position at which `impact` reaches 1 — the
   * Impact section's bottom meeting the viewport bottom is the CTA section's
   * top meeting it — so the collapsed target and the biological cell it becomes
   * are one continuous object rather than two that overlap.
   */
  ctaForm: 0,
  /**
   * 0–1 as the closing stage is released and the footer rises over it.
   *
   * The cell is drawn into a *fixed* canvas, so without this it would sit at
   * 46% of the viewport forever and float over the footer. Scaled by viewport
   * height it moves the cell exactly as if it had been painted into the stage.
   */
  ctaDepart: 0,
}

// Dev-only handle so the verification scripts can assert on the same numbers
// the shaders read, rather than inferring them from pixels.
if (import.meta.env.DEV) {
  ;(window as unknown as { __scrollProgress?: typeof scrollProgress }).__scrollProgress =
    scrollProgress
}
