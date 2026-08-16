import { IMPACT_METRICS, type ImpactMetric } from './impact.constants'

interface Props {
  metricsRef: React.RefObject<(HTMLElement | null)[]>
}

/**
 * One metric: the figure, what it counts, and what it means.
 *
 * Shared by both presentations, because §50 requires the statistics to be
 * readable as actual text rather than reconstructed from an animation — the
 * pinned stage stacks these three in one box and separates them with opacity,
 * and the flowing layout puts them in three blocks. Either way the same markup
 * carries the same words.
 *
 * The figure is split so the unit can take Bio Green alone (§30). Splitting it
 * has a second, better reason than colour: "14.8" and "M" mean different things,
 * and a reader who sees the suffix change from M to × to % is being told the
 * three numbers are not the same kind of quantity.
 */
export function MetricBody({ metric }: { metric: ImpactMetric }) {
  return (
    <>
      <div className="impact-metric-state">
        <span className="impact-metric-index">{metric.index}</span>
        <span className="impact-metric-slash" aria-hidden="true">
          /
        </span>
        {metric.label}
      </div>

      {/* One clip box, one mask — §39 asks the outgoing figure to lift out of
          the same window the incoming one rises into. */}
      <p className="impact-metric-figure line-clip">
        <span className="impact-metric-value">
          {metric.value}
          <span className="impact-metric-suffix">{metric.suffix}</span>
        </span>
      </p>

      <h3 className="impact-metric-description impact-metric-line">{metric.description}</h3>

      <p className="impact-metric-statement impact-metric-line">{metric.statement}</p>

      {/* Thin mono readouts. Decorative by construction: nothing they state is
          missing from the description and statement above them (§14, §18). */}
      <dl className="impact-metric-meta impact-metric-line" aria-hidden="true">
        {metric.meta.map(([key, value]) => (
          <div key={key} className="impact-metric-meta-row">
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

/**
 * The three metric states, stacked in one box (§12).
 *
 * All three are in the document at all times and only opacity and a transform
 * separate them, so the whole SCALE → PRIORITIZE → VALIDATE argument is
 * available to a screen reader in order even though the eye sees one at a time.
 * Nothing here is ever `display: none` or `aria-hidden` for that reason.
 *
 * An ordered list rather than three divs: the sequence is the meaning.
 */
export default function ImpactMetrics({ metricsRef }: Props) {
  return (
    <ol className="impact-metrics">
      {IMPACT_METRICS.map((metric, i) => (
        <li
          key={metric.id}
          ref={(el) => {
            if (metricsRef.current) metricsRef.current[i] = el
          }}
          className="impact-metric"
          // The first state is legible before any timeline runs, so the section
          // is never blank if JavaScript is slow to arrive.
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <MetricBody metric={metric} />
        </li>
      ))}
    </ol>
  )
}
