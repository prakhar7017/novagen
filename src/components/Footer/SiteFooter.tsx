import { navigateToSection } from '@/lib/anchorNav'
import { FOOTER_LINKS } from '@/lib/sections'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CTA_BRAND } from '@/sections/Cta/cta.constants'

/**
 * The site footer (§31–§34).
 *
 * A sibling of `<main>` rather than a child of the closing section, because
 * that is what it is: a page-level landmark, not part of section 08's argument.
 * The closing stage is `position: sticky`, so this rises over a held
 * composition instead of appearing after it — which is the whole reason §31
 * asks for the footer to feel integrated rather than appended.
 *
 * Restrained on purpose. §56 fails the closing frame for a "giant footer
 * template", and §34 allows exactly one small technical detail before the
 * footer turns back into a HUD.
 *
 * The legal line states what this is. §31 is explicit that a portfolio piece
 * must not present a copyright claim as a real company's, so there is no ©
 * here — the site says it is a concept, which is both honest and true.
 */
export default function SiteFooter() {
  const reduced = useReducedMotion()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-footer-word">
            NOVA<span aria-hidden="true">/</span>GEN
          </span>
          <span className="site-footer-tagline">{CTA_BRAND.line}</span>
        </div>

        <nav className="site-footer-nav" aria-label="Footer">
          <ul className="site-footer-list">
            {FOOTER_LINKS.map((item) => (
              <li key={item.target}>
                <a
                  className="site-footer-link"
                  href={`#${item.target}`}
                  onClick={(e) => navigateToSection(e, item.target, reduced)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer-base">
        <p className="site-footer-note">
          Conceptual biotechnology experience. Portfolio project — not a real company, and
          the figures shown are illustrative.
        </p>

        {/* §34 — one technical detail, and only one. */}
        <p className="site-footer-meta">
          <span>System / NOVA-GEN</span>
          <span aria-hidden="true">·</span>
          <span>Version / 01</span>
        </p>
      </div>
    </footer>
  )
}
