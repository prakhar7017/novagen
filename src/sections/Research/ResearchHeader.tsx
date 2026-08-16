import {
  RESEARCH_HEADLINE,
  RESEARCH_INDEX,
  RESEARCH_LABEL,
  RESEARCH_LEAD,
  RESEARCH_META,
} from './research.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
}

export default function ResearchHeader({ rootRef }: Props) {
  return (
    <header ref={rootRef} className="research-header">
      <div className="research-label">
        <span className="research-label-name">
          <span className="research-label-index">{RESEARCH_INDEX}</span>
          <span className="research-label-slash" aria-hidden="true">
            /
          </span>
          {RESEARCH_LABEL}
        </span>

        <span className="research-label-meta">
          <span className="research-label-meta-key">{RESEARCH_META.key}</span>
          <span className="research-label-meta-val">{RESEARCH_META.value}</span>
        </span>
      </div>

      <div className="research-header-body">
        <h2 id="research-title" className="research-headline">
          {RESEARCH_HEADLINE.map((line) => (
            <span key={line} className="line-clip">
              <span className="line-inner">{line}</span>
            </span>
          ))}
        </h2>

        <p className="research-lead">{RESEARCH_LEAD}</p>
      </div>
    </header>
  )
}
