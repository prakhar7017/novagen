interface Props {
  breathRef:      React.RefObject<HTMLDivElement | null>
  breathInnerRef: React.RefObject<HTMLDivElement | null>
  organismRef:    React.RefObject<HTMLImageElement | null>
}

/**
 * Right-side Hero visual: the photorealistic organism.
 *
 * Atmospheric particles are drawn by the shared ExperienceCanvas behind this
 * section. The box geometry here is mirrored in heroGeometry.ts so the Journey
 * can take the organism over in WebGL without a visible jump.
 */
export default function HeroVisual({ breathRef, breathInnerRef, organismRef }: Props) {
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
        {/* Atmospheric particles are drawn by the shared ExperienceCanvas,
            which sits behind this whole section. */}

        {/* Organism image — z:4 */}
        <div
          ref={breathRef}
          data-organism-wrap
          style={{
            position: 'absolute',
            // Desktop: right-anchored so center ≈ 1075px at 1440px viewport
            right: 0,
            // Centred with auto margins rather than translateY(-50%).
            // GSAP owns this element's transform for the breathing and exit
            // animations, and it folds any pre-existing CSS transform into its
            // own `y`: with translateY(-50%) the idle breath's `y: 4` became a
            // 335px slide down the page instead of a 4px drift.
            top: 0,
            bottom: 0,
            marginTop: 'auto',
            marginBottom: 'auto',
            // ~8% smaller than the original 50vw/760px so it supports the
            // headline instead of competing with it.
            width: 'clamp(400px, 46vw, 700px)',
            aspectRatio: '1 / 1',
            // Negative margin bleeds the organism off the right edge. More
            // negative = farther right; -6% is ~43px right of the old -3%.
            marginRight: '-6%',
            zIndex: 4,
            // Mobile: override via media query in Hero.tsx
          }}
        >
          {/* Idle breathing lives on its own element so it never competes
              with the scroll exit's transform on the wrapper above. */}
          <div ref={breathInnerRef} style={{ width: '100%', height: '100%' }}>
            <img
              ref={organismRef}
              src="/assets/story/01-organism.webp"
              alt=""
              draggable={false}
              /* Already decoded by the time this is seen — the loader waits on
                 exactly this file — so the decode is off the critical path
                 either way, and async keeps it off the main thread. */
              decoding="async"
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
      </div>
    )
}
