interface Props {
  breathRef:      React.RefObject<HTMLDivElement | null>
  breathInnerRef: React.RefObject<HTMLDivElement | null>
  organismRef:    React.RefObject<HTMLImageElement | null>
}

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

        <div
          ref={breathRef}
          data-organism-wrap
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            marginTop: 'auto',
            marginBottom: 'auto',
            width: 'clamp(400px, 46vw, 700px)',
            aspectRatio: '1 / 1',
            marginRight: '-6%',
            zIndex: 4,
          }}
        >
          <div ref={breathInnerRef} style={{ width: '100%', height: '100%' }}>
            <img
              ref={organismRef}
              src="/assets/story/01-organism.webp"
              alt=""
              draggable={false}
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                mixBlendMode: 'lighten',
                willChange: 'transform',
              }}
            />
          </div>
        </div>
      </div>
    )
}
