import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { NAV_ITEMS, NAV_PRIMARY, type SectionId } from '@/lib/sections'
import { lockScroll, unlockScroll } from '@/lib/scroller'

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (event: React.MouseEvent<HTMLAnchorElement>, target: string) => void
  returnFocusTo: React.RefObject<HTMLButtonElement | null>
  currentSection: SectionId
  reduced: boolean
}

/**
 * The compact-viewport menu (§11–§13).
 *
 * A full-screen Abyss panel rather than a slide-in drawer: at 390px a drawer
 * costs a scrim, a shadow and an edge, and buys nothing the whole screen does
 * not already give. The links are large but restrained — this is a menu of four
 * destinations, not a landing page.
 *
 * Kept mounted rather than conditionally rendered, so the close animation has
 * something to animate, and marked `inert` while closed so nothing inside it is
 * focusable, findable or announced in that state.
 */
export default function MobileMenu({
  open,
  onClose,
  onNavigate,
  returnFocusTo,
  currentSection,
  reduced,
}: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLLIElement | null)[]>([])

  // ── Reveal (§12) ─────────────────────────────────────────────────────────
  useGSAP(
    () => {
      const el = panel.current
      if (!el) return
      const links = (items.current ?? []).filter(Boolean) as HTMLLIElement[]

      if (reduced) {
        gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: open ? 1 : 0 })
        gsap.set(links, { opacity: 1, y: 0 })
        return
      }

      const tl = gsap.timeline()
      if (open) {
        tl.set(el, { autoAlpha: 1 })
          // Clipped open from the top edge rather than faded: the panel
          // arrives as a surface moving down over the page, which is the same
          // language every section boundary on this site uses.
          .fromTo(
            el,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.56, ease: 'power3.out' },
          )
          .fromTo(
            links,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.42, stagger: 0.055, ease: 'power2.out' },
            0.18,
          )
      } else {
        tl.to(links, { opacity: 0, duration: 0.16, ease: 'power2.in' })
          .to(
            el,
            { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.42, ease: 'power3.inOut' },
            0.04,
          )
          .set(el, { autoAlpha: 0 })
      }
      return () => {
        tl.kill()
      }
    },
    { dependencies: [open, reduced] },
  )

  // ── Scroll lock, Escape, and focus (§13) ─────────────────────────────────
  useEffect(() => {
    if (!open) return

    lockScroll()

    const el = panel.current
    // Focus moves into the panel rather than staying on the toggle behind it,
    // so the next Tab lands on a menu link and a screen reader starts reading
    // what just opened.
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
      )
    focusables()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      // Trapped: with the page inert behind it, Tab reaching the browser
      // chrome and coming back into a hidden document is worse than a loop.
      const list = focusables()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
    }
  }, [open, onClose])

  // Separated from the effect above so focus returns only when the menu is
  // actually dismissed — not on unmount during a resize, which would steal
  // focus from wherever the reader had moved it.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) returnFocusTo.current?.focus()
    wasOpen.current = open
  }, [open, returnFocusTo])

  return (
    <div
      id="site-menu"
      ref={panel}
      className="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={!open}
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <nav aria-label="Sections">
        <ul className="site-menu-list">
          {NAV_ITEMS.map((item, i) => {
            const active = item.covers.includes(currentSection)
            return (
              <li
                key={item.label}
                ref={(el) => {
                  items.current[i] = el
                }}
              >
                <a
                  className="site-menu-link"
                  href={`#${item.target}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={(e) => onNavigate(e, item.target)}
                >
                  <span className="site-menu-index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className="site-menu-foot"
        ref={(el) => {
          items.current[NAV_ITEMS.length] = el as unknown as HTMLLIElement
        }}
      >
        <a
          className="site-menu-cta"
          href={`#${NAV_PRIMARY.target}`}
          onClick={(e) => onNavigate(e, NAV_PRIMARY.target)}
        >
          {NAV_PRIMARY.label}
        </a>
        <p className="site-menu-line">Biology, made programmable.</p>
      </div>
    </div>
  )
}
