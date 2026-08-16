import { useEffect } from 'react'
import { LEAD_ANNOTATIONS, SPOTLIGHT_DIAMETER } from './research.constants'

export function useSpotlight(
  surfaceRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !enabled) return

    const markers = Array.from(surface.querySelectorAll<HTMLElement>('[data-annotation]'))

    let clientX = 0
    let clientY = 0
    let raf = 0
    let spotting = false

    const radius = SPOTLIGHT_DIAMETER / 2

    const write = () => {
      raf = 0
      const rect = surface.getBoundingClientRect()
      const localW = surface.offsetWidth
      const localH = surface.offsetHeight
      if (!rect.width || !rect.height || !localW || !localH) return

      const x = ((clientX - rect.left) / rect.width) * localW
      const y = ((clientY - rect.top) / rect.height) * localH
      surface.style.setProperty('--spot-x', `${x.toFixed(1)}px`)
      surface.style.setProperty('--spot-y', `${y.toFixed(1)}px`)

      let nearest = -1
      let best = radius
      LEAD_ANNOTATIONS.forEach((a, i) => {
        const d = Math.hypot((a.x / 100) * localW - x, (a.y / 100) * localH - y)
        if (d < best) {
          best = d
          nearest = i
        }
      })
      markers.forEach((el, i) => el.classList.toggle('is-active', i === nearest))
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(write)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      clientX = e.clientX
      clientY = e.clientY
      if (!spotting) {
        spotting = true
        surface.classList.add('is-spotting')
      }
      schedule()
    }

    const clear = () => {
      spotting = false
      surface.classList.remove('is-spotting')
      markers.forEach((el) => el.classList.remove('is-active'))
    }

    const onScroll = () => {
      if (spotting) schedule()
    }

    surface.addEventListener('pointermove', onMove)
    surface.addEventListener('pointerleave', clear)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      surface.removeEventListener('pointermove', onMove)
      surface.removeEventListener('pointerleave', clear)
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      clear()
    }
  }, [surfaceRef, enabled])
}
