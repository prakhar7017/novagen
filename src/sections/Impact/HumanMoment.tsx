import { HUMAN_MOMENT, HUMAN_SRC } from './impact.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  frameRef: React.RefObject<HTMLDivElement | null>
  loaded: boolean
}

export default function HumanMoment({ rootRef, frameRef, loaded }: Props) {
  return (
    <div ref={rootRef} className="impact-human">
      <div ref={frameRef} className="impact-human-frame">
        {loaded && (
          <img
            className="impact-human-image"
            src={HUMAN_SRC}
            alt={HUMAN_MOMENT.alt}
            width={720}
            height={450}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      <div className="impact-human-copy">
        <span className="impact-human-label">{HUMAN_MOMENT.label}</span>
        <p className="impact-human-statement">
          {HUMAN_MOMENT.statement.map((line) => (
            <span key={line} className="impact-human-line">
              {line}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
