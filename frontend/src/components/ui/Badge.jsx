export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const tones = {
    cancelled: 'danger',
    draft: 'neutral',
    issued: 'warning',
    paid: 'success',
  }
  const labels = {
    cancelled: 'Anulada',
    draft: 'Borrador',
    issued: 'Emitida',
    paid: 'Pagada',
  }
  return <Badge tone={tones[status] ?? 'neutral'}>{labels[status] ?? status}</Badge>
}
