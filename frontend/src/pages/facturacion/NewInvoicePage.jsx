import { useEffect, useMemo, useState } from 'react'

import { createResource, issueInvoice, listResource } from '../../api/services/resources'
import { PrintableInvoice } from '../../components/billing/PrintableInvoice'
import { Card } from '../../components/ui/Card'

const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

const emptyLine = {
  id: 'id-' + Math.random().toString(36).substr(2, 9),
  product: '',
  quantity: '1',
  price_type: 'retail',
  unit_price: '',
  discount: '0',
  tax_rate: '15',
}

export function NewInvoicePage() {
  const [customers, setCustomers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customer: '',
    warehouse: '',
    status: 'draft',
    notes: '',
    lines: [{ ...emptyLine }],
  })
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    rtn: '',
    phone: '',
    address: 'Olanchito, Yoro',
    customer_type: 'retail',
  })
  const [message, setMessage] = useState('')

  async function loadOptions() {
    const [customerRows, warehouseRows, productRows] = await Promise.all([
      listResource('/customers/'),
      listResource('/warehouses/'),
      listResource('/products/'),
    ])
    setCustomers(customerRows)
    setWarehouses(warehouseRows)
    setProducts(productRows)
    setForm((current) => ({
      ...current,
      customer: current.customer || customerRows[0]?.id || '',
      warehouse: current.warehouse || warehouseRows[0]?.id || '',
    }))
    return { customerRows, warehouseRows, productRows }
  }

  useEffect(() => {
    loadOptions().catch((err) => setMessage(`No se pudieron cargar catalogos: ${err.message}`))
  }, [])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(form.customer)),
    [customers, form.customer],
  )

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => String(warehouse.id) === String(form.warehouse)),
    [form.warehouse, warehouses],
  )

  const totals = useMemo(() => {
    return form.lines.reduce(
      (total, line) => {
        const quantity = Number(line.quantity) || 0
        const unitPrice = Number(line.unit_price) || 0
        const discount = Number(line.discount) || 0
        const taxRate = Number(line.tax_rate) || 0
        const gross = quantity * unitPrice
        const taxableBase = Math.max(gross - discount, 0)
        const tax = taxableBase * (taxRate / 100)

        total.subtotal += gross
        total.discount += discount
        total.tax += tax
        total.total += taxableBase + tax
        return total
      },
      { subtotal: 0, discount: 0, tax: 0, total: 0 },
    )
  }, [form.lines])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateNewCustomer(field, value) {
    setNewCustomer((current) => ({ ...current, [field]: value }))
  }

  function updateLine(lineId, field, value) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }))
  }

  function selectProduct(lineId, productId) {
    const product = products.find((item) => String(item.id) === String(productId))
    const line = form.lines.find((item) => item.id === lineId)
    const priceType = line?.price_type ?? 'retail'
    if (product) {
      setForm((current) => ({
        ...current,
        lines: current.lines.map((item) =>
          item.id === lineId
            ? {
                ...item,
                product: productId,
                unit_price: priceType === 'wholesale' ? product.wholesale_price : product.retail_price,
              }
            : item,
        ),
      }))
      return
    }
    updateLine(lineId, 'product', productId)
  }

  function changePriceType(lineId, priceType) {
    const line = form.lines.find((item) => item.id === lineId)
    const product = products.find((item) => String(item.id) === String(line?.product))
    setForm((current) => ({
      ...current,
      lines: current.lines.map((item) =>
        item.id === lineId
          ? {
              ...item,
              price_type: priceType,
              unit_price: product
                ? priceType === 'wholesale'
                  ? product.wholesale_price
                  : product.retail_price
                : item.unit_price,
            }
          : item,
      ),
    }))
  }

  function addLine() {
    setForm((current) => ({
      ...current,
      lines: [...current.lines, { ...emptyLine, id: 'id-' + Math.random().toString(36).substr(2, 9) }],
    }))
  }

  function removeLine(lineId) {
    setForm((current) => ({
      ...current,
      lines: current.lines.length === 1 ? current.lines : current.lines.filter((line) => line.id !== lineId),
    }))
  }

  function applyFirstProduct(productRows) {
    const product = productRows[0]
    if (!product) return
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, index) =>
        index === 0
          ? {
              ...line,
              product: line.product || product.id,
              unit_price: line.unit_price || product.retail_price,
            }
          : line,
      ),
    }))
  }

  async function createQuickCustomer() {
    if (!newCustomer.name.trim()) {
      setMessage('Escribe el nombre del cliente para guardarlo.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const customer = await createResource('/customers/', {
        ...newCustomer,
        rtn: newCustomer.rtn.trim(),
        name: newCustomer.name.trim(),
      })
      const refreshed = await loadOptions()
      setForm((current) => ({ ...current, customer: customer.id || refreshed.customerRows[0]?.id || '' }))
      setNewCustomer({
        name: '',
        rtn: '',
        phone: '',
        address: 'Olanchito, Yoro',
        customer_type: 'retail',
      })
      setMessage('Cliente creado y seleccionado correctamente.')
    } catch (err) {
      setMessage(`No se pudo crear el cliente: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function createDemoData() {
    setSaving(true)
    setMessage('')
    try {
      const [unitRows, categoryRows] = await Promise.all([listResource('/units/'), listResource('/categories/')])
      const unit = products[0]?.unit
        ? { id: products[0].unit }
        : unitRows[0] || (await createResource('/units/', { name: 'Libra', abbreviation: 'lb' }))
      const category = products[0]?.category
        ? { id: products[0].category }
        : categoryRows[0] ||
          (await createResource('/categories/', {
            name: 'Pollo fresco',
            description: 'Productos avicolas para venta diaria',
          }))
      const warehouse =
        warehouses[0] ??
        (await createResource('/warehouses/', {
          name: 'Bodega Olanchito',
          location: 'Olanchito, Yoro',
        }))
      const customer =
        customers[0] ??
        (await createResource('/customers/', {
          name: 'Cliente demostracion',
          rtn: '08011990123456',
          customer_type: 'retail',
          phone: '9999-0000',
          address: 'Olanchito, Yoro',
        }))

      let demoProducts = products
      if (!demoProducts.length) {
        demoProducts = await Promise.all([
          createResource('/products/', {
            sku: 'PR-001',
            name: 'Pollo entero fresco',
            category: category.id,
            unit: unit.id,
            cost: '45.00',
            retail_price: '72.00',
            wholesale_price: '65.00',
            minimum_stock: '25',
          }),
          createResource('/products/', {
            sku: 'PR-002',
            name: 'Pechuga de pollo',
            category: category.id,
            unit: unit.id,
            cost: '58.00',
            retail_price: '92.00',
            wholesale_price: '84.00',
            minimum_stock: '20',
          }),
          createResource('/products/', {
            sku: 'PR-003',
            name: 'Muslo de pollo',
            category: category.id,
            unit: unit.id,
            cost: '38.00',
            retail_price: '62.00',
            wholesale_price: '56.00',
            minimum_stock: '20',
          }),
        ])
        await Promise.all(
          demoProducts.map((product) =>
            createResource('/stock-movements/', {
              product: product.id,
              warehouse: warehouse.id,
              movement_type: 'purchase',
              quantity: '150.000',
              unit_cost: product.cost,
              reference: 'Inventario demo',
              notes: 'Carga inicial para demostracion de factura',
            }),
          ),
        )
      }

      const refreshed = await loadOptions()
      const productToUse = refreshed.productRows[0] || demoProducts[0]
      setForm((current) => ({
        ...current,
        customer: customer.id || refreshed.customerRows[0]?.id || '',
        warehouse: warehouse.id || refreshed.warehouseRows[0]?.id || '',
        lines: current.lines.map((line, index) =>
          index === 0
            ? {
                ...line,
                product: line.product || productToUse?.id || '',
                unit_price: line.unit_price || productToUse?.retail_price || '',
              }
            : line,
        ),
      }))
      applyFirstProduct(refreshed.productRows)
      setMessage('Datos demo listos para crear una factura de muestra.')
    } catch (err) {
      setMessage(`No se pudieron crear datos demo: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitInvoice(event) {
    event.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        lines: form.lines.map(({ id: _id, ...line }) => line),
      }
      const draft = await createResource('/invoices/', payload)
      const issued = await issueInvoice(draft.id)
      setCreatedInvoice(issued)
      setMessage('Factura emitida correctamente. Ya puedes imprimirla o mostrarla al cliente.')
    } catch (err) {
      setMessage(`No se pudo crear la factura: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Facturacion Honduras</span>
          <h2>Nueva factura</h2>
          <p>Crea una factura emitida, calcula ISV y genera una vista imprimible para clientes.</p>
        </div>
        <div className="report-actions">
          {import.meta.env.DEV && (
            <button className="button button--light" type="button" onClick={createDemoData} disabled={saving}>
              Crear datos demo
            </button>
          )}
          {createdInvoice && (
            <button className="button" type="button" onClick={() => window.print()}>
              Imprimir factura
            </button>
          )}
        </div>
      </div>
      <div className="invoice-layout">
        <Card title="Datos de factura">
          <form className="form-grid" onSubmit={submitInvoice}>
          <label>
            Cliente
            <select value={form.customer} onChange={(event) => updateField('customer', event.target.value)} required>
              <option value="">Seleccione cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.rtn ? `- RTN ${customer.rtn}` : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="quick-customer form-grid__full">
            <div className="quick-customer__header">
              <div>
                <strong>Crear cliente rapido</strong>
                <p>Agrega el cliente aqui mismo si no aparece en la lista.</p>
              </div>
              <button className="button button--light" type="button" onClick={createQuickCustomer} disabled={saving}>
                Guardar cliente
              </button>
            </div>
            <div className="quick-customer__grid">
              <label>
                Nombre
                <input
                  value={newCustomer.name}
                  placeholder="Ej. Pulperia El Centro"
                  onChange={(event) => updateNewCustomer('name', event.target.value)}
                />
              </label>
              <label>
                RTN
                <input
                  value={newCustomer.rtn}
                  placeholder="Opcional"
                  onChange={(event) => updateNewCustomer('rtn', event.target.value)}
                />
              </label>
              <label>
                Telefono
                <input
                  value={newCustomer.phone}
                  placeholder="Opcional"
                  onChange={(event) => updateNewCustomer('phone', event.target.value)}
                />
              </label>
              <label>
                Tipo
                <select
                  value={newCustomer.customer_type}
                  onChange={(event) => updateNewCustomer('customer_type', event.target.value)}
                >
                  <option value="retail">Minorista</option>
                  <option value="wholesale">Mayorista</option>
                </select>
              </label>
              <label className="quick-customer__full">
                Direccion
                <input
                  value={newCustomer.address}
                  onChange={(event) => updateNewCustomer('address', event.target.value)}
                />
              </label>
            </div>
          </div>
          <label>
            Almacen
            <select value={form.warehouse} onChange={(event) => updateField('warehouse', event.target.value)} required>
              <option value="">Seleccione almacen</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </label>
          <div className="invoice-lines form-grid__full">
            <div className="invoice-lines__header">
              <strong>Productos</strong>
              <button className="button button--light" type="button" onClick={addLine}>
                Agregar linea
              </button>
            </div>
            {form.lines.map((line) => (
              <div className="invoice-line" key={line.id}>
                <label>
                  Producto
                  <select value={line.product} onChange={(event) => selectProduct(line.id, event.target.value)} required>
                    <option value="">Seleccione producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cantidad
                  <input
                    min="0.001"
                    step="0.001"
                    type="number"
                    value={line.quantity}
                    onChange={(event) => updateLine(line.id, 'quantity', event.target.value)}
                  />
                </label>
                <label>
                  Precio
                  <select value={line.price_type} onChange={(event) => changePriceType(line.id, event.target.value)}>
                    <option value="retail">Minorista</option>
                    <option value="wholesale">Mayorista</option>
                  </select>
                </label>
                <label>
                  Unitario
                  <input
                    step="0.01"
                    type="number"
                    value={line.unit_price}
                    onChange={(event) => updateLine(line.id, 'unit_price', event.target.value)}
                    required
                  />
                </label>
                <button className="line-remove" type="button" onClick={() => removeLine(line.id)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <label className="form-grid__full">
            Notas
            <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </label>
          <div className="invoice-totals form-grid__full">
            <span>Subtotal</span>
            <strong>{money.format(totals.subtotal)}</strong>
            <span>Descuento</span>
            <strong>{money.format(totals.discount)}</strong>
            <span>ISV</span>
            <strong>{money.format(totals.tax)}</strong>
            <span>Total</span>
            <strong>{money.format(totals.total)}</strong>
          </div>
            <button
              className="button"
              type="submit"
              disabled={saving || !products.length || !customers.length || !warehouses.length}
            >
              {saving ? 'Emitiendo...' : 'Emitir factura'}
            </button>
          </form>
          {message && <p className="form-message">{message}</p>}
        </Card>
        <Card title="Vista para cliente" eyebrow="Factura">
          <PrintableInvoice
            customer={selectedCustomer}
            invoice={createdInvoice}
            lines={form.lines}
            products={products}
            totals={totals}
            warehouse={selectedWarehouse}
          />
        </Card>
      </div>
    </div>
  )
}
