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

/**
 * The section header (§10–§13).
 *
 * An editorial spread rather than a centred introduction: the label and
 * headline hold the left, the supporting copy sits low on the right, and the
 * asymmetry between them is the section's first statement about what kind of
 * page this is. Nothing is centred anywhere in Research.
 *
 * The headline is the largest type since the Hero and the last large type on
 * the page before Impact — Research is where the site stops explaining itself
 * and starts showing work, so it is allowed one clear declarative line.
 */
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

        {/* The right-hand readout every section since Innovation carries.
            "Portfolio concept" is doing real work here: it is the line that
            keeps a page of fictional studies from reading as a claim. */}
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
