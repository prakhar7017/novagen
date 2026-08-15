import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CAPABILITIES } from '@/sections/Capabilities/capabilities.constants'

gsap.registerPlugin(ScrollTrigger)

export interface CapabilitiesRefs {
  section: React.RefObject<HTMLElement | null>
  signal: React.RefObject<HTMLDivElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  grid: React.RefObject<HTMLDivElement | null>
  modules: React.RefObject<(HTMLElement | null)[]>
  exit: React.RefObject<HTMLDivElement | null>
}

/**
 * The Technology → Capabilities handoff (§5, §53).
 *
 * Symbolic rather than literal: the validated candidate is already drawing back
 * toward the upper right as Technology ends, and what arrives here is the
 * signal it left behind — a soft green pulse over the first module, which
 * settles as the Spatial visual comes to life. No dissolve, no wipe, nothing
 * covering the viewport. This is the calmest transition on the page by design;
 * three fullscreen handoffs in a row would be a tic.
 */
function buildHandoff(refs: CapabilitiesRefs) {
  const section = refs.section.current
  const signal = refs.signal.current
  if (!section || !signal) return

  gsap
    .timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top 18%',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'none' },
    })
    // Arrives small and high on the right, where the candidate went, then
    // opens and settles down-left across the headline as the section lands —
    // and is gone before the grid is legible. A handoff, not a light.
    .fromTo(
      signal,
      { opacity: 0, xPercent: 30, yPercent: -34, scale: 0.32 },
      {
        opacity: 1,
        xPercent: -6,
        yPercent: 8,
        scale: 1,
        duration: 0.58,
        ease: 'power2.out',
      },
      0,
    )
    .to(signal, { opacity: 0, duration: 0.42, ease: 'power1.in' }, 0.58)
}

/**
 * The section entrance (§31).
 *
 * Label, headline, copy — once, on arrival, and nothing else. The grid has its
 * own scrubbed reveal below, because §33 asks for the modules to arrive as the
 * reader scrolls rather than all at once when the section's top edge crosses a
 * line.
 */
function buildEntrance(refs: CapabilitiesRefs) {
  const section = refs.section.current
  if (!section) return

  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 76%', once: true },
  })

  if (refs.label.current) {
    tl.fromTo(refs.label.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0)
  }
  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.74, stagger: 0.11, ease: 'power3.out' },
      0.06,
    )
  }
  if (refs.lead.current) {
    tl.fromTo(
      refs.lead.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.32,
    )
  }
}

/**
 * The module reveal (§32, §33).
 *
 * One scrubbed timeline whose duration is pinned to exactly 1, so a tween
 * placed at 0.25 fires at exactly the progress the brief specifies. Each module
 * uncovers differently — from the bottom, from the right, drawn, swept — but
 * all four use the same duration, the same easing and the same 26px of travel,
 * which is what keeps four personalities inside one composition (§32).
 *
 * The clip is on the module, not on a wrapper, so nothing is scaled or moved
 * far enough to blur the microscopy underneath it.
 */
function buildReveal(refs: CapabilitiesRefs) {
  const grid = refs.grid.current
  if (!grid) return

  const modules = (refs.modules.current ?? []).filter(
    (el): el is HTMLElement => !!el?.isConnected,
  )
  if (!modules.length) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: grid,
      start: 'top 92%',
      end: 'top 22%',
      scrub: 0.65,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })

  const DUR = 0.2
  const from: Record<string, gsap.TweenVars> = {
    // Bottom — the tissue field rises into its own frame
    spatial: { clipPath: 'inset(100% 0% 0% 0%)', y: 26 },
    // Right — the structure arrives from the direction the candidate left in
    protein: { clipPath: 'inset(0% 0% 0% 100%)', y: 0 },
    // Drawn: the network's frame is described before it is filled
    ai: { clipPath: 'inset(0% 0% 0% 0%)', opacity: 0, y: 18 },
    // Swept, left to right, exactly as its own signals are read
    genomic: { clipPath: 'inset(0% 100% 0% 0%)', y: 0 },
  }

  CAPABILITIES.forEach((cap, i) => {
    const el = modules[i]
    if (!el) return
    tl.fromTo(
      el,
      { opacity: 0, ...from[cap.id] },
      {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: DUR,
        ease: 'power2.out',
      },
      cap.reveal,
    )
  })

  // Pins the timeline's duration to exactly 1: without this anchor the duration
  // is wherever the last tween happens to end, and every module would reveal at
  // some progress other than the one it was given.
  tl.set({}, {}, 1)
}

/**
 * The line toward 06 / Research (§54).
 *
 * The modules settle, the section's technical glow steps back, and a single
 * mono line names what comes next. Nothing here implements Research.
 */
function buildExit(refs: CapabilitiesRefs) {
  const exit = refs.exit.current
  if (!exit) return

  gsap.timeline({ scrollTrigger: { trigger: exit, start: 'top 88%', once: true } }).fromTo(
    exit,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
  )
}

/**
 * The canvas gate.
 *
 * Capabilities is opaque and there is no WebGL behind it, so the shared render
 * loop stops for the whole of this section exactly as it does for Innovation —
 * and starts again on the way back up, where Technology's platform is still
 * a pure function of scroll and resumes without a seam.
 *
 * Independent of reduced motion: the GPU has nothing to draw either way.
 */
export function buildCapabilitiesSurface(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
) {
  const gate = ScrollTrigger.create({
    trigger: section,
    // Held until the section's own top edge reaches the top of the viewport:
    // any earlier and Technology's candidate would be frozen mid-exit while
    // still on screen.
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(false),
    onEnterBack: () => setCanvasActive(false),
    onLeaveBack: () => setCanvasActive(true),
  })

  return () => {
    gate.kill()
    setCanvasActive(true)
  }
}

/**
 * Everything the section animates.
 *
 * Under reduced motion nothing is built at all, which leaves every module in
 * its natural, fully-revealed state — §47 asks for static scientific states,
 * not for a section that has to be scrolled past to become complete.
 */
export function buildCapabilitiesTimeline(refs: CapabilitiesRefs, reduced: boolean) {
  if (reduced) return
  buildHandoff(refs)
  buildEntrance(refs)
  buildReveal(refs)
  buildExit(refs)
}
