import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CTA_ENTRANCE } from '@/sections/Cta/cta.constants'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export interface CtaRefs {
  section: React.RefObject<HTMLElement | null>
  label: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  lead: React.RefObject<HTMLParagraphElement | null>
  actions: React.RefObject<HTMLDivElement | null>
  brand: React.RefObject<HTMLDivElement | null>
  glow: React.RefObject<HTMLDivElement | null>
  /** The drawn cell — flowing presentation only */
  cell: React.RefObject<HTMLDivElement | null>
}

// ── Formation (§6, §7) ──────────────────────────────────────────────────────

/**
 * The closing transformation, scrubbed across one viewport of scroll.
 *
 * `start: 'top bottom'` is not an approximate choice. Impact's story trigger
 * ends at `bottom bottom`, and this section's top *is* Impact's bottom, so the
 * two are the same scroll position to the pixel: `impact` reaches 1 on exactly
 * the frame `ctaForm` leaves 0. That is what lets the collapsed target and the
 * cell it becomes be one continuous object rather than a cross-fade, and it is
 * why §6's "no hard section cut" costs no extra scroll budget at all.
 *
 * The window it runs through is the 100vh in which Impact's sticky stage
 * scrolls away — the last of the scientific frame physically leaving while the
 * biological one resolves behind it.
 */
function buildFormation(refs: CtaRefs) {
  const section = refs.section.current
  if (!section) return

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'top top',
    scrub: 0.55,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress.ctaForm = self.progress
    },
    // Scrub settles asynchronously, so both ends are clamped explicitly rather
    // than left wherever the last frame happened to read — the WebGL gate is
    // an equality against these and has to be exact in both directions.
    onLeave: () => {
      scrollProgress.ctaForm = 1
    },
    onLeaveBack: () => {
      scrollProgress.ctaForm = 0
    },
  })

  // The environment arrives with the cell: one soft Bio Green field at 5–8%
  // (§35), and nothing else. There is no grid to fade in here — §37 asks for
  // the absence of technical structure, and absence is not something that can
  // be animated into place.
  if (refs.glow.current) {
    gsap.fromTo(
      refs.glow.current,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top+=40%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    )
  }

  // Departure: once the stage is released the footer rises over it, and the
  // cell — drawn into a *fixed* canvas — has to travel with the page or it
  // hangs in the middle of the viewport over the footer.
  ScrollTrigger.create({
    trigger: section,
    start: 'bottom bottom',
    end: 'bottom top',
    scrub: 0.3,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress.ctaDepart = self.progress
    },
    onLeaveBack: () => {
      scrollProgress.ctaDepart = 0
    },
  })
}

// ── Content (§26, §27) ──────────────────────────────────────────────────────

/**
 * Label, headline, copy, actions and brand lockup.
 *
 * Played once as a timeline rather than scrubbed, for the reason every other
 * headline on this page is: a closing statement that reverses when the reader
 * scrolls back two lines is a closing statement that never settles. The delays
 * are §26's schedule — the visual is given the better part of a second to
 * resolve before the first word appears.
 *
 * §27 rules out the generic full-heading fade-up, so each line rises out of its
 * own mask with a short blur behind it.
 */
function buildContent(refs: CtaRefs) {
  const section = refs.section.current
  if (!section) return

  const lines = (refs.headlineLines.current ?? []).filter(Boolean) as HTMLElement[]

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      // Roughly two thirds of a viewport in: the cell's membrane has resolved
      // by here and the closing column is fully on screen, so the line masks
      // reveal into a settled frame rather than at the very bottom edge of it.
      start: 'top bottom-=64%',
      once: true,
    },
  })

  if (refs.label.current) {
    tl.fromTo(
      refs.label.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.7, ease: 'power2.out' },
      CTA_ENTRANCE.label,
    )
  }

  if (lines.length) {
    tl.fromTo(
      lines,
      { yPercent: 105, filter: 'blur(3px)' },
      {
        yPercent: 0,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: CTA_ENTRANCE.headlineStagger,
        ease: 'power3.out',
      },
      CTA_ENTRANCE.headline,
    )
  }

  const fade = (el: HTMLElement | null, at: number) => {
    if (!el) return
    tl.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
      at,
    )
  }

  fade(refs.lead.current, CTA_ENTRANCE.lead)
  fade(refs.actions.current, CTA_ENTRANCE.actions)
  fade(refs.brand.current, CTA_ENTRANCE.brand)
}

// ── The drawn cell (§45, §50) ───────────────────────────────────────────────

/**
 * The flowing presentation's cell arrival.
 *
 * Below 769px there is no shared canvas to hand off to, so the cell is drawn in
 * SVG from the same population and simply arrives. One entrance, matching the
 * vocabulary the rest of the page's non-pinned content uses.
 */
function buildDrawnCell(refs: CtaRefs) {
  const cell = refs.cell.current
  if (!cell) return

  gsap.fromTo(
    cell,
    { opacity: 0, scale: 0.9 },
    {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: cell, start: 'top 88%', once: true },
    },
  )
}

// ── Surface bookkeeping (§52, §53) ──────────────────────────────────────────

/**
 * Arming, and the page's last resource cleanup.
 *
 * One trigger does both, and it has to: the moment the closing cell is needed
 * is the moment Impact's network is not, and driving them from two places is
 * how a reversed scroll ends up with either both allocated or neither.
 *
 * `setImpactStage(null)` unmounts the Impact scene entirely — ~2,600 signal
 * points, ~210 nodes, three index buffers and five shader programs, all
 * disposed by that component's own cleanup. Scrolling back up rebuilds them
 * from the deterministic generator, so nothing is lost.
 */
export function buildCtaSurface(
  section: HTMLElement,
  setArmed: (armed: boolean) => void,
  setCanvasActive: (active: boolean) => void,
  releaseImpact: () => void,
  restoreImpact: () => void,
) {
  const arm = ScrollTrigger.create({
    trigger: section,
    // One viewport early, so the buffers exist well before the formation window
    // opens rather than being allocated inside it.
    start: 'top bottom+=100%',
    end: 'bottom top',
    onEnter: () => setArmed(true),
    onEnterBack: () => setArmed(true),
    onLeaveBack: () => setArmed(false),
  })

  // Later than the arming trigger and separate from it: Impact is still drawing
  // its own network while section 08 is being armed, and releasing it there
  // would take the network off screen mid-collapse. This fires where Impact's
  // scene has already gone dark — its own visibility gate closes at progress 1,
  // which is this trigger's start.
  const release = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onEnter: releaseImpact,
    onLeaveBack: restoreImpact,
  })

  // The canvas has been on since Impact and stays on — but stated here rather
  // than inherited, because a reader arriving on #cta directly never crossed
  // Impact's trigger and would get a stopped render loop and no cell at all.
  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(true),
    onEnterBack: () => setCanvasActive(true),
  })

  return () => {
    arm.kill()
    release.kill()
    canvas.kill()
    setArmed(false)
    scrollProgress.ctaForm = 0
    scrollProgress.ctaDepart = 0
  }
}

/**
 * Everything the closing section animates.
 *
 * Under reduced motion nothing is built at all — §50 asks for the final cell
 * rendered immediately and a short opacity reveal for the content, which is the
 * markup's natural state plus one CSS transition. A section whose entire
 * subject is resolution is the last place to make the reader scroll to reach it.
 */
export function buildCtaTimeline(refs: CtaRefs, opts: { reduced: boolean; flowing: boolean }) {
  if (opts.reduced) return

  buildContent(refs)

  if (opts.flowing) buildDrawnCell(refs)
  else buildFormation(refs)
}

// ── The primary action (§18) ────────────────────────────────────────────────

/**
 * Magnetism, the arrow and the moving highlight.
 *
 * §18 caps the pull at 4–6px and the scale at 1.015, and rules out pulse loops
 * — which is the whole difference between a CTA that feels tactile and one that
 * demands attention. The highlight is a CSS custom property rather than a
 * second animated element: one paint, and it follows the cursor exactly.
 *
 * Returns a no-op teardown under reduced motion or on a coarse pointer, so the
 * caller never has to branch.
 */
export function initClosingCta(el: HTMLElement | null, enabled: boolean) {
  if (!el || !enabled) return () => {}

  const onMove = (e: MouseEvent) => {
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    gsap.to(el, {
      x: (nx - 0.5) * 10,
      y: (ny - 0.5) * 6,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    })
    el.style.setProperty('--cta-hx', `${nx * 100}%`)
    el.style.setProperty('--cta-hy', `${ny * 100}%`)
  }

  const onLeave = () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' })
    el.style.setProperty('--cta-hx', '50%')
    el.style.setProperty('--cta-hy', '50%')
  }

  el.addEventListener('mousemove', onMove)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mousemove', onMove)
    el.removeEventListener('mouseleave', onLeave)
    gsap.set(el, { x: 0, y: 0 })
  }
}
