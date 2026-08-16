import { scrollToSection } from '@/lib/scroller'

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
