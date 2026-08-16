const BIO_GREEN = [0.651, 1.0, 0.416] as const
const SIGNAL_MINT = [0.776, 0.961, 0.882] as const

function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface ParticleTargets {
  nucleus: Float32Array
  field: Float32Array
  signal: Float32Array
  network: Float32Array
  candidate: Float32Array
  color: Float32Array
  random: Float32Array
  size: Float32Array
  lineIndices: Uint16Array
  nodeCount: number
}

export function buildParticleTargets(count: number): ParticleTargets {
  const rnd = makeRng(0x4e56)

  const nucleus = new Float32Array(count * 3)
  const field = new Float32Array(count * 3)
  const signal = new Float32Array(count * 3)
  const network = new Float32Array(count * 3)
  const candidate = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)
  const random = new Float32Array(count)
  const size = new Float32Array(count)

  const COLS = 46
  const colHeight = new Float32Array(COLS)
  for (let c = 0; c < COLS; c++) {
    const t = c / (COLS - 1)
    const base =
      0.30 +
      0.22 * Math.sin(t * 14.0 + 0.7) * Math.sin(t * 5.3) +
      0.16 * Math.sin(t * 31.0 + 2.1) +
      rnd() * 0.18
    let peak = 0
    for (const [center, amp, width] of [
      [0.22, 0.95, 0.035],
      [0.54, 0.62, 0.028],
      [0.79, 1.15, 0.030],
    ] as const) {
      const d = t - center
      peak += amp * Math.exp(-(d * d) / (2 * width * width))
    }
    colHeight[c] = Math.max(0.08, base * 0.7 + peak)
  }

  const CLUSTERS = 13
  const cx: number[] = []
  const cy: number[] = []
  const cz: number[] = []
  const cr: number[] = []
  const cw: number[] = []
  for (let i = 0; i < CLUSTERS; i++) {
    cx.push((rnd() - 0.5) * 5.4)
    cy.push((rnd() - 0.5) * 3.1)
    cz.push((rnd() - 0.5) * 1.9)
    cr.push(0.22 + rnd() * 0.62)
    cw.push(0.35 + rnd() * 1.0)
  }
  const totalW = cw.reduce((a, b) => a + b, 0)

  const AX = { x: 0.62, y: 0.72, z: 0.18 }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const r1 = rnd()

    random[i] = rnd()
    size[i] = 0.6 + rnd() * 1.2

    {
      const u = rnd() * 2 - 1
      const th = rnd() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = 1.06 + (rnd() - 0.5) * 0.16
      nucleus[i3] = 0.55 + rad * s * Math.cos(th) * 1.12
      nucleus[i3 + 1] = 0.02 + rad * s * Math.sin(th)
      nucleus[i3 + 2] = rad * u * 0.75
    }

    {
      const u = rnd() * 2 - 1
      const th = rnd() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = 0.35 + Math.pow(rnd(), 0.62) * 2.35
      field[i3] = 0.25 + rad * s * Math.cos(th) * 1.35
      field[i3 + 1] = rad * s * Math.sin(th) * 0.82
      field[i3 + 2] = rad * u * 0.55
    }

    {
      const c = Math.floor(rnd() * COLS)
      const t = c / (COLS - 1)
      const h = colHeight[c]
      const up = Math.pow(rnd(), 0.75) * h
      signal[i3] = (t - 0.5) * 5.0 + (rnd() - 0.5) * 0.016
      signal[i3 + 1] = up - 0.72
      signal[i3 + 2] = (rnd() - 0.5) * 0.22
    }

    {
      let pick = rnd() * totalW
      let c = 0
      while (c < CLUSTERS - 1 && pick > cw[c]) {
        pick -= cw[c]
        c++
      }
      if (r1 < 0.16) {
        const d = Math.floor(rnd() * CLUSTERS)
        const t = rnd()
        network[i3] = cx[c] + (cx[d] - cx[c]) * t + (rnd() - 0.5) * 0.16
        network[i3 + 1] = cy[c] + (cy[d] - cy[c]) * t + (rnd() - 0.5) * 0.16
        network[i3 + 2] = cz[c] + (cz[d] - cz[c]) * t + (rnd() - 0.5) * 0.16
      } else {
        const u = rnd() * 2 - 1
        const th = rnd() * Math.PI * 2
        const s = Math.sqrt(1 - u * u)
        const rad = Math.pow(rnd(), 0.55) * cr[c]
        network[i3] = cx[c] + rad * s * Math.cos(th)
        network[i3 + 1] = cy[c] + rad * s * Math.sin(th)
        network[i3 + 2] = cz[c] + rad * u
      }
    }

    {
      const u = rnd() * 2 - 1
      const th = rnd() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      const rad = 0.72 + Math.pow(rnd(), 2.0) * 0.55
      const px = rad * s * Math.cos(th)
      const py = rad * s * Math.sin(th)
      const pz = rad * u
      candidate[i3] = px * 1.15 + py * AX.x * 0.32
      candidate[i3 + 1] = py * 1.05 + px * AX.y * 0.22
      candidate[i3 + 2] = pz * AX.z + (rnd() - 0.5) * 0.1
    }

    const c = rnd() < 0.8 ? BIO_GREEN : SIGNAL_MINT
    const v = 0.78 + rnd() * 0.42
    color[i3] = c[0] * v
    color[i3 + 1] = c[1] * v
    color[i3 + 2] = c[2] * v
  }

  const nodeCount = Math.min(284, Math.floor(count * 0.28))
  const MAX_DEGREE = 3
  const LINK_DIST = 0.92
  const degree = new Uint8Array(nodeCount)
  const pairs: number[] = []

  for (let a = 0; a < nodeCount; a++) {
    if (degree[a] >= MAX_DEGREE) continue
    const ax = network[a * 3]
    const ay = network[a * 3 + 1]
    const az = network[a * 3 + 2]

    for (let b = a + 1; b < nodeCount; b++) {
      if (degree[a] >= MAX_DEGREE) break
      if (degree[b] >= MAX_DEGREE) continue
      const dx = network[b * 3] - ax
      const dy = network[b * 3 + 1] - ay
      const dz = network[b * 3 + 2] - az
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 < LINK_DIST * LINK_DIST) {
        pairs.push(a, b)
        degree[a]++
        degree[b]++
      }
    }
  }

  return {
    nucleus,
    field,
    signal,
    network,
    candidate,
    color,
    random,
    size,
    lineIndices: new Uint16Array(pairs),
    nodeCount,
  }
}
