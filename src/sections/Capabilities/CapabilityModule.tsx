import type { ReactNode } from 'react'
import type { Capability } from './capabilities.constants'

interface Props {
  capability: Capability
  children: ReactNode
  moduleRef: (el: HTMLElement | null) => void
}

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

        <div className="cap-module-meta" aria-hidden="true">
          <span className="cap-module-meta-key">{capability.meta[0]}</span>
          <span className="cap-module-meta-val">{capability.meta[1]}</span>
        </div>
      </div>
    </article>
  )
}
