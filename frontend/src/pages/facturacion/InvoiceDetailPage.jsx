import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PrintableInvoice } from '../../components/billing/PrintableInvoice'
import { StatusBadge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { getResource, postAction } from '../../api/services/resources'
import { formatDate, money } from '../../utils/format'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadInvoice = useCallback(async () => {
    const data = await getResource(`/invoices/${id}/`)
    setInvoice(data)
  }, [id])

  useEffect(() => {
    loadInvoice().catch((err) => setMessage(`No se pudo cargar factura: ${err.message}`))
  }, [loadInvoice])

  async function payInvoice() {
    setSaving(true)
    setMessage('')
    try {
      await postAction(`/invoices/${id}/pay/`, { amount: invoice.total, method: 'cash', reference: 'Pago contado' })
      await loadInvoice()
      setMessage('Pago registrado correctamente.')
    } catch (err) {
      setMessage(`No se pudo registrar pago: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function cancelInvoice() {
    if (!window.confirm('Seguro que deseas anular esta factura?')) return
    setSaving(true)
    setMessage('')
    try {
      await postAction(`/invoices/${id}/cancel/`, { reason: 'Anulacion desde sistema' })
      await loadInvoice()
      setMessage('Factura anulada correctamente.')
    } catch (err) {
      setMessage(`No se pudo anular factura: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!invoice) {
    return <p className="empty-state">Cargando factura...</p>
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Factura | Detalle</span>
          <h2>{invoice.invoice_number || `Factura #${invoice.id}`}</h2>
          <p>
            {invoice.customer_name} | {formatDate(invoice.issued_at || invoice.created_at)} |{' '}
            <StatusBadge status={invoice.status} />
          </p>
        </div>
        <div className="report-actions">
          <Link className="button button--light" to="/facturacion">
            Volver
          </Link>
          <button className="button button--light" type="button" onClick={() => window.print()}>
            Imprimir
          </button>
          {invoice.status === 'issued' && (
            <button className="button" type="button" onClick={payInvoice} disabled={saving}>
              Registrar pago
            </button>
          )}
          {invoice.status !== 'cancelled' && (
            <button className="button button--danger" type="button" onClick={cancelInvoice} disabled={saving}>
              Anular
            </button>
          )}
        </div>
      </div>
      {message && <p className="form-message">{message}</p>}
      <div className="kpi-grid">
        <Card title={money.format(invoice.subtotal)} eyebrow="Subtotal">
          <p>Base antes de ISV y descuentos.</p>
        </Card>
        <Card title={money.format(invoice.tax_total)} eyebrow="ISV">
          <p>Impuesto aplicado a la venta.</p>
        </Card>
        <Card title={money.format(invoice.total)} eyebrow="Total">
          <p>Monto total a cobrar.</p>
        </Card>
        <Card title={invoice.payments?.length ?? 0} eyebrow="Pagos">
          <p>Pagos registrados para esta factura.</p>
        </Card>
      </div>
      <Card title="Documento para cliente" eyebrow="Impresion">
        <PrintableInvoice invoice={invoice} />
      </Card>
      <Card title="Pagos registrados" eyebrow="Cobros">
        <DataTable
          columns={[
            { key: 'paid_at', label: 'Fecha', render: (row) => formatDate(row.paid_at) },
            { key: 'method', label: 'Metodo' },
            { key: 'reference', label: 'Referencia' },
            { key: 'amount', label: 'Monto', render: (row) => money.format(row.amount ?? 0) },
          ]}
          rows={invoice.payments ?? []}
        />
      </Card>
    </div>
  )
}
