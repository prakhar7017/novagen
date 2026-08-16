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
import { useExperienceStore } from '@/store/experienceStore'
import type { HeroRefs } from './hero.types'
import HeroContent from './HeroContent'
import HeroVisual from './HeroVisual'
import HeroMetadata from './HeroMetadata'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const reduced = useReducedMotion()
  const booted = useExperienceStore((s) => s.booted)

  const section       = useRef<HTMLElement>(null)
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
      section, eyebrow, headlineLines, body,
      ctaWrap, primaryCta, meta, breathWrap, breathInner, organism,
    }),
    [],
  )

  useGSAP(
    () => {
      if (!booted) return
      const entranceTl = buildEntranceTimeline(refs, reduced)

      let stopBreathing: (() => void) | undefined
      let exitTl: gsap.core.Timeline | undefined
      const settle = () => {
        stopBreathing = startIdleBreathing(refs, reduced)
        exitTl = buildScrollExit(refs, reduced)
      }

      if (entranceTl) entranceTl.eventCallback('onComplete', settle)
      else settle()

      return () => {
        entranceTl?.eventCallback('onComplete', null)
        stopBreathing?.()
        exitTl?.scrollTrigger?.kill()
        exitTl?.kill()
      }
    },
    { dependencies: [reduced, booted], revertOnUpdate: true },
  )

  useEffect(() => {
    return initCursorParallax(refs, reduced)
  }, [refs, reduced])

  return (
    <>
      <section
        id="hero"
        ref={refs.section}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100svh',
          minHeight: '720px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 38% 34% at 72% 44%, rgba(166,255,106,0.038) 0%, transparent 70%),
              radial-gradient(ellipse 22% 26% at 30% 60%, rgba(198,245,225,0.014) 0%, transparent 65%)
            `,
          }}
        />

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

        <HeroVisual
          breathRef={refs.breathWrap}
          breathInnerRef={refs.breathInner}
          organismRef={refs.organism}
        />

        <HeroContent
          eyebrowRef={refs.eyebrow}
          headlineLinesRef={refs.headlineLines}
          bodyRef={refs.body}
          ctaWrapRef={refs.ctaWrap}
          primaryCtaRef={refs.primaryCta}
        />

        <HeroMetadata metaRef={refs.meta} />

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

      <style>{`
        @media (max-width: 768px) {
          #hero { min-height: 100svh; }

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
