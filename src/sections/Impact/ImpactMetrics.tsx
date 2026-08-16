import { IMPACT_METRICS, type ImpactMetric } from './impact.constants'

interface Props {
  metricsRef: React.RefObject<(HTMLElement | null)[]>
}

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

      <p className="impact-metric-figure line-clip">
        <span className="impact-metric-value">
          {metric.value}
          <span className="impact-metric-suffix">{metric.suffix}</span>
        </span>
      </p>

      <h3 className="impact-metric-description impact-metric-line">{metric.description}</h3>

      <p className="impact-metric-statement impact-metric-line">{metric.statement}</p>

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
          style={{ opacity: i === 0 ? 1 : 0 }}
        >
          <MetricBody metric={metric} />
        </li>
      ))}
    </ol>
  )
}
