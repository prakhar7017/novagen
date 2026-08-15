import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HEADLINE_NARROW, HEADLINE_WIDE } from './innovation.constants'

interface Props {
  /** Trigger for the header's own reveal */
  rootRef: React.RefObject<HTMLDivElement | null>
  metaRef: React.RefObject<HTMLDivElement | null>
  linesRef: React.RefObject<(HTMLSpanElement | null)[]>
}

/**
 * Section metadata and the editorial statement.
 *
 * The headline is the section's visual hierarchy peak (prompt §47): everything
 * else — the microscopy frame, the copy, the instrumentation — is sized under
 * it. Each line sits in its own clip box so it can rise into place rather than
 * fading up as a block.
 */
export default function InnovationHeader({ rootRef, metaRef, linesRef }: Props) {
  // 640px is where the two-line form stops fitting: the longer line measures
  // ~10.45em, and below this the type would have to drop under the size the
  // brief specifies to keep it on one line.
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

        {/* Right-hand readout, deliberately faint — hidden below 900px where it
            would compete with the section number for a short line of space. */}
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
              {/* The single Bio Green accent in the whole section. A dark halo
                  keeps a 10px green glyph legible on Bone, where the raw brand
                  green would otherwise sit at roughly 1.3:1. */}
              {line.accent && <span className="innovation-accent">.</span>}
            </span>
          </span>
        ))}
      </h2>
    </div>
  )
}
