import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { HeroRefs } from '@/sections/Hero/hero.types'
import { useExperienceStore } from '@/store/experienceStore'

gsap.registerPlugin(ScrollTrigger)

// ── Entrance ────────────────────────────────────────────────────────────────
export function buildEntranceTimeline(refs: HeroRefs, reduced: boolean) {
  const { nav, eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs

  if (reduced) {
    // Instant reveal for reduced-motion users
    gsap.set(
      [nav.current, eyebrow.current, ...(headlineLines.current ?? []), body.current, ctaWrap.current, meta.current, breathWrap.current],
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

  // Nav slides down subtly
  tl.fromTo(
    nav.current,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.6 },
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

  const { breathWrap, organism } = refs
  const ctx = gsap.context(() => {
    // Slow scale breath — different duration to breathing y so they never sync
    gsap.to(breathWrap.current, {
      scale: 1.008, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true,
    })
    gsap.to(breathWrap.current, {
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
export function buildScrollExit(refs: HeroRefs, reduced: boolean) {
  const { section, eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs
  const setProgress = useExperienceStore.getState().setHeroExitProgress

  const allCopy = [eyebrow.current, ...(headlineLines.current ?? []).filter(Boolean), body.current, ctaWrap.current, meta.current]
  const lines = headlineLines.current?.filter(Boolean) ?? []

  if (reduced) {
    // Simple fade for reduced-motion
    ScrollTrigger.create({
      trigger: section.current,
      start: 'top top',
      end: '+=100%',
      scrub: true,
      pin: true,
      onUpdate: (self) => {
        setProgress(self.progress)
        gsap.set(allCopy, { opacity: 1 - self.progress * 1.5 })
      },
    })
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
      onUpdate: (self) => setProgress(self.progress),
    },
    defaults: { ease: 'none' },
  })

  // 0.20 – headline drifts subtly up
  tl.to(lines, { yPercent: -6 }, 0.20)

  // 0.45 – body fades
  tl.to(body.current, { opacity: 0 }, 0.45)

  // 0.60 – CTAs fade
  tl.to(ctaWrap.current, { opacity: 0 }, 0.60)

  // 0.70 – headline opacity reduces
  tl.to(lines, { opacity: 0 }, 0.70)
  tl.to(eyebrow.current, { opacity: 0 }, 0.65)
  tl.to(meta.current, { opacity: 0 }, 0.72)

  // Organism grows and moves toward center throughout — survives copy
  // Starts scaling at 0.30, organism stays visible at 1.00
  tl.fromTo(
    breathWrap.current,
    { scale: 1, x: 0 },
    { scale: 1.14, x: -55 },
    0.30,
  )
}
