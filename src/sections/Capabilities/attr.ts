/**
 * Per-frame DOM writes for the capability visuals.
 *
 * Every visual updates a fixed set of SVG elements each frame, and most of
 * those values barely move between frames. Writing them anyway is what turns
 * four modest visuals into an unnecessary style-recalc every 16ms, so each
 * setter caches its last value on the element and skips the write when the new
 * one is within a hair of it.
 *
 * The cache lives on the node rather than in a parallel array so it cannot
 * fall out of step with the elements when a resize rebuilds the SVG.
 */

interface Cached extends Element {
  __last?: Record<string, number>
}

function changed(el: Cached, key: string, value: number, epsilon: number) {
  const cache = (el.__last ??= {})
  if (cache[key] !== undefined && Math.abs(cache[key] - value) < epsilon) return false
  cache[key] = value
  return true
}

/** Sets a numeric SVG attribute, rounded, when it has meaningfully changed. */
export function setNum(
  el: Element | null | undefined,
  name: string,
  value: number,
  epsilon = 0.01,
) {
  if (!el) return
  if (!changed(el as Cached, name, value, epsilon)) return
  el.setAttribute(name, value.toFixed(3))
}

/** Sets `opacity`, clamped to 0–1. */
export function setOpacity(el: Element | null | undefined, value: number, epsilon = 0.008) {
  setNum(el, 'opacity', Math.min(1, Math.max(0, value)), epsilon)
}

/**
 * Sets a translate/scale transform.
 *
 * Guarded on the scale and both offsets at once: a transform is one string, so
 * it is only worth rebuilding when some part of it has actually moved.
 */
export function setTransform(
  el: Element | null | undefined,
  x: number,
  y: number,
  scale = 1,
) {
  if (!el) return
  const e = el as Cached
  const moved =
    changed(e, 'tx', x, 0.05) || changed(e, 'ty', y, 0.05) || changed(e, 'ts', scale, 0.004)
  if (!moved) return
  el.setAttribute(
    'transform',
    `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(3)})`,
  )
}

/** Replaces text content only when it changes — text nodes are expensive. */
export function setText(el: Element | null | undefined, value: string) {
  if (!el || el.textContent === value) return
  el.textContent = value
}

/**
 * Smoothstep, matching the Journey's — used here to shape pointer falloff so
 * a marker fades in and out of range rather than switching on at its edge.
 */
export function ease(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
