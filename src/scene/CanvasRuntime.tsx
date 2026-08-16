import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useExperienceStore } from '@/store/experienceStore'
import type { TIER_DPR } from '@/lib/deviceTier'

type Bounds = (typeof TIER_DPR)[keyof typeof TIER_DPR]

/**
 * Owns the two things about the canvas that change while the page is scrolling:
 * whether the loop is running at all, and what resolution it runs at.
 *
 * Both used to be props on `<Canvas>`, driven by React state a level up — which
 * meant a section boundary re-rendered ExperienceCanvas and reconciled the
 * entire scene tree, at the precise moment the boundary was being animated.
 * Twelve of those landed in a single pass down the page. R3F exposes both
 * settings imperatively, so from in here they are a store write and a renderer
 * call with no render at all above them.
 */
export default function CanvasRuntime({ bounds }: { bounds: Bounds }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const setDpr = useThree((s) => s.setDpr)
  const canvasActive = useExperienceStore((s) => s.canvasActive)

  // Innovation and everything below it are opaque, so once one of them owns the
  // viewport there is nothing to draw. 'never' halts the loop entirely;
  // scrolling back resumes it from the same scroll-derived state, since every
  // value in the scene is a pure function of progress.
  useEffect(() => {
    setFrameloop(canvasActive ? 'always' : 'never')
  }, [canvasActive, setFrameloop])

  // A ref rather than state for the same reason as above: the whole point of
  // moving this down here is that adapting the resolution should not re-render
  // anything.
  const dpr = useRef(bounds.initial)
  const nudge = (next: number) => {
    const value = +Math.min(bounds.max, Math.max(bounds.min, next)).toFixed(2)
    if (value === dpr.current) return
    dpr.current = value
    setDpr(value)
  }

  // Hysteretic and bounded. Every DPR change reallocates the drawing buffer and
  // every render target attached to it, which is a stall of its own — so the
  // steps are small, the range comes from the device tier rather than from a
  // global guess, and `flipflops` stops the monitor adapting at all once it has
  // changed its mind three times. An oscillating monitor costs more than the
  // resolution it is trying to save.
  return (
    <PerformanceMonitor
      flipflops={3}
      onFallback={() => nudge(bounds.min)}
      onDecline={() => nudge(dpr.current - 0.25)}
      onIncline={() => nudge(dpr.current + 0.25)}
    />
  )
}
