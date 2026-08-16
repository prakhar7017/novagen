import { ANNOTATIONS } from './innovation.constants'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function MicroscopyAnnotations({ containerRef }: Props) {
  return (
    <div ref={containerRef} className="innovation-annotations" aria-hidden="true">
      {ANNOTATIONS.map((a) => (
        <div
          key={a.label}
          className={`innovation-annotation innovation-annotation--${a.side}${
            a.secondary ? ' is-secondary' : ''
          }`}
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
        >
          <svg className="innovation-annotation-marker" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="0.9" />
            <circle cx="10" cy="10" r="1.4" fill="currentColor" />
            <path d="M10 0v3.2M10 16.8V20M0 10h3.2M16.8 10H20" stroke="currentColor" strokeWidth="0.9" />
          </svg>

          <span className="innovation-annotation-leader" />

          <span className="innovation-annotation-text">
            <span className="innovation-annotation-label">{a.label}</span>
            <span className="innovation-annotation-value">{a.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
