export function EmptyState({ title = 'Sin datos registrados', message = 'Cuando agregues informacion aparecera aqui.' }) {
  return (
    <div className="empty-panel">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
