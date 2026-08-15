import type { ReactNode } from 'react'
import type { Capability } from './capabilities.constants'

interface Props {
  capability: Capability
  /** The scientific visual — the module's own instrument */
  children: ReactNode
  moduleRef: (el: HTMLElement | null) => void
}

/**
 * The shell every capability shares.
 *
 * An `<article>` with a heading and a paragraph, and nothing more (§48): the
 * module is not a link, so it is not a button, and the visual inside it is
 * hidden from assistive technology because everything it says is said again in
 * the copy. A visitor who never moves a pointer loses no information.
 *
 * The hover response lives on the border and on one small marker (§28–§30) —
 * the container itself does not move, because the interaction is supposed to
 * happen inside the instrument, not to the card holding it.
 */
export default function CapabilityModule({ capability, children, moduleRef }: Props) {
  return (
    <article
      ref={moduleRef}
      className={`cap-module cap-module--${capability.id}`}
      data-capability={capability.id}
    >
      <div className="cap-module-visual">{children}</div>

      <div className="cap-module-body">
        <div className="cap-module-line" aria-hidden="true">
          <span className="cap-module-index">{capability.index}</span>
          <span className="cap-module-marker" />
        </div>

        <h3 className="cap-module-title">{capability.title}</h3>
        <p className="cap-module-desc">{capability.description}</p>

        {/* Decorative: every fact implied here is already stated above it. */}
        <div className="cap-module-meta" aria-hidden="true">
          <span className="cap-module-meta-key">{capability.meta[0]}</span>
          <span className="cap-module-meta-val">{capability.meta[1]}</span>
        </div>
      </div>
    </article>
  )
}
