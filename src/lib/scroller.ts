/**
 * A single place to ask for a scroll.
 *
 * Lenis owns the scroll position, so `window.scrollTo` is unreliable while it
 * is running — but only App holds the instance. Registering it here lets the
 * header, the Technology pipeline and anything else request a position without
 * threading the instance through the tree or reaching for the dev-only handle.
 *
 * Every function falls back to native behaviour if nothing has registered, so
 * the page is still usable before Lenis mounts and if it ever fails to.
 */
interface Scroller {
  scrollTo: (
    target: number | string | HTMLElement,
    options?: { duration?: number; offset?: number; immediate?: boolean },
  ) => void
  stop: () => void
  start: () => void
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

/**
 * Anchor navigation (§25).
 *
 * The offset is read from the header's own measured height rather than fixed
 * per breakpoint, because the header is fluid — a hard-coded 80 lands the
 * target under the bar on a phone and 40px below it on a wide desktop.
 *
 * `immediate` exists for reduced motion: §25 asks for an instant or very short
 * movement there rather than a long eased travel across eight sections.
 */
export function scrollToSection(id: string, opts: { immediate?: boolean } = {}) {
  const el = document.getElementById(id)
  if (!el) return false

  const header = document.querySelector<HTMLElement>('.site-header')
  // A little under the bar's full height: sections open on their own generous
  // top padding, so clearing the bar exactly leaves the label pinned to it.
  const offset = header ? -(header.offsetHeight - 8) : 0

  if (current) {
    current.scrollTo(el, {
      offset,
      duration: opts.immediate ? 0 : 1.2,
      immediate: opts.immediate,
    })
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' })
  }
  return true
}

/**
 * Freeze the page behind an overlay (§13).
 *
 * Lenis has to be stopped as well as the body locked: it drives scroll from its
 * own rAF loop, so `overflow: hidden` alone leaves the page moving underneath
 * an open menu on a trackpad.
 */
export function lockScroll() {
  current?.stop()
  document.documentElement.classList.add('is-scroll-locked')
}

export function unlockScroll() {
  document.documentElement.classList.remove('is-scroll-locked')
  current?.start()
}
