import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listResource } from '../../api/services/resources'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { formatDate, money } from '../../utils/format'

export function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    listResource('/invoices/')
      .then(setInvoices)
      .catch((err) => setMessage(`No se pudieron cargar facturas: ${err.message}`))
  }, [])

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices
    return invoices.filter((invoice) => invoice.status === statusFilter)
  }, [invoices, statusFilter])

  const totals = useMemo(
    () =>
      invoices.reduce(
        (summary, invoice) => {
          summary.total += Number(invoice.total || 0)
          summary[invoice.status] = (summary[invoice.status] || 0) + 1
          return summary
        },
        { total: 0 },
      ),
    [invoices],
  )

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Facturacion | Comercial</span>
          <h2>Control de facturas</h2>
          <p>Listado profesional para revisar, imprimir, pagar o anular facturas.</p>
        </div>
        <Link className="button" to="/facturacion/nueva">
          Nueva factura
        </Link>
      </div>
      {message && <p className="error-state">{message}</p>}
      <div className="kpi-grid">
        <Card title={invoices.length} eyebrow="Facturas">
          <p>Total de documentos registrados.</p>
        </Card>
        <Card title={money.format(totals.total)} eyebrow="Monto facturado">
          <p>Incluye facturas emitidas y pagadas.</p>
        </Card>
        <Card title={totals.issued ?? 0} eyebrow="Pendientes de pago">
          <p>Facturas emitidas aun no pagadas.</p>
        </Card>
        <Card title={totals.paid ?? 0} eyebrow="Pagadas">
          <p>Documentos cobrados completamente.</p>
        </Card>
      </div>
      <Card
        title="Facturas registradas"
        eyebrow="Listado"
        action={
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="issued">Emitida</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Anulada</option>
          </select>
        }
      >
        <DataTable
          searchable
          searchPlaceholder="Buscar por numero, cliente o estado..."
          columns={[
            { key: 'invoice_number', label: 'Numero', render: (row) => row.invoice_number || 'Borrador' },
            { key: 'customer_name', label: 'Cliente' },
            { key: 'issued_at', label: 'Fecha', render: (row) => formatDate(row.issued_at || row.created_at) },
            { key: 'status', label: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
            { key: 'total', label: 'Total', render: (row) => money.format(row.total ?? 0) },
          ]}
          rows={filteredInvoices}
          actions={(row) => (
            <>
              <Link className="button button--light button--sm" to={`/facturacion/${row.id}`}>
                Ver
              </Link>
              {row.status === 'issued' && <Badge tone="warning">Cobrar</Badge>}
            </>
          )}
        />
      </Card>
    </div>
  )
}
