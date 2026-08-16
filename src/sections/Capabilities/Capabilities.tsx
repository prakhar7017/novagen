import { useEffect, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  buildCapabilitiesSurface,
  buildCapabilitiesTimeline,
  type CapabilitiesRefs,
} from '@/animation/capabilitiesTimeline'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useExperienceStore } from '@/store/experienceStore'
import CapabilitiesHeader from './CapabilitiesHeader'
import CapabilityModule from './CapabilityModule'
import GenomicVisual from './visuals/GenomicVisual'
import NetworkVisual from './visuals/NetworkVisual'
import ProteinVisual from './visuals/ProteinVisual'
import SpatialVisual from './visuals/SpatialVisual'
import { CAPABILITIES, CAPABILITIES_EXIT, DENSITY } from './capabilities.constants'

export default function Capabilities() {
  const reduced = useReducedMotion()
  const compact = useMediaQuery('(max-width: 768px)')
  const setCanvasActive = useExperienceStore((s) => s.setCanvasActive)

  const density = compact ? DENSITY.mobile : DENSITY.desktop

  const section = useRef<HTMLElement>(null)
  const signal = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const headlineLines = useRef<(HTMLSpanElement | null)[]>([])
  const lead = useRef<HTMLParagraphElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const modules = useRef<(HTMLElement | null)[]>([])
  const exit = useRef<HTMLDivElement>(null)

  const refs: CapabilitiesRefs = useMemo(
    () => ({ section, signal, label, headlineLines, lead, grid, modules, exit }),
    [],
  )

  useGSAP(() => buildCapabilitiesTimeline(refs, reduced), {
    dependencies: [refs, reduced],
    revertOnUpdate: true,
  })

  useEffect(() => {
    const el = section.current
    if (!el) return
    return buildCapabilitiesSurface(el, setCanvasActive)
  }, [setCanvasActive])

  const visuals = [
    <SpatialVisual key="spatial" markers={density.spatialMarkers} />,
    <ProteinVisual key="protein" points={density.structurePoints} />,
    <NetworkVisual key="ai" nodes={density.networkNodes} />,
    <GenomicVisual key="genomic" bars={density.genomeBars} />,
  ]

  return (
    <section
      id="capabilities"
      ref={section}
      className="capabilities"
      aria-labelledby="capabilities-title"
    >
      <div className="capabilities-bg" aria-hidden="true" />
      <div className="capabilities-grain" aria-hidden="true" />

      <div ref={signal} className="capabilities-signal" aria-hidden="true" />

      <div className="capabilities-inner">
        <CapabilitiesHeader labelRef={label} linesRef={headlineLines} leadRef={lead} />

        <div ref={grid} className="capabilities-grid">
          {CAPABILITIES.map((cap, i) => (
            <CapabilityModule
              key={cap.id}
              capability={cap}
              moduleRef={(el) => {
                modules.current[i] = el
              }}
            >
              {visuals[i]}
            </CapabilityModule>
          ))}
        </div>

        <div ref={exit} className="capabilities-exit">
          <span className="capabilities-exit-rule" aria-hidden="true" />
          <span className="capabilities-exit-copy">
            {CAPABILITIES_EXIT[0]}
            <br />
            {CAPABILITIES_EXIT[1]}
          </span>
        </div>
      </div>
    </section>
  )
}
