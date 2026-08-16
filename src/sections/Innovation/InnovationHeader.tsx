import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HEADLINE_NARROW, HEADLINE_WIDE } from './innovation.constants'

interface Props {
  rootRef: React.RefObject<HTMLDivElement | null>
  metaRef: React.RefObject<HTMLDivElement | null>
  linesRef: React.RefObject<(HTMLSpanElement | null)[]>
}

export default function InnovationHeader({ rootRef, metaRef, linesRef }: Props) {
  const narrow = useMediaQuery('(max-width: 640px)')
  const headline = narrow ? HEADLINE_NARROW : HEADLINE_WIDE

  return (
    <div ref={rootRef} className="innovation-header">
      <div ref={metaRef} className="innovation-meta">
        <span className="innovation-meta-label">
          <span className="innovation-meta-index">03</span>
          <span className="innovation-meta-slash" aria-hidden="true">
            /
          </span>
          Innovation
        </span>

        <span className="innovation-meta-scale" aria-hidden="true">
          <span className="innovation-meta-scale-key">System scale</span>
          <span className="innovation-meta-scale-val">Cell → Tissue → Organism</span>
        </span>
      </div>

      <h2 id="innovation-title" className="innovation-headline">
        {headline.map((line, i) => (
          <span key={line.text} className="line-clip">
            <span
              ref={(el) => {
                if (linesRef.current) linesRef.current[i] = el
              }}
              style={{ display: 'block' }}
            >
              {line.text}
              {line.accent && <span className="innovation-accent">.</span>}
            </span>
          </span>
        ))}
      </h2>
    </div>
  )
}
