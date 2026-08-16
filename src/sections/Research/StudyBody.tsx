import ResearchMetadata from './ResearchMetadata'
import type { ResearchStudy } from './research.types'

interface Props {
  study: ResearchStudy
}

/**
 * The text column shared by all three studies.
 *
 * The one piece of Research that is genuinely repeated: index, title, summary,
 * metadata, in that order, at the same sizes every time. What differs between
 * the studies is where this column sits and what it sits beside — which is a
 * layout question, and belongs to the three study components rather than to a
 * prop on this one (§54).
 */
export default function StudyBody({ study }: Props) {
  return (
    <div className="study-body">
      <p className="study-index">
        <span className="study-index-mark" aria-hidden="true" />
        Study / {study.index}
      </p>

      <h3 className="study-title">
        {study.title.map((line) => (
          <span key={line} className="line-clip">
            <span className="line-inner">{line}</span>
          </span>
        ))}
      </h3>

      <p className="study-summary">{study.summary}</p>

      <ResearchMetadata items={study.meta} />
    </div>
  )
}
