import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { HeroRefs } from '@/sections/Hero/hero.types'
import { HERO_ORGANISM } from '@/sections/Hero/heroGeometry'
import { scrollProgress } from '@/store/progressRef'

gsap.registerPlugin(ScrollTrigger)

export function buildEntranceTimeline(refs: HeroRefs, reduced: boolean) {
  const { eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs

  if (reduced) {
    gsap.set(
      [eyebrow.current, ...(headlineLines.current ?? []), body.current, ctaWrap.current, meta.current, breathWrap.current],
      { opacity: 1, y: 0, x: 0, filter: 'none' },
    )
    return null
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.fromTo(
    breathWrap.current,
    { opacity: 0, scale: 1.06, x: 20, filter: 'blur(10px)' },
    { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: 1.0 },
    0.15,
  )

  tl.fromTo(
    eyebrow.current,
    { opacity: 0, letterSpacing: '0.22em' },
    { opacity: 1, letterSpacing: '0.12em', duration: 0.55 },
    0.25,
  )

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

  tl.fromTo(
    body.current,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.5 },
    0.70,
  )

  tl.fromTo(
    ctaWrap.current,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.45 },
    0.85,
  )

  tl.fromTo(
    meta.current,
    { opacity: 0 },
    { opacity: 1, duration: 0.4 },
    1.00,
  )

  return tl
}

export function startIdleBreathing(refs: HeroRefs, reduced: boolean) {
  if (reduced) return () => {}

  const { breathInner, organism } = refs
  const ctx = gsap.context(() => {
    const idle = [
      gsap.to(breathInner.current, {
        scale: 1.008, duration: 9, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }),
      gsap.to(breathInner.current, {
        y: 4, duration: 11, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5,
      }),
      gsap.to(organism.current, {
        rotation: 0.4, duration: 8, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3,
      }),
    ]

    // The organism paints with `mix-blend-mode: lighten`, so it cannot sit on
    // the compositor's fast path: every frame these tweens run re-blends that
    // whole region against the grain layer and the canvas behind it. Worth
    // paying while the organism is the thing you are looking at, pure jank once
    // it has scrolled away — and on a phone it never stops being expensive.
    ScrollTrigger.create({
      trigger: refs.section.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        for (const tween of idle) {
          if (self.isActive) tween.play()
          else tween.pause()
        }
      },
    })
  })
  return () => ctx.revert()
}

export function initCursorParallax(refs: HeroRefs, reduced: boolean) {
  if (reduced || !refs.organism.current) return () => {}

  const xTo = gsap.quickTo(refs.organism.current, 'x', { duration: 0.65, ease: 'power2.out' })
  const yTo = gsap.quickTo(refs.organism.current, 'y', { duration: 0.65, ease: 'power2.out' })
  const rTo = gsap.quickTo(refs.organism.current, 'rotation', { duration: 0.85, ease: 'power2.out' })

  const onMove = (e: MouseEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5
    const ny = e.clientY / window.innerHeight - 0.5
    xTo(nx * 16)
    yTo(ny * 10)
    rTo(nx * 0.6)
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  return () => window.removeEventListener('mousemove', onMove)
}

export function initCtaMagnet(ctaEl: HTMLElement | null, reduced: boolean) {
  if (reduced || !ctaEl) return () => {}

  const onMove = (e: MouseEvent) => {
    const r = ctaEl.getBoundingClientRect()
    const dx = ((e.clientX - r.left) / r.width - 0.5) * 10
    const dy = ((e.clientY - r.top) / r.height - 0.5) * 6
    gsap.to(ctaEl, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' })
  }
  const onLeave = () => gsap.to(ctaEl, { x: 0, y: 0, duration: 0.5, ease: 'power2.out' })

  ctaEl.addEventListener('mousemove', onMove)
  ctaEl.addEventListener('mouseleave', onLeave)
  return () => { ctaEl.removeEventListener('mousemove', onMove); ctaEl.removeEventListener('mouseleave', onLeave) }
}

export function buildScrollExit(refs: HeroRefs, reduced: boolean) {
  const { section, eyebrow, headlineLines, body, ctaWrap, meta, breathWrap } = refs

  const lines = headlineLines.current?.filter(Boolean) ?? []

  if (reduced) {
    scrollProgress.hero = 0
    return
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section.current,
      start: 'top top',
      end: '+=100%',
      // A 1.4s catch-up reads as luxury under a mouse wheel and as lag under a
      // thumb: a flick outruns it, so the hero appears to stick for most of a
      // second before it starts moving. Touch gets a scrub short enough to feel
      // attached to the finger.
      scrub: coarse ? 0.55 : 1.4,
      pin: true,
      pinSpacing: true,
      // Pinning under a smooth scroller lands a frame late, which is the small
      // hitch you feel the instant the hero starts to leave. Start pinning a
      // touch early so the swap has already happened by the time it shows.
      anticipatePin: 1,
      refreshPriority: 1,
      onUpdate: (self) => {
        scrollProgress.hero = self.progress
      },
    },
    defaults: { ease: 'none' },
  })

  tl.fromTo(lines, { yPercent: 0 }, { yPercent: -6 }, 0.20)

  tl.fromTo(body.current, { opacity: 1 }, { opacity: 0 }, 0.45)

  tl.fromTo(ctaWrap.current, { opacity: 1 }, { opacity: 0 }, 0.60)

  tl.fromTo(lines, { opacity: 1 }, { opacity: 0 }, 0.70)
  tl.fromTo(eyebrow.current, { opacity: 1 }, { opacity: 0 }, 0.65)
  tl.fromTo(meta.current, { opacity: 1 }, { opacity: 0 }, 0.72)

  tl.fromTo(
    breathWrap.current,
    { scale: 1, x: 0 },
    { scale: HERO_ORGANISM.exitScale, x: HERO_ORGANISM.exitX },
    0.30,
  )

  tl.fromTo(breathWrap.current, { opacity: 1 }, { opacity: 0, duration: 0.14 }, 0.86)

  // This runs when the entrance timeline finishes, roughly a second and a half
  // after boot — by which time an impatient thumb is already moving. A global
  // refresh re-measures every pin and trigger on the page, so landing one
  // mid-gesture yanks the scroll position. Only settle the layout if nobody has
  // started scrolling yet; if they have, the measurements taken at creation are
  // the ones that match what they are looking at.
  if (window.scrollY === 0) ScrollTrigger.refresh()

  if (tl.scrollTrigger) scrollProgress.hero = tl.scrollTrigger.progress

  return tl
}
