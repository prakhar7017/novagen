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

export default function Header() {
  const reduced = useReducedMotion()
  const isCompact = useMediaQuery('(max-width: 768px)')
  const booted = useExperienceStore((s) => s.booted)
  const currentSection = useExperienceStore((s) => s.currentSection)

  const root = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 64,
      end: () => ScrollTrigger.maxScroll(window) + 200,
      invalidateOnRefresh: true,
      onToggle: (self) => setScrolled(self.isActive),
    })
    return () => st.kill()
  }, [])

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

  useEffect(() => {
    if (!isCompact) setMenuOpen(false)
  }, [isCompact])

  const go = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, target: string) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      if (!scrollToSection(target, { immediate: reduced })) return
      event.preventDefault()
      setMenuOpen(false)
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
