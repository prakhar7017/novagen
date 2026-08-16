import type { StudyMeta } from './research.types'

interface Props {
  items: readonly StudyMeta[]
}

/**
 * A study's metadata block.
 *
 * A description list rather than a row of chips: these are properties of the
 * study, and marking them up as one gives the reader of a screen reader the
 * pairing that the hairline rules give everyone else.
 *
 * Each rule is drawn from zero width as the study arrives (§22). They are the
 * only animated element in the text column, which is what keeps the entrance
 * feeling measured rather than staged.
 */
export default function ResearchMetadata({ items }: Props) {
  return (
    <dl className="study-meta">
      {items.map((item) => (
        <div key={item.key} className="study-meta-row">
          <span className="study-meta-rule" aria-hidden="true" />
          <dt className="study-meta-key">{item.key}</dt>
          {/* Authored in final case — see the note on the annotations. */}
          <dd className="study-meta-val">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
