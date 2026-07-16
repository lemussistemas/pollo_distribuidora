import { useEffect, useState } from 'react'

import {
  getIncomeStatement,
  getInventoryReport,
  getProductivityReport,
  getSalesReport,
} from '../api/services/reports'
import { Card } from '../components/ui/Card'
import { BarChart, DonutChart } from '../components/ui/Charts'

const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

export function DashboardPage() {
  const [summary, setSummary] = useState({
    sales: null,
    inventory: null,
    productivity: null,
    income: null,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSummary() {
      const [sales, inventory, productivity, income] = await Promise.all([
        getSalesReport(),
        getInventoryReport(),
        getProductivityReport(),
        getIncomeStatement(),
      ])
      setSummary({ sales, inventory, productivity, income })
    }

    loadSummary().catch((err) => setError(err.message))
  }, [])

  const revenue = Number(summary.income?.revenue ?? 0)
  const cost = Number(summary.income?.cost_of_goods_sold ?? 0)
  const profit = Number(summary.income?.gross_profit ?? 0)
  const productCount = Number(summary.inventory?.product_count ?? 0)
  const lowStockCount = Number(summary.inventory?.low_stock_count ?? 0)
  const inventoryHealth = Math.max(productCount - lowStockCount, 0)

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Resumen ejecutivo | Olanchito</span>
          <h2>Control diario de Distribuidora Pollo Rey</h2>
          <p>
            Vista gerencial para ventas, inventario, productividad y rentabilidad con datos en
            tiempo real desde Django REST.
          </p>
        </div>
        <div className="hero-score">
          <span>Utilidad bruta</span>
          <strong>{money.format(profit)}</strong>
        </div>
      </section>
      {error && <p className="error-state">No se pudieron cargar indicadores: {error}</p>}
      <div className="kpi-grid">
        <Card title={money.format(summary.sales?.total ?? 0)} eyebrow="Ventas del periodo">
          <p>{summary.sales?.invoice_count ?? 0} facturas emitidas con RTN / CAI.</p>
        </Card>
        <Card title={lowStockCount} eyebrow="Alertas de inventario">
          <p>{productCount} productos con existencia registrada.</p>
        </Card>
        <Card title={summary.productivity?.metrics?.length ?? 0} eyebrow="Productividad">
          <p>Metricas operativas consolidadas para bodega y venta.</p>
        </Card>
        <Card title={money.format(revenue)} eyebrow="Ingresos">
          <p>Costo de ventas: {money.format(cost)}</p>
        </Card>
      </div>
      <div className="dashboard-grid">
        <Card title="Rentabilidad" eyebrow="Estado de resultados">
          <BarChart
            valueFormatter={(value) => money.format(value)}
            items={[
              { label: 'Ingresos', value: revenue },
              { label: 'Costo ventas', value: cost },
              { label: 'Utilidad bruta', value: profit },
            ]}
          />
        </Card>
        <Card title="Salud de inventario" eyebrow="Reposicion">
          <DonutChart value={inventoryHealth} total={productCount || 1} label="Productos sobre minimo" />
          <p className="card-note">
            {lowStockCount} productos bajo minimo requieren compra, ajuste o produccion.
          </p>
        </Card>
        <Card title="Prioridades operativas" eyebrow="Hoy">
          <ul className="priority-list">
            <li>Revisar productos bajo minimo antes de facturar ventas mayoristas.</li>
            <li>Emitir facturas desde borrador para descontar inventario automaticamente.</li>
            <li>Registrar productividad diaria para alimentar reportes gerenciales.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
