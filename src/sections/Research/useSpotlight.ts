import { useEffect } from 'react'
import { LEAD_ANNOTATIONS, SPOTLIGHT_DIAMETER } from './research.constants'

/**
 * The lead study's region spotlight (§19, §20).
 *
 * Not a magnifier and not a lens — the page already used inspection behaviour
 * in Innovation and Capabilities, and repeating it here would make the third
 * microscopy image feel like the same exhibit. This is an observer's response
 * instead: a soft region of the field comes up in brightness and contrast under
 * the pointer, and whichever readout falls inside it becomes the active one.
 *
 * Everything visual is CSS. This hook writes two custom properties and one
 * class name, on an animation frame, and nothing else — so moving the pointer
 * across the image costs one style recalc per frame rather than a React render
 * per event.
 *
 * @param surfaceRef the element the image, the readouts and the spotlight all
 *   live in. It is also the element the parallax transforms, which is why every
 *   measurement below is converted back into its own untransformed coordinates:
 *   a mask is applied before the transform, and a readout is positioned as a
 *   percentage of the same box, so both have to be addressed in local pixels
 *   however the element happens to be scaled at that moment.
 */
export function useSpotlight(
  surfaceRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !enabled) return

    const markers = Array.from(surface.querySelectorAll<HTMLElement>('[data-annotation]'))

    // Client coordinates rather than element-relative ones: the surface moves
    // under a stationary pointer while the page scrolls, so the offset has to be
    // recomputed from a fresh rect rather than remembered.
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

      // One active readout at most: two lighting together reads as a HUD
      // responding to the pointer rather than as a region being examined.
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
      // Touch and pen fall through to the static presentation: a spotlight that
      // exists only where a finger is currently pressing is not an observation.
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

    // While the pointer is still and the page is moving, the region under it is
    // changing — so the spotlight has to keep up with the scroll as well.
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
