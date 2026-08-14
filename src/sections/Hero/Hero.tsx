import { useRef, useEffect, useMemo } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  buildEntranceTimeline,
  startIdleBreathing,
  initCursorParallax,
  buildScrollExit,
} from '@/animation/heroTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { HeroRefs } from './hero.types'
import HeroContent from './HeroContent'
import HeroVisual from './HeroVisual'
import HeroMetadata from './HeroMetadata'

gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = ['Platform', 'Research', 'Capabilities', 'Impact']

export default function Hero() {
  const reduced = useReducedMotion()

  // ── Refs ─────────────────────────────────────────────────────────────────
  // Each useRef is stable, but the object literal wrapping them is not; it is
  // memoised so effects can depend on `refs` without re-running every render.
  const section       = useRef<HTMLElement>(null)
  const nav           = useRef<HTMLElement>(null)
  const eyebrow       = useRef<HTMLSpanElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const body          = useRef<HTMLParagraphElement>(null)
  const ctaWrap       = useRef<HTMLDivElement>(null)
  const primaryCta    = useRef<HTMLAnchorElement>(null)
  const meta          = useRef<HTMLDivElement>(null)
  const breathWrap    = useRef<HTMLDivElement>(null)
  const breathInner   = useRef<HTMLDivElement>(null)
  const organism      = useRef<HTMLImageElement>(null)

  const refs: HeroRefs = useMemo(
    () => ({
      section, nav, eyebrow, headlineLines, body,
      ctaWrap, primaryCta, meta, breathWrap, breathInner, organism,
    }),
    [],
  )

  // ── GSAP entrance + exit ──────────────────────────────────────────────────
  useGSAP(
    () => {
      const entranceTl = buildEntranceTimeline(refs, reduced)

      // Idle breathing and the scroll exit both start from the Hero's settled
      // state, so neither may be built while the entrance is still running —
      // see the note on buildScrollExit.
      let stopBreathing: (() => void) | undefined
      let exitTl: gsap.core.Timeline | undefined
      const settle = () => {
        stopBreathing = startIdleBreathing(refs, reduced)
        exitTl = buildScrollExit(refs, reduced)
      }

      if (entranceTl) entranceTl.eventCallback('onComplete', settle)
      else settle()

      // Anything created inside the onComplete lands outside useGSAP's context,
      // so it has to be torn down by hand.
      return () => {
        entranceTl?.eventCallback('onComplete', null)
        stopBreathing?.()
        exitTl?.scrollTrigger?.kill()
        exitTl?.kill()
      }
    },
    { dependencies: [reduced], revertOnUpdate: true },
  )

  // ── Cursor parallax (outside GSAP context — needs mousemove listener) ────
  useEffect(() => {
    return initCursorParallax(refs, reduced)
  }, [refs, reduced])

  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <header
        ref={refs.nav}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          opacity: reduced ? 1 : 0,
          padding: 'clamp(18px, 2.2vh, 28px) clamp(20px, 4.4vw, 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(14px, 1.1vw, 16px)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--color-bone)',
            textDecoration: 'none',
          }}
          aria-label="NOVA/GEN — Home"
        >
          NOVA
          <span style={{ color: 'var(--color-bio-green)', fontWeight: 300, margin: '0 1px' }}>/</span>
          GEN
        </a>

        {/* Links */}
        <nav aria-label="Primary navigation">
          {/* `display` must stay out of the inline style: an inline rule beats
              the class selector that hides this list on mobile. */}
          <ul className="hero-nav-links" style={{ listStyle: 'none', gap: 'clamp(24px, 2.8vw, 40px)', margin: 0, padding: 0 }}>
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <a
                  href={`#${link.toLowerCase()}`}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(13px, 0.95vw, 15px)',
                    color: 'rgba(245,247,244,0.65)',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-bone)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(245,247,244,0.65)')}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>

          {/* Below 768px the four links overflow into the wordmark, so the
              nav collapses to the single primary action (PAGE_STRUCTURE §4).
              Kept as a real link — no hover-dependent menu on touch. */}
          <a href="#platform" className="hero-nav-compact">
            Explore
          </a>
        </nav>
      </header>

      {/* ── Hero section ─────────────────────────────────────────────────── */}
      <section
        id="hero"
        ref={refs.section}
        style={{
          position: 'relative',
          // Above the fixed ExperienceCanvas (z:1). The section is transparent
          // so the shared canvas shows through; the page's base colour comes
          // from <body>, not from an opaque layer here.
          zIndex: 2,
          width: '100%',
          height: '100svh',
          minHeight: '720px',
          overflow: 'hidden',
        }}
      >
        {/* ── Background layers ────────────────────────────────────────── */}
        {/* z:1 Radial glow — Bio Green at 72% x, 44% y (per spec §8) */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 38% 34% at 72% 44%, rgba(166,255,106,0.038) 0%, transparent 70%),
              radial-gradient(ellipse 22% 26% at 30% 60%, rgba(198,245,225,0.014) 0%, transparent 65%)
            `,
          }}
        />

        {/* z:2 Grid + grain */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(166,255,106,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(166,255,106,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Procedural grain via SVG filter */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
          <defs>
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            opacity: 0.038,
            filter: 'url(#hero-grain)',
            background: '#fff',
          }}
        />

        {/* z:3–4 Particles + organism */}
        <HeroVisual
          breathRef={refs.breathWrap}
          breathInnerRef={refs.breathInner}
          organismRef={refs.organism}
        />

        {/* z:10 Hero copy */}
        <HeroContent
          eyebrowRef={refs.eyebrow}
          headlineLinesRef={refs.headlineLines}
          bodyRef={refs.body}
          ctaWrapRef={refs.ctaWrap}
          primaryCtaRef={refs.primaryCta}
        />

        {/* z:5 Scientific metadata */}
        <HeroMetadata metaRef={refs.meta} />

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 'clamp(28px, 3.5vh, 44px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            opacity: 0.4,
          }}
        >
          <div
            style={{
              width: 1,
              height: 40,
              background: 'linear-gradient(to bottom, transparent, var(--color-muted))',
              animation: 'scroll-line 2s ease-in-out infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes scroll-line {
            0%   { transform: scaleY(0); transform-origin: top; opacity: 0; }
            50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
            100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          }
        `}</style>
      </section>

      {/* ── Mobile responsive overrides ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          #hero { min-height: 100svh; }

          /* Stack organism above copy on mobile.
             These values are mirrored in heroGeometry.ts (MOBILE_W /
             MOBILE_BLEED / MOBILE_TOP) so the Journey's WebGL organism lands
             on the same rectangle — keep the two in sync. */
          /* No transform override here: GSAP animates this element's
             transform, and an !important rule would beat its inline style and
             freeze the breathing and exit motion on mobile. */
          [data-organism-wrap] {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            bottom: auto !important;
            margin: 0 auto !important;
            width: clamp(300px, 78vw, 380px) !important;
            margin-right: -5% !important;
            margin-top: -6vh !important;
          }
        }
      `}</style>
    </>
  )
}
