import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface VisualFrame {
  w: number
  h: number
  x: number
  y: number
  focus: number
  time: number
  auto: boolean
}

interface Options {
  onFrame: (frame: VisualFrame) => void
  amplitude?: { x: number; y: number }
  speed?: number
}

const AUTO_FOCUS = 0.72

export function useVisualDriver({ onFrame, amplitude, speed = 1 }: Options) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const reduced = useReducedMotion()
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  const frameCb = useRef(onFrame)
  frameCb.current = onFrame

  const amp = useRef(amplitude ?? { x: 0.3, y: 0.24 })
  amp.current = amplitude ?? { x: 0.3, y: 0.24 }
  const speedRef = useRef(speed)
  speedRef.current = speed

  const target = useRef({ x: 0.5, y: 0.5, focus: 0 })
  const current = useRef({ x: 0.5, y: 0.5, focus: 0 })
  const pointerActive = useRef(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const read = () => {
      const r = el.getBoundingClientRect()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }

    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  useEffect(() => {
    const el = rootRef.current
    if (!el || !size.w || !size.h) return

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
        target.current.x = size.w * (0.5 + amp.current.x * Math.sin(t * 0.34))
        target.current.y = size.h * (0.5 + amp.current.y * Math.sin(t * 0.23 + 1.1))
        target.current.focus = canHover ? 0 : AUTO_FOCUS
      }

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
      current.current.x = size.w * 0.5
      current.current.y = size.h * 0.5
      gsap.ticker.add(tick)
    }

    const stop = () => {
      if (!running) return
      running = false
      gsap.ticker.remove(tick)
    }

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
