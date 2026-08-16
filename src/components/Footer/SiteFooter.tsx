import { navigateToSection } from '@/lib/anchorNav'
import { FOOTER_LINKS } from '@/lib/sections'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { CTA_BRAND } from '@/sections/Cta/cta.constants'

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

        <p className="site-footer-meta">
          <span>System / NOVA-GEN</span>
          <span aria-hidden="true">·</span>
          <span>Version / 01</span>
        </p>
      </div>
    </footer>
  )
}
