interface Props {
  metaRef: React.RefObject<HTMLDivElement | null>
}

/** Minimal scientific HUD labels — 2 items only, per spec §19 */
export default function HeroMetadata({ metaRef }: Props) {
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 0.75vw, 11px)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-signal-mint)',
    opacity: 0.62,
    lineHeight: 1.6,
  }

  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 5, height: 5,
    borderRadius: '50%',
    background: 'var(--color-bio-green)',
    marginRight: 7,
    verticalAlign: 'middle',
    opacity: 0.8,
    animation: 'pulse-dot 2.4s ease-in-out infinite',
  }

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div
        ref={metaRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, opacity: 0 }}
        aria-hidden="true"
      >
        {/* Bottom-left: system label */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(48px, 5.5vh, 68px)',
            left: 'clamp(20px, 4.4vw, 64px)',
          }}
        >
          <div style={labelStyle}>
            <span style={dotStyle} />
            System — Live cellular model
          </div>
        </div>

        {/* Bottom-right: signal label */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(48px, 5.5vh, 68px)',
            right: 'clamp(20px, 4.4vw, 64px)',
            textAlign: 'right',
          }}
        >
          <div style={labelStyle}>Signal · Active</div>
          <div style={{ ...labelStyle, color: 'var(--color-muted)', opacity: 0.45 }}>
            CELL_014
          </div>
        </div>
      </div>
    </>
  )
}
