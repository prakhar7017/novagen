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

/**
 * Section 05 — Capabilities.
 *
 * Technology explained how the platform works; this shows what it enables. The
 * shift is deliberate — from one pinned 280vh sequence to a normally-scrolling
 * layout of about 170vh, from a single instrument to four, from WebGL to SVG
 * (§50, §51). After two cinematic sections the page has earned the right to
 * simply *show* things, and the modules carry enough activity of their own.
 *
 * Nothing here mounts a canvas. The shared one is stopped while this section
 * owns the viewport, so four simultaneous visuals never share a frame budget
 * with a WebGL platform that has nothing left to draw.
 */
export default function Capabilities() {
  const reduced = useReducedMotion()
  // The density switch, not a layout switch: the grid is handled entirely in
  // CSS, and this only decides how many elements each visual draws (§45).
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
      {/* Softer and deeper than Technology's environment: the same world, one
          step away from the instrument panel (§4, §34). */}
      <div className="capabilities-bg" aria-hidden="true" />
      <div className="capabilities-grain" aria-hidden="true" />

      {/* What the validated candidate leaves behind (§53). */}
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
