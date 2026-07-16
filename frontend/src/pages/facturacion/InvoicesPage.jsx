import { Link } from 'react-router-dom'

import { ResourcePage } from '../ResourcePage'

const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

export function InvoicesPage() {
  return (
    <ResourcePage
      title="Facturacion"
      description="Facturas con RTN, CAI, estado y totales para ventas minoristas y mayoristas."
      endpoint="/invoices/"
      action={
        <Link className="button" to="/facturacion/nueva">
          Nueva factura
        </Link>
      }
      columns={[
        { key: 'invoice_number', label: 'Numero', render: (row) => row.invoice_number || 'Borrador' },
        { key: 'customer_name', label: 'Cliente' },
        { key: 'status', label: 'Estado' },
        { key: 'total', label: 'Total', render: (row) => money.format(row.total ?? 0) },
      ]}
    />
  )
}
