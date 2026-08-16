import { useRef, useEffect } from 'react'
import { initCtaMagnet } from '@/animation/heroTimeline'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Props {
  eyebrowRef:       React.RefObject<HTMLSpanElement | null>
  headlineLinesRef: React.RefObject<(HTMLSpanElement | null)[]>
  bodyRef:          React.RefObject<HTMLParagraphElement | null>
  ctaWrapRef:       React.RefObject<HTMLDivElement | null>
  primaryCtaRef:    React.RefObject<HTMLAnchorElement | null>
}

export default function HeroContent({
  eyebrowRef, headlineLinesRef, bodyRef, ctaWrapRef, primaryCtaRef,
}: Props) {
  const reduced = useReducedMotion()
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Wire line refs into the shared array
  const setLineRef = (i: number) => (el: HTMLSpanElement | null) => {
    lineRefs.current[i] = el
    if (headlineLinesRef.current) headlineLinesRef.current[i] = el
  }

  useEffect(() => {
    return initCtaMagnet(primaryCtaRef.current, reduced)
  }, [primaryCtaRef, reduced])

  return (
    <div
      className="hero-copy"
      style={{
        // Vertically centered but slightly low (per spec §16)
        top: '47%',
        transform: 'translateY(-45%)',
      }}
    >
      {/* Eyebrow */}
      <span
        ref={eyebrowRef}
        style={{
          display: 'block',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(10px, 0.85vw, 13px)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-signal-mint)',
          opacity: 0,               // hidden until GSAP entrance
          marginBottom: '1.75rem',
        }}
      >
        Computational Biology
      </span>

      {/* Headline — each line in its own clip wrapper */}
      <h1 className="hero-headline">
        {['Biology,', 'made programmable.'].map((line, i) => (
          <span key={line} className="line-clip" style={{ display: 'block' }}>
            <span
              ref={setLineRef(i)}
              style={{ display: 'block', opacity: 0 }}
            >
              {i === 1 ? (
                <>made <span style={{ color: 'var(--color-bio-green)' }}>programmable.</span></>
              ) : line}
            </span>
          </span>
        ))}
      </h1>

      {/* Supporting copy */}
      <p
        ref={bodyRef}
        className="hero-body"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(1rem, 1.35vw, 1.18rem)',
          lineHeight: 1.65,
          color: 'var(--color-muted)',
          opacity: 0,
          marginBottom: '2.5rem',
        }}
      >
        We decode living systems to reveal new possibilities
        for human health.
      </p>

      {/* CTAs */}
      <div
        ref={ctaWrapRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
          opacity: 0,
        }}
      >
        {/* Primary */}
        <a
          ref={primaryCtaRef}
          href="#technology"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            height: 'clamp(50px, 3.6vw, 56px)',
            padding: '0 clamp(22px, 1.8vw, 28px)',
            borderRadius: '999px',
            background: 'var(--color-bio-green)',
            color: 'var(--color-abyss)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(14px, 1.1vw, 16px)',
            fontWeight: 600,
            letterSpacing: '0.01em',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            willChange: 'transform',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Explore our platform
          <span style={{ display: 'inline-block', transition: 'transform 0.2s' }}>→</span>
        </a>

        {/* Secondary — text link treatment */}
        <a
          href="#research"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(14px, 1.05vw, 16px)',
            color: 'var(--color-muted)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-bone)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          View research ↗
        </a>
      </div>
    </div>
  )
}
