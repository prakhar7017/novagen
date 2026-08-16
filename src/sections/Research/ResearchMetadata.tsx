import type { StudyMeta } from './research.types'

interface Props {
  items: readonly StudyMeta[]
}

export default function ResearchMetadata({ items }: Props) {
  return (
    <dl className="study-meta">
      {items.map((item) => (
        <div key={item.key} className="study-meta-row">
          <span className="study-meta-rule" aria-hidden="true" />
          <dt className="study-meta-key">{item.key}</dt>
          <dd className="study-meta-val">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
