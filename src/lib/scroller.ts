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

export function scrollToSection(id: string, opts: { immediate?: boolean } = {}) {
  const el = document.getElementById(id)
  if (!el) return false

  const header = document.querySelector<HTMLElement>('.site-header')
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

export function lockScroll() {
  current?.stop()
  document.documentElement.classList.add('is-scroll-locked')
}

export function unlockScroll() {
  document.documentElement.classList.remove('is-scroll-locked')
  current?.start()
}
