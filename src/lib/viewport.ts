// Every full-height section is laid out in `svh` — the *small* viewport, which
// stays constant while iOS collapses and expands its URL bar. `innerHeight`
// does not: it grows as the bar retracts and shrinks as it returns. Scroll math
// that reads `innerHeight` therefore drifts away from the layout it is
// measuring, and re-measuring mid-gesture moves every section boundary under
// the user. Measure the CSS unit itself instead, and cache it — it only moves
// when the layout genuinely does (rotation, a real resize).
let cached = 0

function measure(): number {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none'
  document.documentElement.appendChild(probe)
  const height = probe.getBoundingClientRect().height
  probe.remove()
  // Pre-`svh` engines resolve the declaration to nothing; fall back to the
  // reading we were trying to replace.
  return height || window.innerHeight
}

export function viewportHeight(): number {
  if (!cached) cached = measure()
  return cached
}

export function invalidateViewportHeight() {
  cached = 0
}
