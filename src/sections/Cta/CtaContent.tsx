import { useEffect, useRef } from 'react'
import { initClosingCta } from '@/animation/ctaTimeline'
import { navigateToSection } from '@/lib/anchorNav'
import {
  CTA_BRAND,
  CTA_HEADLINE,
  CTA_HEADLINE_COMPACT,
  CTA_INDEX,
  CTA_LABEL,
  CTA_LEAD,
  CTA_META,
  CTA_PRIMARY,
  CTA_SECONDARY,
} from './cta.constants'

interface Props {
  labelRef: React.RefObject<HTMLDivElement | null>
  linesRef: React.RefObject<(HTMLSpanElement | null)[]>
  leadRef: React.RefObject<HTMLParagraphElement | null>
  actionsRef: React.RefObject<HTMLDivElement | null>
  brandRef: React.RefObject<HTMLDivElement | null>
  /** Three authored lines instead of two, below 769px (§46) */
  compact: boolean
  reduced: boolean
  /** Magnetism is a desktop-pointer affordance and nothing else (§18, §47) */
  magnetic: boolean
}

/**
 * Everything section 08 says (§12–§19, §29).
 *
 * Deliberately short. By this point the page has spent seven sections
 * explaining itself, and §4's target feeling — *silence after complexity* — is
 * mostly a matter of how little is left on screen: a label, two lines, one
 * sentence, one action, one link and the wordmark. §28 removes the scientific
 * readouts entirely; the single System / Resolved pair is the one exception it
 * allows, and it is there for continuity with the seven label rows above it
 * rather than to state a fact.
 *
 * The headline is Bone. §15 allows the closing phrase to take Bio Green and
 * then argues against it, and the argument is right: a hundred-pixel neon
 * headline is the loudest thing this page would ever have done, in the section
 * that exists to be quiet. Only the full stop is green — the last mark on the
 * page, and the smallest possible one.
 */
export default function CtaContent({
  labelRef,
  linesRef,
  leadRef,
  actionsRef,
  brandRef,
  compact,
  reduced,
  magnetic,
}: Props) {
  const primary = useRef<HTMLAnchorElement>(null)
  const lines = compact ? CTA_HEADLINE_COMPACT : CTA_HEADLINE

  useEffect(() => initClosingCta(primary.current, magnetic), [magnetic])

  const go = (event: React.MouseEvent<HTMLAnchorElement>, target: string) =>
    navigateToSection(event, target, reduced)

  return (
    <div className="cta-inner">
      <div ref={labelRef} className="cta-label" style={reduced ? undefined : { opacity: 0 }}>
        <span className="cta-label-name">
          <span className="cta-label-index">{CTA_INDEX}</span>
          <span className="cta-label-slash" aria-hidden="true">
            /
          </span>
          {CTA_LABEL}
        </span>

        <span className="cta-label-meta">
          <span className="cta-label-meta-key">{CTA_META.key}</span>
          <span className="cta-label-meta-val">{CTA_META.value}</span>
        </span>
      </div>

      <h2 id="cta-title" className="cta-headline">
        {lines.map((line, i) => (
          <span key={line} className="line-clip">
            <span
              ref={(el) => {
                if (linesRef.current) linesRef.current[i] = el
              }}
              style={{ display: 'block' }}
            >
              {/* The closing full stop, and nothing else, takes the accent. */}
              {i === lines.length - 1 ? (
                <>
                  {line.slice(0, -1)}
                  <span className="cta-headline-mark" aria-hidden="true">
                    .
                  </span>
                </>
              ) : (
                line
              )}
            </span>
          </span>
        ))}
      </h2>

      <p ref={leadRef} className="cta-lead" style={reduced ? undefined : { opacity: 0 }}>
        {CTA_LEAD}
      </p>

      <div
        ref={actionsRef}
        className="cta-actions"
        style={reduced ? undefined : { opacity: 0 }}
      >
        {/* §54 — a real anchor to a section that exists, not a dead button. */}
        <a
          ref={primary}
          className="cta-action"
          href={`#${CTA_PRIMARY.target}`}
          onClick={(e) => go(e, CTA_PRIMARY.target)}
        >
          <span className="cta-action-label">{CTA_PRIMARY.label}</span>
          <span className="cta-action-arrow" aria-hidden="true">
            →
          </span>
        </a>

        {/* §19 — a plain link, not a second button. The primary has to stay
            obviously primary. */}
        <a
          className="cta-link"
          href={`#${CTA_SECONDARY.target}`}
          onClick={(e) => go(e, CTA_SECONDARY.target)}
        >
          {CTA_SECONDARY.label}
          <span className="cta-link-mark" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>

      <div ref={brandRef} className="cta-brand" style={reduced ? undefined : { opacity: 0 }}>
        <span className="cta-brand-name">
          NOVA<span aria-hidden="true">/</span>GEN
        </span>
        <span className="cta-brand-line">{CTA_BRAND.line}</span>
      </div>
    </div>
  )
}
