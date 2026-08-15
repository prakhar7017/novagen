import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * The one animation driver behind all four capability visuals.
 *
 * Three jobs, deliberately in one place:
 *
 *   measure   Each visual draws into an SVG whose viewBox is its own pixel box,
 *             so circles stay circular at any module aspect and pointer
 *             coordinates need no conversion at all. That is worth one
 *             ResizeObserver per module.
 *
 *   focus     A single point every visual interprets its own way — the scan
 *             centre, the tilt origin, the selected cluster, the active locus.
 *             It follows the pointer where there is one and an idle path where
 *             there is not (§44), so touch and desktop run the *same* code and
 *             a phone is never a second implementation.
 *
 *   frames    One gsap.ticker callback per visible module, not a rAF loop each.
 *             GSAP's ticker is already running for Lenis, and registering on it
 *             keeps every visual on the same clock as the page's scroll.
 *
 * Nothing here touches React state per frame: `onFrame` writes to the DOM
 * directly, which is what ACCEPTANCE_CRITERIA §20 requires and what keeps four
 * simultaneous visuals off the reconciler.
 */

export interface VisualFrame {
  /** Measured element box, in CSS pixels */
  w: number
  h: number
  /** Focus point, in the same pixel space */
  x: number
  y: number
  /** 0–1: how strongly the visual is currently being addressed */
  focus: number
  /** Seconds since the visual started running */
  time: number
  /** True while the focus is following the idle path rather than a pointer */
  auto: boolean
}

interface Options {
  /**
   * Called every frame while the module is on screen — and once, with
   * `time: 0`, whenever the box is measured or motion is reduced, so the
   * resting state is always painted even when nothing is animating.
   */
  onFrame: (frame: VisualFrame) => void
  /** Idle focus travel, in fractions of the box (§44) */
  amplitude?: { x: number; y: number }
  /** Idle focus speed multiplier — the genomic sweep wants to be slower */
  speed?: number
}

/** Resting focus strength while the idle path is driving (§16: never full). */
const AUTO_FOCUS = 0.72

export function useVisualDriver({ onFrame, amplitude, speed = 1 }: Options) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const reduced = useReducedMotion()
  // Coarse pointers get the idle path instead of hover (§44). Matching on the
  // capability rather than on width means a touchscreen laptop behaves like a
  // touchscreen, which is what the visitor's finger expects.
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  // Latest callback without re-registering the ticker every render.
  const frameCb = useRef(onFrame)
  frameCb.current = onFrame

  const amp = useRef(amplitude ?? { x: 0.3, y: 0.24 })
  amp.current = amplitude ?? { x: 0.3, y: 0.24 }
  const speedRef = useRef(speed)
  speedRef.current = speed

  // Pointer target and the smoothed value that actually reaches the visual.
  const target = useRef({ x: 0.5, y: 0.5, focus: 0 })
  const current = useRef({ x: 0.5, y: 0.5, focus: 0 })
  const pointerActive = useRef(false)

  // ── Measure ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const read = () => {
      const r = el.getBoundingClientRect()
      // Rounded: sub-pixel widths from a fractional grid column would otherwise
      // re-render the SVG on every scroll-driven layout pass.
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }

    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Pointer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = rootRef.current
    if (!el || !canHover || reduced) return

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      target.current.x = e.clientX - r.left
      target.current.y = e.clientY - r.top
      target.current.focus = 1
      pointerActive.current = true
    }

    const leave = () => {
      target.current.focus = 0
      pointerActive.current = false
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    // A pointer that leaves the window without crossing the module — or one
    // that is cancelled mid-gesture — must not strand the visual lit.
    el.addEventListener('pointercancel', leave)
    window.addEventListener('blur', leave)

    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointercancel', leave)
      window.removeEventListener('blur', leave)
      leave()
    }
  }, [canHover, reduced])

  // ── Frames ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = rootRef.current
    if (!el || !size.w || !size.h) return

    // The resting state, painted immediately: under reduced motion it is the
    // only state, and everywhere else it means a module is never blank between
    // being measured and coming on screen.
    const rest: VisualFrame = {
      w: size.w,
      h: size.h,
      x: size.w * 0.5,
      y: size.h * 0.46,
      focus: reduced ? AUTO_FOCUS : 0,
      time: 0,
      auto: true,
    }
    frameCb.current(rest)

    if (reduced) return

    let running = false
    let elapsed = 0
    let last = 0

    const tick = (time: number) => {
      const dt = last ? Math.min(0.05, time - last) : 0.016
      last = time
      elapsed += dt

      const t = elapsed * speedRef.current
      const auto = !pointerActive.current

      if (auto) {
        // Two incommensurate frequencies, so the path never visibly repeats.
        target.current.x = size.w * (0.5 + amp.current.x * Math.sin(t * 0.34))
        target.current.y = size.h * (0.5 + amp.current.y * Math.sin(t * 0.23 + 1.1))
        // Only on a device that cannot hover does the idle path light the
        // visual; where there is a pointer, an empty module stays at rest.
        target.current.focus = canHover ? 0 : AUTO_FOCUS
      }

      // Frame-rate independent smoothing — a fixed lerp factor would make the
      // response twice as fast on a 120Hz display.
      const k = 1 - Math.exp(-dt * 9)
      const c = current.current
      c.x += (target.current.x - c.x) * k
      c.y += (target.current.y - c.y) * k
      c.focus += (target.current.focus - c.focus) * (1 - Math.exp(-dt * 6))

      frameCb.current({
        w: size.w,
        h: size.h,
        x: c.x,
        y: c.y,
        focus: c.focus,
        time: elapsed,
        auto,
      })
    }

    const start = () => {
      if (running) return
      running = true
      last = 0
      // Picking up from the resting centre rather than from wherever the
      // pointer last was avoids a visible jump when the module returns.
      current.current.x = size.w * 0.5
      current.current.y = size.h * 0.5
      gsap.ticker.add(tick)
    }

    const stop = () => {
      if (!running) return
      running = false
      gsap.ticker.remove(tick)
    }

    // Off-screen modules cost nothing: four idle visuals animating behind the
    // fold is exactly the kind of background load §45 rules out.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '12% 0px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      stop()
    }
  }, [size.w, size.h, reduced, canHover])

  return { rootRef, size, reduced, canHover }
}
