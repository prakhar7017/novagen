import { useRef, useEffect } from 'react'
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
  const refs: HeroRefs = {
    section:       useRef(null),
    nav:           useRef(null),
    eyebrow:       useRef(null),
    headlineLines: useRef([]),
    body:          useRef(null),
    ctaWrap:       useRef(null),
    primaryCta:    useRef(null),
    meta:          useRef(null),
    breathWrap:    useRef(null),
    organism:      useRef(null),
  }

  // ── GSAP entrance + exit ──────────────────────────────────────────────────
  useGSAP(
    () => {
      const entranceTl = buildEntranceTimeline(refs, reduced)

      // Start idle breathing after entrance finishes
      let stopBreathing: (() => void) | undefined
      if (entranceTl) {
        entranceTl.eventCallback('onComplete', () => {
          stopBreathing = startIdleBreathing(refs, reduced)
        })
      } else {
        stopBreathing = startIdleBreathing(refs, reduced)
      }

      buildScrollExit(refs, reduced)

      return () => stopBreathing?.()
    },
    { dependencies: [reduced], revertOnUpdate: true },
  )

  // ── Cursor parallax (outside GSAP context — needs mousemove listener) ────
  useEffect(() => {
    return initCursorParallax(refs, reduced)
  }, [reduced])

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
          <ul style={{ listStyle: 'none', display: 'flex', gap: 'clamp(24px, 2.8vw, 40px)', margin: 0, padding: 0 }}>
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <a
                  href={`#${link.toLowerCase()}`}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(13px, 0.95vw, 15px)',
                    color: 'var(--color-muted)',
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-bone)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ── Hero section ─────────────────────────────────────────────────── */}
      <section
        id="hero"
        ref={refs.section}
        style={{
          position: 'relative',
          width: '100%',
          height: '100svh',
          minHeight: '720px',
          overflow: 'hidden',
        }}
      >
        {/* ── Background layers ────────────────────────────────────────── */}
        {/* z:0 Base */}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--color-abyss)', zIndex: 0 }} />

        {/* z:1 Radial glow — Bio Green at 72% x, 44% y (per spec §8) */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 55% 50% at 72% 44%, rgba(166,255,106,0.075) 0%, transparent 70%),
              radial-gradient(ellipse 30% 35% at 30% 60%, rgba(198,245,225,0.03) 0%, transparent 65%)
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
        <HeroVisual breathRef={refs.breathWrap} organismRef={refs.organism} />

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

          /* Stack organism above copy on mobile */
          [data-organism-wrap] {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            transform: none !important;
            margin: 0 auto !important;
            width: clamp(330px, 90vw, 420px) !important;
            margin-right: -5% !important;
            margin-top: -2vh !important;
          }
        }
      `}</style>
    </>
  )
}
