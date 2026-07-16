import { useEffect, useMemo, useState } from 'react'

import { createResource, listResource } from '../../api/services/resources'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { money, number } from '../../utils/format'

const tabs = ['existencias', 'productos', 'movimientos', 'almacenes']

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState('existencias')
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stockLevels, setStockLevels] = useState([])
  const [movements, setMovements] = useState([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category: '',
    unit: '',
    cost: '',
    retail_price: '',
    wholesale_price: '',
    minimum_stock: '0',
  })
  const [movementForm, setMovementForm] = useState({
    product: '',
    warehouse: '',
    movement_type: 'purchase',
    quantity: '',
    unit_cost: '',
    reference: '',
    notes: '',
  })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: 'Olanchito, Yoro' })

  async function loadInventory() {
    const [categoryRows, unitRows, productRows, warehouseRows, stockRows, movementRows] = await Promise.all([
      listResource('/categories/'),
      listResource('/units/'),
      listResource('/products/'),
      listResource('/warehouses/'),
      listResource('/stock-levels/'),
      listResource('/stock-movements/'),
    ])
    setCategories(categoryRows)
    setUnits(unitRows)
    setProducts(productRows)
    setWarehouses(warehouseRows)
    setStockLevels(stockRows)
    setMovements(movementRows)
    setProductForm((current) => ({
      ...current,
      category: current.category || categoryRows[0]?.id || '',
      unit: current.unit || unitRows[0]?.id || '',
    }))
    setMovementForm((current) => ({
      ...current,
      product: current.product || productRows[0]?.id || '',
      warehouse: current.warehouse || warehouseRows[0]?.id || '',
    }))
  }

  useEffect(() => {
    loadInventory().catch((err) => setMessage(`No se pudo cargar inventario: ${err.message}`))
  }, [])

  const summary = useMemo(() => {
    const lowStock = stockLevels.filter((item) => Number(item.quantity) <= Number(item.minimum_stock ?? 0))
    const inventoryValue = stockLevels.reduce((sum, item) => {
      const product = products.find((row) => row.id === item.product)
      return sum + Number(item.quantity || 0) * Number(product?.cost || 0)
    }, 0)
    return { lowStock: lowStock.length, inventoryValue }
  }, [products, stockLevels])

  function updateProduct(field, value) {
    setProductForm((current) => ({ ...current, [field]: value }))
  }

  function updateMovement(field, value) {
    setMovementForm((current) => ({ ...current, [field]: value }))
  }

  async function submitProduct(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/products/', productForm)
      await loadInventory()
      setProductForm((current) => ({ ...current, sku: '', name: '', cost: '', retail_price: '', wholesale_price: '' }))
      setMessage('Producto creado correctamente.')
    } catch (err) {
      setMessage(`No se pudo crear producto: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitMovement(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/stock-movements/', movementForm)
      await loadInventory()
      setMovementForm((current) => ({ ...current, quantity: '', reference: '', notes: '' }))
      setMessage('Movimiento registrado correctamente.')
    } catch (err) {
      setMessage(`No se pudo registrar movimiento: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitWarehouse(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/warehouses/', warehouseForm)
      await loadInventory()
      setWarehouseForm({ name: '', location: 'Olanchito, Yoro' })
      setMessage('Almacen creado correctamente.')
    } catch (err) {
      setMessage(`No se pudo crear almacen: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="inventory-hero">
        <div>
          <span className="eyebrow">Inventario | Catalogo</span>
          <h2>Control operativo de producto y existencias</h2>
          <p>Administra productos, almacenes, entradas, salidas, ajustes y alertas de minimo.</p>
        </div>
        <div className="hero-score">
          <span>Valor inventario</span>
          <strong>{money.format(summary.inventoryValue)}</strong>
        </div>
      </section>
      {message && <p className="form-message">{message}</p>}
      <div className="kpi-grid">
        <Card title={products.length} eyebrow="Productos">
          <p>Catalogo activo para facturacion.</p>
        </Card>
        <Card title={warehouses.length} eyebrow="Almacenes">
          <p>Bodegas o puntos de despacho.</p>
        </Card>
        <Card title={summary.lowStock} eyebrow="Bajo minimo">
          <p>Productos que requieren reposicion.</p>
        </Card>
        <Card title={movements.length} eyebrow="Movimientos">
          <p>Trazabilidad de entradas y salidas.</p>
        </Card>
      </div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button className={activeTab === tab ? 'tab is-active' : 'tab'} key={tab} onClick={() => setActiveTab(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'existencias' && (
        <Card title="Existencias actuales" eyebrow="Stock">
          <DataTable
            searchable
            columns={[
              { key: 'product_sku', label: 'SKU' },
              { key: 'product_name', label: 'Producto' },
              { key: 'warehouse_name', label: 'Almacen' },
              { key: 'quantity', label: 'Existencia', render: (row) => number.format(row.quantity ?? 0) },
            ]}
            rows={stockLevels}
          />
        </Card>
      )}

      {activeTab === 'productos' && (
        <div className="inventory-grid">
          <Card title="Nuevo producto" eyebrow="Catalogo">
            <form className="inventory-form" onSubmit={submitProduct}>
              <label>SKU<input value={productForm.sku} onChange={(event) => updateProduct('sku', event.target.value)} required /></label>
              <label>Nombre<input value={productForm.name} onChange={(event) => updateProduct('name', event.target.value)} required /></label>
              <label>Categoria<select value={productForm.category} onChange={(event) => updateProduct('category', event.target.value)}>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>Unidad<select value={productForm.unit} onChange={(event) => updateProduct('unit', event.target.value)}>{units.map((row) => <option key={row.id} value={row.id}>{row.abbreviation}</option>)}</select></label>
              <label>Costo<input type="number" step="0.01" value={productForm.cost} onChange={(event) => updateProduct('cost', event.target.value)} required /></label>
              <label>Precio minorista<input type="number" step="0.01" value={productForm.retail_price} onChange={(event) => updateProduct('retail_price', event.target.value)} required /></label>
              <label>Precio mayorista<input type="number" step="0.01" value={productForm.wholesale_price} onChange={(event) => updateProduct('wholesale_price', event.target.value)} required /></label>
              <label>Stock minimo<input type="number" step="0.001" value={productForm.minimum_stock} onChange={(event) => updateProduct('minimum_stock', event.target.value)} /></label>
              <button className="button" type="submit" disabled={saving}>Guardar producto</button>
            </form>
          </Card>
          <Card title="Productos" eyebrow="Lista">
            <DataTable searchable columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'name', label: 'Producto' },
              { key: 'retail_price', label: 'Minorista', render: (row) => money.format(row.retail_price ?? 0) },
              { key: 'wholesale_price', label: 'Mayorista', render: (row) => money.format(row.wholesale_price ?? 0) },
            ]} rows={products} />
          </Card>
        </div>
      )}

      {activeTab === 'movimientos' && (
        <div className="inventory-grid">
          <Card title="Registrar movimiento" eyebrow="Entrada / salida / ajuste">
            <form className="inventory-form" onSubmit={submitMovement}>
              <label>Producto<select value={movementForm.product} onChange={(event) => updateMovement('product', event.target.value)}>{products.map((row) => <option key={row.id} value={row.id}>{row.sku} - {row.name}</option>)}</select></label>
              <label>Almacen<select value={movementForm.warehouse} onChange={(event) => updateMovement('warehouse', event.target.value)}>{warehouses.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>Tipo<select value={movementForm.movement_type} onChange={(event) => updateMovement('movement_type', event.target.value)}><option value="purchase">Entrada compra</option><option value="adjustment">Ajuste entrada</option><option value="transfer_out">Salida manual</option></select></label>
              <label>Cantidad<input type="number" step="0.001" value={movementForm.quantity} onChange={(event) => updateMovement('quantity', event.target.value)} required /></label>
              <label>Costo<input type="number" step="0.01" value={movementForm.unit_cost} onChange={(event) => updateMovement('unit_cost', event.target.value)} /></label>
              <label>Referencia<input value={movementForm.reference} onChange={(event) => updateMovement('reference', event.target.value)} /></label>
              <label className="inventory-form__full">Notas<textarea value={movementForm.notes} onChange={(event) => updateMovement('notes', event.target.value)} /></label>
              <button className="button" type="submit" disabled={saving}>Guardar movimiento</button>
            </form>
          </Card>
          <Card title="Movimientos recientes" eyebrow="Trazabilidad">
            <DataTable searchable columns={[
              { key: 'created_at', label: 'Fecha' },
              { key: 'movement_type', label: 'Tipo' },
              { key: 'product_name', label: 'Producto' },
              { key: 'warehouse_name', label: 'Almacen' },
              { key: 'quantity', label: 'Cantidad' },
            ]} rows={movements} />
          </Card>
        </div>
      )}

      {activeTab === 'almacenes' && (
        <div className="inventory-grid">
          <Card title="Nuevo almacen" eyebrow="Bodega">
            <form className="inventory-form" onSubmit={submitWarehouse}>
              <label>Nombre<input value={warehouseForm.name} onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label>Ubicacion<input value={warehouseForm.location} onChange={(event) => setWarehouseForm((current) => ({ ...current, location: event.target.value }))} /></label>
              <button className="button" type="submit" disabled={saving}>Guardar almacen</button>
            </form>
          </Card>
          <Card title="Almacenes" eyebrow="Lista">
            <DataTable searchable columns={[
              { key: 'name', label: 'Nombre' },
              { key: 'location', label: 'Ubicacion' },
              { key: 'is_active', label: 'Activo', render: (row) => (row.is_active ? 'Si' : 'No') },
            ]} rows={warehouses} />
          </Card>
        </div>
      )}
    </div>
  )
}
