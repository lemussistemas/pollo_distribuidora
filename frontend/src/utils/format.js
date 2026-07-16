export const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

export const number = new Intl.NumberFormat('es-HN')

export function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatStatus(status) {
  const labels = {
    cancelled: 'Anulada',
    draft: 'Borrador',
    issued: 'Emitida',
    paid: 'Pagada',
  }
  return labels[status] ?? status
}
