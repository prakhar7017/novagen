import { useCallback, useMemo, useRef } from 'react'
import { GENOME_LOCI, buildGenome, locusAt } from '../capabilities.geometry'
import { ease, setNum, setOpacity, setText } from '../attr'
import { useVisualDriver, type VisualFrame } from '../useVisualDriver'

interface Props {
  bars: number
}

const BAND = { bars: 0.29, wave: 0.39 } as const

export default function GenomicVisual({ bars }: Props) {
  const genome = useMemo(() => buildGenome(bars), [bars])

  const groupEls = useRef<(SVGGElement | null)[]>([])
  const waveEls = useRef<(SVGPathElement | null)[]>([])
  const trackEls = useRef<(SVGGElement | null)[]>([])
  const headEl = useRef<SVGLineElement>(null)
  const labelEl = useRef<HTMLSpanElement>(null)

  const onFrame = useCallback((f: VisualFrame) => {
    const { w, h } = f
    if (!w || !h) return

    const t = Math.max(0, Math.min(1, f.x / w))
    const activeLocus = locusAt(t)

    for (let k = 0; k < GENOME_LOCI; k++) {
      const centre = (k + 0.5) / GENOME_LOCI
      const d = Math.abs(centre - t) * GENOME_LOCI
      const near = ease(1 - d / 1.15) * f.focus

      setOpacity(groupEls.current[k], 0.26 + near * 0.74)
      setOpacity(waveEls.current[k], 0.3 + near * 0.7)
      setNum(waveEls.current[k], 'stroke-width', 1 + near * 1.1, 0.02)
      setOpacity(trackEls.current[k], 0.34 + near * 0.66)
    }

    setNum(headEl.current, 'x1', f.x, 0.5)
    setNum(headEl.current, 'x2', f.x, 0.5)
    setOpacity(headEl.current, f.focus * 0.5)

    setText(
      labelEl.current,
      f.focus < 0.12 ? `— / ${GENOME_LOCI}` : `${String(activeLocus + 1).padStart(2, '0')} / ${GENOME_LOCI}`,
    )
  }, [])

  const { rootRef, size } = useVisualDriver({
    onFrame,
    amplitude: { x: 0.42, y: 0.12 },
    speed: 0.62,
  })

  const { w, h } = size
  const padX = 18
  const inner = Math.max(0, w - padX * 2)
  const top = h * 0.16
  const band = h * 0.68

  const barsW = inner * BAND.bars
  const waveX = padX + barsW + inner * 0.03
  const waveW = inner * BAND.wave
  const trackX = waveX + waveW + inner * 0.03
  const trackW = Math.max(0, padX + inner - trackX)

  const wavePath = (k: number) => {
    const from = k / GENOME_LOCI
    const to = (k + 1) / GENOME_LOCI
    const pts = genome.wave.filter(
      (p, i) =>
        (p.x >= from && p.x <= to) ||
        (i > 0 && genome.wave[i - 1].x < from && p.x > from) ||
        (i < genome.wave.length - 1 && genome.wave[i + 1].x > to && p.x < to),
    )
    if (!pts.length) return ''
    return pts
      .map((p, i) => `${i ? 'L' : 'M'} ${(waveX + p.x * waveW).toFixed(1)} ${(top + p.y * band).toFixed(1)}`)
      .join(' ')
  }

  return (
    <div ref={rootRef} className="cap-visual cap-visual--genomic">
      {w > 0 && (
        <svg
          className="cap-svg cap-genomic-svg"
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          aria-hidden="true"
        >
          <line
            className="cap-genomic-axis"
            x1={padX}
            x2={w - padX}
            y1={top + band}
            y2={top + band}
          />

          {Array.from({ length: GENOME_LOCI }, (_, k) => (
            <g
              key={`bars-${k}`}
              className="cap-genomic-bars"
              ref={(el) => {
                groupEls.current[k] = el
              }}
              opacity={0.26}
            >
              {genome.bars
                .filter((b) => b.locus === k)
                .map((b, i) => (
                  <rect
                    key={i}
                    x={padX + b.x * barsW}
                    y={top + band - b.h * band}
                    width={Math.max(1.5, barsW / (genome.bars.length * 1.9))}
                    height={b.h * band}
                  />
                ))}
            </g>
          ))}

          {Array.from({ length: GENOME_LOCI }, (_, k) => (
            <path
              key={`wave-${k}`}
              className="cap-genomic-wave"
              ref={(el) => {
                waveEls.current[k] = el
              }}
              d={wavePath(k)}
              opacity={0.3}
            />
          ))}

          {Array.from({ length: GENOME_LOCI }, (_, k) => (
            <g
              key={`track-${k}`}
              className="cap-genomic-tracks"
              ref={(el) => {
                trackEls.current[k] = el
              }}
              opacity={0.24}
            >
              {genome.segments
                .filter((s) => s.locus === k)
                .map((s, i) => (
                  <rect
                    key={i}
                    x={trackX + s.x * trackW}
                    y={top + band * (0.18 + s.row * 0.3)}
                    width={Math.max(2, s.w * trackW)}
                    height={Math.max(2, band * 0.13)}
                    opacity={s.level}
                  />
                ))}
            </g>
          ))}

          <line
            className="cap-genomic-head"
            ref={headEl}
            x1={0}
            x2={0}
            y1={top - h * 0.06}
            y2={top + band + h * 0.06}
            opacity={0}
          />
        </svg>
      )}

      <div className="cap-readout cap-readout--genomic" aria-hidden="true">
        <span className="cap-readout-key">Locus</span>
        <span className="cap-readout-val" ref={labelEl}>
          — / {GENOME_LOCI}
        </span>
      </div>
    </div>
  )
}
