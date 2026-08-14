import { forwardRef } from 'react'
import HeroAtmosphere from '@/scene/HeroAtmosphere/HeroAtmosphere'

interface Props {
  breathRef:   React.RefObject<HTMLDivElement | null>
  organismRef: React.RefObject<HTMLImageElement | null>
}

/**
 * Right-side visual: WebGL atmospheric particles + photorealistic organism PNG.
 * Canvas sits behind organism (pointer-events: none).
 * Organism PNG is positioned absolutely, right-anchored at 1440px.
 */
const HeroVisual = forwardRef<HTMLDivElement, Props>(
  function HeroVisual({ breathRef, organismRef }) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 3,
        }}
      >
        {/* Atmospheric particles — z:3, behind organism */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <HeroAtmosphere />
        </div>

        {/* Organism image — z:4 */}
        <div
          ref={breathRef}
          style={{
            position: 'absolute',
            // Desktop: right-anchored so center ≈ 1075px at 1440px viewport
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(440px, 50vw, 760px)',
            aspectRatio: '1 / 1',
            // Bleed slightly off right edge to feel large
            marginRight: '-3%',
            zIndex: 4,
            // Mobile: override via media query in CSS
          }}
        >
          <img
            ref={organismRef}
            src="/assets/hero/organism.png"
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              // Additive-style blend: organism glows on the dark background
              mixBlendMode: 'lighten',
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    )
  },
)

export default HeroVisual
