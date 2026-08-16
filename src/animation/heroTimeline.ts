import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { HeroRefs } from '@/sections/Hero/hero.types'
import { HERO_ORGANISM } from '@/sections/Hero/heroGeometry'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

// ── Entrance ────────────────────────────────────────────────────────────────
export function buildEntranceTimeline(refs: HeroRefs, reduced: boolean) {
  const { eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs

  if (reduced) {
    // Instant reveal for reduced-motion users
    gsap.set(
      [eyebrow.current, ...(headlineLines.current ?? []), body.current, ctaWrap.current, meta.current, breathWrap.current],
      { opacity: 1, y: 0, x: 0, filter: 'none' },
    )
    return null
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // Organism emerges from darkness
  tl.fromTo(
    breathWrap.current,
    { opacity: 0, scale: 1.06, x: 20, filter: 'blur(10px)' },
    { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: 1.0 },
    0.15,
  )

  // Eyebrow
  tl.fromTo(
    eyebrow.current,
    { opacity: 0, letterSpacing: '0.22em' },
    { opacity: 1, letterSpacing: '0.12em', duration: 0.55 },
    0.25,
  )

  // Headline: line-by-line overflow clip reveal
  const lines = headlineLines.current?.filter(Boolean) ?? []
  tl.fromTo(
    lines,
    { yPercent: 110, opacity: 0, filter: 'blur(4px)' },
    {
      yPercent: 0, opacity: 1, filter: 'blur(0px)',
      duration: 0.7, stagger: 0.12,
    },
    0.35,
  )

  // Body copy
  tl.fromTo(
    body.current,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.5 },
    0.70,
  )

  // CTAs
  tl.fromTo(
    ctaWrap.current,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.45 },
    0.85,
  )

  // Metadata
  tl.fromTo(
    meta.current,
    { opacity: 0 },
    { opacity: 1, duration: 0.4 },
    1.00,
  )

  return tl
}

// ── Idle breathing (starts after entrance) ───────────────────────────────────
export function startIdleBreathing(refs: HeroRefs, reduced: boolean) {
  if (reduced) return () => {}

  // Deliberately `breathInner`, not `breathWrap`: the wrapper's transform
  // belongs to the scroll exit, and two tweens on one transform means the
  // later render wins outright rather than the two combining.
  const { breathInner, organism } = refs
  const ctx = gsap.context(() => {
    // Slow scale breath — different duration to breathing y so they never sync
    gsap.to(breathInner.current, {
      scale: 1.008, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true,
    })
    gsap.to(breathInner.current, {
      y: 4, duration: 11, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5,
    })
    gsap.to(organism.current, {
      rotation: 0.4, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3,
    })
  })
  return () => ctx.revert()
}

// ── Cursor parallax ──────────────────────────────────────────────────────────
export function initCursorParallax(refs: HeroRefs, reduced: boolean) {
  if (reduced || !refs.organism.current) return () => {}

  const xTo = gsap.quickTo(refs.organism.current, 'x', { duration: 0.65, ease: 'power2.out' })
  const yTo = gsap.quickTo(refs.organism.current, 'y', { duration: 0.65, ease: 'power2.out' })
  const rTo = gsap.quickTo(refs.organism.current, 'rotation', { duration: 0.85, ease: 'power2.out' })

  const onMove = (e: MouseEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5   // -0.5 → 0.5
    const ny = e.clientY / window.innerHeight - 0.5
    xTo(nx * 16)      // ±8px
    yTo(ny * 10)      // ±5px
    rTo(nx * 0.6)     // ±0.3deg
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  return () => window.removeEventListener('mousemove', onMove)
}

// ── CTA magnetic hover ───────────────────────────────────────────────────────
export function initCtaMagnet(ctaEl: HTMLElement | null, reduced: boolean) {
  if (reduced || !ctaEl) return () => {}

  const onMove = (e: MouseEvent) => {
    const r = ctaEl.getBoundingClientRect()
    const dx = ((e.clientX - r.left) / r.width - 0.5) * 10  // ±5px
    const dy = ((e.clientY - r.top) / r.height - 0.5) * 6
    gsap.to(ctaEl, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' })
  }
  const onLeave = () => gsap.to(ctaEl, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' })

  ctaEl.addEventListener('mousemove', onMove)
  ctaEl.addEventListener('mouseleave', onLeave)
  return () => { ctaEl.removeEventListener('mousemove', onMove); ctaEl.removeEventListener('mouseleave', onLeave) }
}

// ── Hero scroll exit ─────────────────────────────────────────────────────────
/**
 * Must be called only once the entrance timeline has finished.
 *
 * Every tween below is a `fromTo` stating the Hero's settled values, and
 * `fromTo` writes those values immediately on creation. That is exactly what
 * makes the exit reversible — GSAP re-applies them whenever the playhead sits
 * at or before a tween's start, so scrolling back to the top restores the Hero
 * — but it also means calling this while the entrance is still running would
 * overwrite the entrance mid-reveal. Building it on the entrance's completion
 * satisfies both: the values written are the ones already on screen.
 */
export function buildScrollExit(refs: HeroRefs, reduced: boolean) {
  const { section, eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs

  const lines = headlineLines.current?.filter(Boolean) ?? []

  if (reduced) {
    // Reduced motion: no pin, no scrub — the Hero simply scrolls away.
    scrollProgress.hero = 0
    return
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section.current,
      start: 'top top',
      end: '+=100%',
      scrub: 1.4,
      pin: true,
      pinSpacing: true,
      // This pin adds a viewport of spacing that shifts every later section's
      // start, and it is created after them, so it must refresh first.
      refreshPriority: 1,
      // Written to a plain ref, not React state: this fires on every scroll
      // frame and the WebGL organism reads it inside useFrame.
      onUpdate: (self) => {
        scrollProgress.hero = self.progress
      },
    },
    defaults: { ease: 'none' },
  })

  // 0.20 – headline drifts subtly up
  tl.fromTo(lines, { yPercent: 0 }, { yPercent: -6 }, 0.20)

  // 0.45 – body fades
  tl.fromTo(body.current, { opacity: 1 }, { opacity: 0 }, 0.45)

  // 0.60 – CTAs fade
  tl.fromTo(ctaWrap.current, { opacity: 1 }, { opacity: 0 }, 0.60)

  // 0.70 – headline opacity reduces
  tl.fromTo(lines, { opacity: 1 }, { opacity: 0 }, 0.70)
  tl.fromTo(eyebrow.current, { opacity: 1 }, { opacity: 0 }, 0.65)
  tl.fromTo(meta.current, { opacity: 1 }, { opacity: 0 }, 0.72)

  // Organism grows and moves toward center throughout — survives the copy.
  // These end values are mirrored by HERO_ORGANISM.exitScale / exitX so the
  // Journey's WebGL organism can start from the identical rectangle.
  tl.fromTo(
    breathWrap.current,
    { scale: 1, x: 0 },
    { scale: HERO_ORGANISM.exitScale, x: HERO_ORGANISM.exitX },
    0.30,
  )

  // Handoff: the DOM organism dissolves out over the last 14% of the Hero pin
  // while DissolveStage fades its textured plane in across the same window.
  // Both occupy the same screen rect, so the swap is invisible and the
  // organism appears to survive the section boundary untouched.
  tl.fromTo(breathWrap.current, { opacity: 1 }, { opacity: 0, duration: 0.14 }, 0.86)

  // Sections after the Hero were measured before this pin existed, so their
  // start positions are a viewport too early until everything re-measures.
  ScrollTrigger.refresh()

  // onUpdate does not fire on creation, so seed the channel the WebGL organism
  // reads — otherwise a visitor who scrolls during the entrance sits at a real
  // scroll position with a stale progress of 0 until they next move.
  if (tl.scrollTrigger) scrollProgress.hero = tl.scrollTrigger.progress

  return tl
}
