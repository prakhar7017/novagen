import { JOURNEY_STATES } from './journey.constants'

/**
 * Reduced-motion Journey.
 *
 * Same seven states, same copy, no pinning and no scroll-linked WebGL — just a
 * normally-scrolling document with a still image per state. ACCEPTANCE_CRITERIA
 * §18 requires the content to stay complete when motion is suppressed, so this
 * is a genuine alternative rendering rather than the cinematic version with the
 * animation switched off.
 */

const STILLS: Record<string, string> = {
  origin: '/assets/story/01-organism.webp',
  explore: '/assets/story/02-cell-cluster.webp',
  decode: '/assets/story/03-nucleus.webp',
  discover: '/assets/story/07-molecular-candidate.webp',
}

/** Deterministic scatter so the static diagrams are stable across renders. */
function seeded(n: number, salt: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function ParticleDiagram() {
  const dots = Array.from({ length: 90 }, (_, i) => ({
    cx: 6 + seeded(i, 1) * 88,
    cy: 6 + seeded(i, 2) * 88,
    r: 0.5 + seeded(i, 3) * 1.3,
  }))
  return (
    <svg viewBox="0 0 100 100" className="journey-static-svg" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#a6ff6a" opacity={0.25 + seeded(i, 4) * 0.55} />
      ))}
    </svg>
  )
}

function SignalDiagram() {
  const bars = Array.from({ length: 44 }, (_, i) => {
    const t = i / 43
    const peak =
      0.9 * Math.exp(-Math.pow((t - 0.24) / 0.06, 2)) +
      1.2 * Math.exp(-Math.pow((t - 0.78) / 0.05, 2))
    const h = 8 + (seeded(i, 5) * 18 + peak * 46)
    return { x: 5 + t * 90, h }
  })
  return (
    <svg viewBox="0 0 100 100" className="journey-static-svg" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={88 - b.h} width={1.1} height={b.h} fill="#a6ff6a" opacity={0.7} />
      ))}
    </svg>
  )
}

function NetworkDiagram() {
  const nodes = Array.from({ length: 34 }, (_, i) => ({
    cx: 10 + seeded(i, 6) * 80,
    cy: 10 + seeded(i, 7) * 80,
  }))
  const links: [number, number][] = []
  nodes.forEach((a, i) => {
    nodes.forEach((b, k) => {
      if (k <= i || links.length > 46) return
      const d = Math.hypot(a.cx - b.cx, a.cy - b.cy)
      if (d < 22) links.push([i, k])
    })
  })
  return (
    <svg viewBox="0 0 100 100" className="journey-static-svg" aria-hidden="true">
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="#8fe8b8" strokeWidth={0.3} opacity={0.4}
        />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={1.4} fill="#a6ff6a" opacity={0.85} />
      ))}
    </svg>
  )
}

const DIAGRAMS: Record<string, () => React.ReactElement> = {
  signal: ParticleDiagram,
  read: SignalDiagram,
  interpret: NetworkDiagram,
}

export default function JourneyStatic() {
  return (
    <section id="journey" className="journey-static" aria-label="The biological journey">
      {JOURNEY_STATES.map((state) => {
        const still = STILLS[state.id]
        const Diagram = DIAGRAMS[state.id]

        return (
          <article key={state.id} className="journey-static-row">
            <div className="journey-static-visual">
              {still ? (
                <img src={still} alt="" loading="lazy" decoding="async" />
              ) : Diagram ? (
                <Diagram />
              ) : null}
            </div>

            <div className="journey-static-copy">
              <div className="journey-label">
                <span className="journey-label-index">{state.index}</span>
                <span className="journey-label-rule" aria-hidden="true" />
                <span>{state.label}</span>
              </div>
              <h2 className="journey-headline">
                {state.headline.map((l) => (
                  <span key={l} style={{ display: 'block' }}>{l}</span>
                ))}
              </h2>
              <p className="journey-body">{state.body}</p>
              <div className="journey-meta journey-meta--static">
                {state.meta.map(([k, v]) => (
                  <div key={k} className="journey-meta-row">
                    <span className="journey-meta-key">{k}</span>
                    <span className="journey-meta-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
