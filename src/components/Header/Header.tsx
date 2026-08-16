import { useCallback, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { NAV_ITEMS } from '@/lib/sections'
import { scrollToSection } from '@/lib/scroller'
import { useExperienceStore } from '@/store/experienceStore'
import MobileMenu from './MobileMenu'

/**
 * The site header (§6–§13).
 *
 * Previously this lived inside `Hero.tsx` as inline styles, with its
 * light-section treatment bolted on from `innovation.css` behind eight
 * `!important` rules and its hover colour written by a React event handler.
 * That worked while the Hero was the only section, and stopped being tenable
 * once four sections needed to change its appearance.
 *
 * It is one component now, with three appearance inputs and no JavaScript
 * involved in any of them:
 *
 *   `data-scrolled`  — past the Hero, the bar earns a surface (§8)
 *   `data-surface`   — set on <html> by whichever section owns the viewport,
 *                      so light sections get dark type (§9)
 *   `aria-current`   — the active section, indicated by a small Bio Green
 *                      dot (§10)
 *
 * Everything else is CSS, which is why the colour change reads as one fade
 * rather than as the wordmark and the links crossing over at different speeds.
 */
export default function Header() {
  const reduced = useReducedMotion()
  const isCompact = useMediaQuery('(max-width: 768px)')
  const booted = useExperienceStore((s) => s.booted)
  const currentSection = useExperienceStore((s) => s.currentSection)

  const root = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // ── Surface state (§8) ───────────────────────────────────────────────────
  // A plain scroll distance rather than a trigger on the Hero: the Hero is
  // 100svh but the bar should gain its surface as soon as content starts
  // moving under it, not a whole screen later.
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 64,
      // Deliberately past the furthest anyone can scroll rather than 'max'.
      // A trigger that ends exactly at the maximum scroll position toggles
      // itself inactive the moment the reader reaches the bottom of the page,
      // and the bar lost its surface on the last screen — visible under
      // reduced motion, where the page is short enough to actually reach it.
      end: () => ScrollTrigger.maxScroll(window) + 200,
      invalidateOnRefresh: true,
      onToggle: (self) => setScrolled(self.isActive),
    })
    return () => st.kill()
  }, [])

  // ── Entrance ─────────────────────────────────────────────────────────────
  // Waits for the loader to hand over, so the header is not already settled
  // behind the cover when it lifts.
  useGSAP(
    () => {
      if (!root.current) return
      if (reduced || !booted) {
        gsap.set(root.current, { opacity: booted || reduced ? 1 : 0, y: 0 })
        return
      }
      gsap.fromTo(
        root.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 },
      )
    },
    { dependencies: [booted, reduced] },
  )

  // The menu is a mobile affordance; a resize into the desktop layout with it
  // still open would leave a full-screen panel over a page that has room for
  // the links inline.
  useEffect(() => {
    if (!isCompact) setMenuOpen(false)
  }, [isCompact])

  const go = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, target: string) => {
      // Modified clicks belong to the browser — a reader opening a section in
      // a new tab should get one.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      if (!scrollToSection(target, { immediate: reduced })) return
      event.preventDefault()
      setMenuOpen(false)
      // The hash is still worth writing: it makes the address bar honest and
      // gives the reader something to copy.
      if (window.history.replaceState) {
        window.history.replaceState(null, '', `#${target}`)
      }
    },
    [reduced],
  )

  return (
    <>
      <header
        ref={root}
        className="site-header"
        data-scrolled={scrolled ? '' : undefined}
        data-menu-open={menuOpen ? '' : undefined}
        style={reduced ? undefined : { opacity: 0 }}
      >
        <a className="site-logo" href="#hero" onClick={(e) => go(e, 'hero')}>
          NOVA<span aria-hidden="true">/</span>GEN
        </a>

        <nav className="site-nav" aria-label="Primary">
          <ul className="site-nav-list">
            {NAV_ITEMS.map((item) => {
              const active = item.covers.includes(currentSection)
              return (
                <li key={item.label}>
                  <a
                    className="site-nav-link"
                    href={`#${item.target}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={(e) => go(e, item.target)}
                  >
                    <span className="site-nav-dot" aria-hidden="true" />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <button
            ref={toggleRef}
            type="button"
            className="site-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="site-menu-bars" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Menu'}</span>
          </button>
        </nav>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={go}
        returnFocusTo={toggleRef}
        currentSection={currentSection}
        reduced={reduced}
      />
    </>
  )
}
