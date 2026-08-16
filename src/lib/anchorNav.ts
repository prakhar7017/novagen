import { scrollToSection } from '@/lib/scroller'

/**
 * Take a click on an in-page anchor, if the page can honour it.
 *
 * The header has carried this logic since §25; the closing section and the site
 * footer need exactly the same three decisions, so it lives here rather than
 * being written a third time:
 *
 *   – a modified click belongs to the browser, so a reader opening a section in
 *     a new tab gets one
 *   – Lenis owns the scroll position, so the movement has to go through it
 *   – the hash is still written, because it makes the address bar honest and
 *     gives the reader something to copy
 *
 * Returns whether the click was handled, so a caller with extra work to do —
 * closing a menu, say — can tell whether it should.
 */
export function navigateToSection(
  event: React.MouseEvent<HTMLAnchorElement>,
  target: string,
  reduced: boolean,
): boolean {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return false
  if (!scrollToSection(target, { immediate: reduced })) return false

  event.preventDefault()
  if (window.history.replaceState) {
    window.history.replaceState(null, '', `#${target}`)
  }
  return true
}
