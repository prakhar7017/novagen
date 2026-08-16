import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import MicroscopyAnnotations from './MicroscopyAnnotations'
import { MICROSCOPY_ALT, MICROSCOPY_SIZE, MICROSCOPY_SRC } from './innovation.constants'

interface Props {
  frameRef: React.RefObject<HTMLDivElement | null>
  revealRef: React.RefObject<HTMLDivElement | null>
  annotationsRef: React.RefObject<HTMLDivElement | null>
}

const LENS_SIZE = 150
const LENS_ZOOM = 1.08

export default function InnovationVisual({ frameRef, revealRef, annotationsRef }: Props) {
  const reduced = useReducedMotion()
  const finePointer = useMediaQuery('(pointer: fine)')
  const wideEnough = useMediaQuery('(min-width: 1025px)')

  const lensEnabled = finePointer && wideEnough && !reduced

  const lens = useRef<HTMLDivElement>(null)
  const lensInner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const lensEl = lens.current
    const innerEl = lensInner.current
    if (!lensEnabled || !frame || !lensEl || !innerEl) return

    const r = LENS_SIZE / 2
    let frameW = 0
    let frameH = 0
    let queued = false
    let px = 0
    let py = 0

    const measure = () => {
      const rect = frame.getBoundingClientRect()
      frameW = rect.width
      frameH = rect.height
      innerEl.style.width = `${frameW}px`
      innerEl.style.height = `${frameH}px`
    }

    const paint = () => {
      queued = false
      lensEl.style.transform = `translate3d(${px - r}px, ${py - r}px, 0)`
      innerEl.style.transform = `translate3d(${r - px * LENS_ZOOM}px, ${r - py * LENS_ZOOM}px, 0) scale(${LENS_ZOOM})`
    }

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      measure()
      gsap.to(lensEl, { opacity: 1, duration: 0.28, ease: 'power2.out' })
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const rect = frame.getBoundingClientRect()
      px = e.clientX - rect.left
      py = e.clientY - rect.top
      if (queued) return
      queued = true
      requestAnimationFrame(paint)
    }

    const onLeave = () => {
      gsap.to(lensEl, { opacity: 0, duration: 0.22, ease: 'power2.in' })
    }

    measure()
    frame.addEventListener('pointerenter', onEnter)
    frame.addEventListener('pointermove', onMove)
    frame.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)

    return () => {
      frame.removeEventListener('pointerenter', onEnter)
      frame.removeEventListener('pointermove', onMove)
      frame.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
      gsap.killTweensOf(lensEl)
    }
  }, [lensEnabled, frameRef])

  return (
    <figure className="innovation-visual">
      <div ref={frameRef} className="innovation-visual-frame">
        <div ref={revealRef} className="innovation-visual-reveal">
          <div className="innovation-visual-parallax">
            <img
              className="innovation-visual-img"
              src={MICROSCOPY_SRC}
              width={MICROSCOPY_SIZE.width}
              height={MICROSCOPY_SIZE.height}
              alt={MICROSCOPY_ALT}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="innovation-visual-vignette" aria-hidden="true" />

        <MicroscopyAnnotations containerRef={annotationsRef} />

        {lensEnabled && (
          <div ref={lens} className="innovation-lens" aria-hidden="true">
            <div ref={lensInner} className="innovation-lens-inner">
              <div className="innovation-visual-parallax">
                <img className="innovation-visual-img" src={MICROSCOPY_SRC} alt="" decoding="async" />
              </div>
            </div>
          </div>
        )}
      </div>

      <figcaption className="innovation-visual-caption">
        Fluorescence imaging — connective structure across a cellular field.
      </figcaption>
    </figure>
  )
}
