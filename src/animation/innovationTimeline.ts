import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollProgress } from '@/store/progressRef'
import {
  coverScale as apertureCoverScale,
  seedScale as apertureSeedScale,
} from '@/sections/Innovation/aperture.geometry'

gsap.registerPlugin(ScrollTrigger)

// ── Journey → Innovation handoff ───────────────────────────────────────────

interface HandoffEls {
  journey: HTMLElement
  aperture: HTMLElement
  disc: HTMLElement
  /** vh of scroll the handoff occupies — must match the Journey's extra height */
  handoffVh: number
}

/**
 * Horizontal origin of the aperture, read back from the stylesheet so the
 * breakpoint that moves it off centre is defined in exactly one place.
 */
function originX(aperture: HTMLElement) {
  const declared = parseFloat(
    getComputedStyle(aperture).getPropertyValue('--aperture-x'),
  )
  return Number.isFinite(declared) ? declared / 100 : 0.5
}

/**
 * The aperture that carries the eye from the Journey into Innovation.
 *
 * Runs over the scroll tail reserved by HANDOFF_VH, during which the Journey
 * stage is still stuck to the top of the viewport and its story has already
 * resolved. A Bone disc is seeded over the molecular candidate and opens
 * outward until it owns the screen.
 *
 * Everything is a pure function of the trigger's progress, so scrubbing back up
 * closes the aperture again and hands the candidate back intact.
 */
export function buildHandoffTimeline(els: HandoffEls, reduced: boolean) {
  if (reduced) return

  const { journey, aperture, disc, handoffVh } = els

  const setHandoff = (v: number) => {
    scrollProgress.handoff = v
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: journey,
      // `bottom bottom+=X` resolves X pixels *earlier* than the section's own
      // bottom, so this window is exactly the tail the Journey reserved.
      start: () => `bottom bottom+=${(window.innerHeight * handoffVh) / 100}`,
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => setHandoff(self.progress),
      // scrub settles asynchronously, so the endpoints are clamped explicitly
      // rather than left at whatever the last frame happened to read.
      onLeave: () => setHandoff(1),
      onLeaveBack: () => setHandoff(0),
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(aperture, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0)

  tl.fromTo(
    disc,
    { scale: () => apertureSeedScale(window.innerWidth, window.innerHeight) },
    {
      scale: () =>
        apertureCoverScale(window.innerWidth, window.innerHeight, originX(aperture)),
      // Finishes at 0.82 rather than 1: the last stretch is deliberate slack so
      // the screen is already solid Bone before the sticky stage releases, even
      // with scrub lag on a fast flick.
      duration: 0.72,
      ease: 'power1.in',
    },
    0.1,
  )

  tl.set({}, {}, 1)

  return tl
}

// ── Innovation section ─────────────────────────────────────────────────────

export interface InnovationRefs {
  section: React.RefObject<HTMLElement | null>
  header: React.RefObject<HTMLDivElement | null>
  meta: React.RefObject<HTMLDivElement | null>
  headlineLines: React.RefObject<(HTMLSpanElement | null)[]>
  copy: React.RefObject<HTMLDivElement | null>
  frame: React.RefObject<HTMLDivElement | null>
  reveal: React.RefObject<HTMLDivElement | null>
  annotations: React.RefObject<HTMLDivElement | null>
  principleRows: React.RefObject<(HTMLDivElement | null)[]>
  scaleStages: React.RefObject<(HTMLDivElement | null)[]>
}

/**
 * Innovation's entrance and scroll behaviour.
 *
 * One primary reveal per element and nothing repeats: the headline rises out of
 * its clip boxes, the copy settles, and the microscopy frame opens from a single
 * biological region outward. ACCEPTANCE_CRITERIA §27 fails a section that uses
 * the same fade-up on everything.
 *
 * Nothing here sets a resting style — every animation is a `fromTo` off the
 * element's natural state, so if this never runs (reduced motion, no JS) the
 * section is already in its finished form.
 */
export function buildInnovationTimeline(refs: InnovationRefs, reduced: boolean) {
  if (reduced) return

  const section = refs.section.current
  const header = refs.header.current
  if (!section || !header) return

  // The headline renders a different number of lines above and below 768px, so
  // a stale entry can survive a breakpoint change — hence isConnected, not
  // merely a null check.
  const lines = (refs.headlineLines.current ?? []).filter(
    (el): el is HTMLSpanElement => !!el?.isConnected,
  )

  // ── Header: metadata, then the headline line by line ────────────────────
  const headerTl = gsap.timeline({
    scrollTrigger: { trigger: header, start: 'top 85%', once: true },
  })

  if (refs.meta.current) {
    headerTl.fromTo(refs.meta.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
  }

  if (lines.length) {
    headerTl.fromTo(
      lines,
      { yPercent: 105 },
      { yPercent: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
      0.08,
    )
  }

  if (refs.copy.current) {
    headerTl.fromTo(
      refs.copy.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
      0.5,
    )
  }

  // ── Microscopy: one biological region widens into the whole field ───────
  const frame = refs.frame.current
  const reveal = refs.reveal.current

  // Both the frame and the inspection lens contain a copy of the image subtree.
  // Selecting by class animates every copy with one tween, which is what keeps
  // the magnified view registered against the frame it sits in.
  const images = frame ? frame.querySelectorAll('.innovation-visual-img') : []
  const parallaxLayers = frame ? frame.querySelectorAll('.innovation-visual-parallax') : []

  if (frame && reveal && images.length) {
    const revealTl = gsap.timeline({
      scrollTrigger: { trigger: frame, start: 'top 82%', once: true },
    })

    revealTl
      .fromTo(
        reveal,
        // Centred on the brightly expressing cell near the middle of the
        // frame, so the reveal starts on the one region worth looking at.
        { clipPath: 'circle(6% at 46% 51%)' },
        { clipPath: 'circle(78% at 46% 51%)', duration: 1.3, ease: 'power2.inOut' },
        0,
      )
      // Pulling back from magnification is what makes it read as "look closer"
      // rather than an image sliding in.
      .fromTo(images, { scale: 1.16 }, { scale: 1, duration: 1.45, ease: 'power2.out' }, 0)

    if (refs.annotations.current) {
      revealTl.fromTo(
        refs.annotations.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7 },
        0.85,
      )
    }
  }

  // ── Principles: divider draws, number and text follow ───────────────────
  const rows = (refs.principleRows.current ?? []).filter(Boolean) as HTMLDivElement[]
  if (rows.length) {
    const rules = rows.map((r) => r.querySelector('.innovation-principle-rule'))
    const texts = rows.map((r) => r.querySelector('.innovation-principle-text'))
    const numbers = rows.map((r) => r.querySelector('.innovation-principle-index'))

    gsap
      .timeline({ scrollTrigger: { trigger: rows[0], start: 'top 88%', once: true } })
      .fromTo(
        rules,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
        0,
      )
      .fromTo(numbers, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.12 }, 0.1)
      .fromTo(
        texts,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' },
        0.14,
      )
  }

  // ── Scroll-linked: image parallax and the active biological scale ───────
  if (parallaxLayers.length) {
    gsap.fromTo(
      parallaxLayers,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: frame ?? section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      },
    )
  }

  // ── Exit: the instrumentation recedes before Technology arrives ─────────
  // The specimen is already drifting upward through the parallax above; letting
  // the readouts fade with it is what keeps the section from ending on a hard
  // stop, without a dedicated exit animation (prompt §29). The headline and the
  // copy are untouched — they stay legible right to the section boundary.
  if (refs.annotations.current) {
    gsap.to(refs.annotations.current, {
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        // Only once the section's own bottom has passed the fold, so nothing
        // dims while the specimen is still the thing being looked at. Innovation
        // is currently the last section, so this window is only partly
        // reachable until Technology is mounted below it.
        start: 'bottom bottom',
        end: 'bottom top+=40%',
        scrub: 0.8,
      },
    })
  }

  const stages = (refs.scaleStages.current ?? []).filter(Boolean) as HTMLDivElement[]
  if (stages.length) {
    let active = -1
    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const next = Math.min(stages.length - 1, Math.floor(self.progress * stages.length))
        if (next === active) return
        active = next
        // Class toggling rather than React state: this fires on scroll, and
        // ACCEPTANCE_CRITERIA §20 rules out re-rendering during animation.
        stages.forEach((el, i) => el.classList.toggle('is-active', i === next))
      },
    })
  }

  return headerTl
}

/**
 * Surface bookkeeping for the light section.
 *
 * Two things have to change the moment Innovation owns the viewport: the fixed
 * header, whose Bone type is invisible on a Bone background, and the persistent
 * canvas, which has nothing left to draw. Both are driven from one trigger so
 * they can never disagree.
 */
export function buildSurfaceSwitch(
  section: HTMLElement,
  setCanvasActive: (active: boolean) => void,
  reduced: boolean,
) {
  const setSurface = (light: boolean) => {
    document.documentElement.dataset.surface = light ? 'light' : 'dark'
  }

  const header = ScrollTrigger.create({
    trigger: section,
    // Bone floods the strip the fixed header sits in around two thirds of the
    // way through the aperture, well before this section's own top edge
    // arrives — so with motion the switch has to lead the section by most of a
    // viewport. Without an aperture the two surfaces simply meet at the top.
    start: reduced ? 'top top' : 'top bottom+=22%',
    end: 'bottom bottom',
    onEnter: () => setSurface(true),
    onEnterBack: () => setSurface(true),
    onLeaveBack: () => setSurface(false),
  })

  // Held back to the point where the Journey stage has left the viewport
  // outright. Stopping the render loop while any part of it could still be on
  // screen would freeze the handoff mid-motion for the sake of a few frames.
  const canvas = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onEnter: () => setCanvasActive(false),
    onEnterBack: () => setCanvasActive(false),
    onLeaveBack: () => setCanvasActive(true),
  })

  return () => {
    header.kill()
    canvas.kill()
    setSurface(false)
    setCanvasActive(true)
  }
}
