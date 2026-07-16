const number = new Intl.NumberFormat('es-HN')

export function BarChart({ items, valueFormatter = (value) => number.format(value) }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1)

  return (
    <div className="bar-chart">
      {items.map((item) => {
        const value = Number(item.value) || 0
        const width = `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%`

        return (
          <div className="bar-chart__row" key={item.label}>
            <div className="bar-chart__meta">
              <span>{item.label}</span>
              <strong>{valueFormatter(value)}</strong>
            </div>
            <div className="bar-chart__track">
              <span className="bar-chart__bar" style={{ width }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DonutChart({ value, total, label }) {
  const safeTotal = Math.max(Number(total) || 0, 1)
  const safeValue = Math.min(Number(value) || 0, safeTotal)
  const percent = Math.round((safeValue / safeTotal) * 100)

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 42 42" role="img" aria-label={`${label}: ${percent}%`}>
        <circle className="donut-chart__bg" cx="21" cy="21" r="15.9" />
        <circle
          className="donut-chart__value"
          cx="21"
          cy="21"
          r="15.9"
          strokeDasharray={`${percent} ${100 - percent}`}
        />
      </svg>
      <div>
        <strong>{percent}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
