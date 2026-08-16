import ResearchMetadata from './ResearchMetadata'
import type { ResearchStudy } from './research.types'

interface Props {
  study: ResearchStudy
}

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
