import { HUMAN_MOMENT, HUMAN_SRC } from './impact.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  frameRef: React.RefObject<HTMLDivElement | null>
  /** False until the section reaches its validated state — see §52 */
  loaded: boolean
}

/**
 * The human outcome moment (§26, §27).
 *
 * One small crop and three short lines, at the end of a section that has spent
 * three states talking about quantities. §27 is emphatic that this must not
 * turn the page into healthcare stock photography, so the frame is ~320px wide,
 * it sits below and to the side of the validated candidate rather than
 * replacing it, and it leaves before the closing collapse.
 *
 * The image is only requested once the section reaches its final state (§52):
 * the src is empty until `loaded`, so nothing is fetched at page load for a
 * moment two and a half viewports down the page.
 */
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
