/**
 * A single place to ask for a scroll.
 *
 * Lenis owns the scroll position, so `window.scrollTo` is unreliable while it
 * is running — but only App holds the instance. Registering it here lets the
 * Technology pipeline (and anything after it) request a position without
 * threading the instance through the tree or reaching for the dev-only handle.
 *
 * Falls back to native smooth scrolling if nothing has registered, so the
 * behaviour is still correct before Lenis mounts.
 */
interface Scroller {
  scrollTo: (target: number, options?: { duration?: number }) => void
}

let current: Scroller | null = null

export function registerScroller(scroller: Scroller) {
  current = scroller
  return () => {
    if (current === scroller) current = null
  }
}

export function scrollToY(y: number, duration = 1.1) {
  if (current) current.scrollTo(y, { duration })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}
