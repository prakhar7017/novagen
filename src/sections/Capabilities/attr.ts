interface Cached extends Element {
  __last?: Record<string, number>
}

function changed(el: Cached, key: string, value: number, epsilon: number) {
  const cache = (el.__last ??= {})
  if (cache[key] !== undefined && Math.abs(cache[key] - value) < epsilon) return false
  cache[key] = value
  return true
}

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

export function setOpacity(el: Element | null | undefined, value: number, epsilon = 0.008) {
  setNum(el, 'opacity', Math.min(1, Math.max(0, value)), epsilon)
}

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

export function setText(el: Element | null | undefined, value: string) {
  if (!el || el.textContent === value) return
  el.textContent = value
}

export function ease(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}
