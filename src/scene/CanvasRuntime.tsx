import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useExperienceStore } from '@/store/experienceStore'
import type { TIER_DPR } from '@/lib/deviceTier'

type Bounds = (typeof TIER_DPR)[keyof typeof TIER_DPR]

export default function CanvasRuntime({ bounds }: { bounds: Bounds }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const setDpr = useThree((s) => s.setDpr)
  const canvasActive = useExperienceStore((s) => s.canvasActive)

  useEffect(() => {
    setFrameloop(canvasActive ? 'always' : 'never')
  }, [canvasActive, setFrameloop])

  const dpr = useRef(bounds.initial)
  const nudge = (next: number) => {
    const value = +Math.min(bounds.max, Math.max(bounds.min, next)).toFixed(2)
    if (value === dpr.current) return
    dpr.current = value
    setDpr(value)
  }

  return (
    <PerformanceMonitor
      flipflops={3}
      onFallback={() => nudge(bounds.min)}
      onDecline={() => nudge(dpr.current - 0.25)}
      onIncline={() => nudge(dpr.current + 0.25)}
    />
  )
}
