import { useEffect, useState } from 'react'

import {
  getIncomeStatement,
  getInventoryReport,
  getSalesByCustomer,
  getSalesByProduct,
  getTrialBalance,
  getProductivityReport,
  getSalesReport,
} from '../../api/services/reports'
import { Card } from '../../components/ui/Card'
import { BarChart, DonutChart } from '../../components/ui/Charts'
import { DataTable } from '../../components/ui/DataTable'

const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

export function ReportsPage() {
  const [reports, setReports] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ from: '', to: '' })

  async function loadReports(activeFilters = filters) {
    try {
      setLoading(true)
      setError('')
      const [sales, inventory, productivity, income, salesByProduct, salesByCustomer, trialBalance] = await Promise.all([
        getSalesReport(activeFilters),
        getInventoryReport(activeFilters),
        getProductivityReport(activeFilters),
        getIncomeStatement(activeFilters),
        getSalesByProduct(activeFilters),
        getSalesByCustomer(activeFilters),
        getTrialBalance(activeFilters),
      ])
      setReports({ sales, inventory, productivity, income, salesByProduct, salesByCustomer, trialBalance })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function submitFilters(event) {
    event.preventDefault()
    loadReports(filters)
  }

  function exportCsv() {
    const rows = [
      ['Reporte', 'Valor'],
      ['Ventas totales', reports.sales?.total ?? 0],
      ['Facturas emitidas', reports.sales?.invoice_count ?? 0],
      ['Impuesto ventas', reports.sales?.tax_total ?? 0],
      ['Ingresos', reports.income?.revenue ?? 0],
      ['Costo de ventas', reports.income?.cost_of_goods_sold ?? 0],
      ['Utilidad bruta', reports.income?.gross_profit ?? 0],
      ['Utilidad neta', reports.income?.net_income ?? 0],
      ['Productos bajo minimo', reports.inventory?.low_stock_count ?? 0],
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'reporte-pollo-rey.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const revenue = Number(reports.income?.revenue ?? 0)
  const cost = Number(reports.income?.cost_of_goods_sold ?? 0)
  const grossProfit = Number(reports.income?.gross_profit ?? 0)
  const lowStock = Number(reports.inventory?.low_stock_count ?? 0)
  const productCount = Number(reports.inventory?.product_count ?? 0)

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Reporteria | Olanchito</span>
          <h2>Reportes gerenciales</h2>
          <p>Ventas, inventario, productividad y estado de resultados con graficas.</p>
        </div>
        <div className="report-actions">
          <button className="button button--light" type="button" onClick={() => window.print()}>
            Imprimir
          </button>
          <button className="button" type="button" onClick={exportCsv}>
            Exportar CSV
          </button>
        </div>
      </div>
      <Card title="Filtros de reporte" eyebrow="Periodo">
        <form className="filters-form" onSubmit={submitFilters}>
          <label>
            Desde
            <input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
          </label>
          <button className="button" type="submit">
            Generar reporte
          </button>
        </form>
      </Card>
      {loading && <p className="empty-state">Generando reportes...</p>}
      {error && <p className="error-state">No se pudieron cargar reportes: {error}</p>}
      <div className="kpi-grid">
        <Card title={money.format(reports.sales?.total ?? 0)} eyebrow="Ventas">
          <p>{reports.sales?.invoice_count ?? 0} facturas emitidas en el periodo.</p>
        </Card>
        <Card title={money.format(grossProfit)} eyebrow="Utilidad bruta">
          <p>Ingresos menos costo de ventas.</p>
        </Card>
        <Card title={lowStock} eyebrow="Bajo minimo">
          <p>{productCount} productos con existencia registrada.</p>
        </Card>
        <Card title={reports.productivity?.metrics?.length ?? 0} eyebrow="Productividad">
          <p>Metricas consolidadas del periodo.</p>
        </Card>
      </div>
      <div className="report-grid">
        <Card title="Grafica financiera" eyebrow="Estado de resultados">
          <BarChart
            valueFormatter={(value) => money.format(value)}
            items={[
              { label: 'Ingresos', value: revenue },
              { label: 'Costo de ventas', value: cost },
              { label: 'Utilidad bruta', value: grossProfit },
            ]}
          />
        </Card>
        <Card title="Salud de inventario" eyebrow="Bajo minimo">
          <DonutChart value={Math.max(productCount - lowStock, 0)} total={productCount || 1} label="Sobre minimo" />
          <p className="card-note">Productos bajo minimo: {lowStock}</p>
        </Card>
        <Card title="Detalle del estado de resultados">
          <div className="statement-list">
            <span>Ingresos</span>
            <strong>{money.format(revenue)}</strong>
            <span>Costo de ventas</span>
            <strong>{money.format(cost)}</strong>
            <span>Gastos operativos</span>
            <strong>{money.format(reports.income?.operating_expenses ?? 0)}</strong>
            <span>Utilidad neta</span>
            <strong>{money.format(reports.income?.net_income ?? 0)}</strong>
          </div>
        </Card>
        <Card title="Inventario bajo minimo">
          <DataTable
            columns={[
              { key: 'sku', label: 'SKU' },
              { key: 'product', label: 'Producto' },
              { key: 'quantity', label: 'Existencia' },
            ]}
            rows={reports.inventory?.low_stock ?? []}
          />
        </Card>
        <Card title="Productividad">
          <BarChart
            items={(reports.productivity?.metrics ?? []).map((metric) => ({
              label: metric.metric__name,
              value: metric.total,
            }))}
          />
          <DataTable
            columns={[
              { key: 'metric__name', label: 'Metrica' },
              { key: 'total', label: 'Total' },
              { key: 'metric__unit', label: 'Unidad' },
            ]}
            rows={reports.productivity?.metrics ?? []}
          />
        </Card>
        <Card title="Ventas por producto">
          <DataTable
            searchable
            columns={[
              { key: 'product__sku', label: 'SKU' },
              { key: 'product__name', label: 'Producto' },
              { key: 'quantity', label: 'Cantidad' },
              { key: 'total', label: 'Total', render: (row) => money.format(row.total ?? 0) },
            ]}
            rows={reports.salesByProduct?.results ?? []}
          />
        </Card>
        <Card title="Ventas por cliente">
          <DataTable
            searchable
            columns={[
              { key: 'customer__name', label: 'Cliente' },
              { key: 'customer__rtn', label: 'RTN' },
              { key: 'invoice_count', label: 'Facturas' },
              { key: 'total', label: 'Total', render: (row) => money.format(row.total ?? 0) },
            ]}
            rows={reports.salesByCustomer?.results ?? []}
          />
        </Card>
        <Card title="Balanza de comprobacion">
          <DataTable
            searchable
            columns={[
              { key: 'account__code', label: 'Cuenta' },
              { key: 'account__name', label: 'Nombre' },
              { key: 'debit', label: 'Debe', render: (row) => money.format(row.debit ?? 0) },
              { key: 'credit', label: 'Haber', render: (row) => money.format(row.credit ?? 0) },
            ]}
            rows={reports.trialBalance?.results ?? []}
          />
        </Card>
      </div>
    </div>
  )
}
