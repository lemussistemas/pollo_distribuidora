import { money } from '../../utils/format'

export function PrintableInvoice({ customer, invoice, lines = [], products = [], totals = {}, warehouse }) {
  const printableLines = invoice?.lines?.length
    ? invoice.lines
    : lines.map((line) => {
        const product = products.find((item) => String(item.id) === String(line.product))
        const quantity = Number(line.quantity) || 0
        const unitPrice = Number(line.unit_price) || 0
        const discount = Number(line.discount) || 0
        const tax = Math.max(quantity * unitPrice - discount, 0) * ((Number(line.tax_rate) || 0) / 100)
        return {
          ...line,
          product_name: product?.name ?? 'Producto',
          product_sku: product?.sku ?? '',
          line_total: quantity * unitPrice - discount + tax,
        }
      })

  return (
    <div className="invoice-preview">
      <div className="invoice-preview__header">
        <div>
          <span className="eyebrow">Distribuidora Pollo Rey</span>
          <h3>Factura de venta</h3>
          <p>Olanchito, Yoro, Honduras</p>
        </div>
        <div>
          <strong>{invoice?.invoice_number ?? 'Vista previa'}</strong>
          <span>{invoice?.status === 'issued' || invoice?.status === 'paid' ? 'Emitida' : 'Sin emitir'}</span>
        </div>
      </div>
      <div className="invoice-preview__meta">
        <p>
          <strong>Cliente:</strong> {invoice?.customer_name ?? customer?.name ?? 'Seleccione cliente'}
        </p>
        <p>
          <strong>RTN:</strong> {customer?.rtn || 'Consumidor final'}
        </p>
        <p>
          <strong>Almacen:</strong> {invoice?.warehouse_name ?? warehouse?.name ?? 'Seleccione almacen'}
        </p>
        <p>
          <strong>CAI:</strong> {invoice?.cai || 'Pendiente de configurar'}
        </p>
      </div>
      <table className="invoice-preview__table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {printableLines.map((line, index) => (
            <tr key={line.id ?? index}>
              <td>
                {line.product_sku ? `${line.product_sku} - ` : ''}
                {line.product_name}
              </td>
              <td>{line.quantity}</td>
              <td>{money.format(line.unit_price ?? 0)}</td>
              <td>{money.format(line.line_total ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-preview__totals">
        <span>Subtotal</span>
        <strong>{money.format(invoice?.subtotal ?? totals.subtotal ?? 0)}</strong>
        <span>Descuento</span>
        <strong>{money.format(invoice?.discount_total ?? totals.discount ?? 0)}</strong>
        <span>ISV</span>
        <strong>{money.format(invoice?.tax_total ?? totals.tax ?? 0)}</strong>
        <span>Total a pagar</span>
        <strong>{money.format(invoice?.total ?? totals.total ?? 0)}</strong>
      </div>
      <p className="invoice-preview__footer">Gracias por comprar en Distribuidora Pollo Rey, Olanchito.</p>
    </div>
  )
}
