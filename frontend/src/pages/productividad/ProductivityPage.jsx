import { useEffect, useMemo, useState } from 'react'

import { createResource, listResource } from '../../api/services/resources'
import { Card } from '../../components/ui/Card'
import { BarChart, DonutChart } from '../../components/ui/Charts'
import { DataTable } from '../../components/ui/DataTable'

const number = new Intl.NumberFormat('es-HN')

const today = new Date().toISOString().slice(0, 10)

export function ProductivityPage() {
  const [metrics, setMetrics] = useState([])
  const [goals, setGoals] = useState([])
  const [records, setRecords] = useState([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [recordForm, setRecordForm] = useState({
    metric: '',
    recorded_on: today,
    value: '',
    employee_name: '',
    notes: '',
  })

  async function loadProductivity() {
    const [metricRows, goalRows, recordRows] = await Promise.all([
      listResource('/productivity-metrics/'),
      listResource('/productivity-goals/'),
      listResource('/productivity-records/'),
    ])
    setMetrics(metricRows)
    setGoals(goalRows)
    setRecords(recordRows)
    setRecordForm((current) => ({
      ...current,
      metric: current.metric || metricRows[0]?.id || '',
    }))
  }

  useEffect(() => {
    loadProductivity().catch((err) => setMessage(`No se pudo cargar productividad: ${err.message}`))
  }, [])

  const totalsByMetric = useMemo(() => {
    return records.reduce((summary, record) => {
      const key = record.metric_name || 'Sin metrica'
      const current = summary.get(key) || {
        metric: key,
        unit: record.metric_unit || '',
        value: 0,
        records: 0,
      }
      current.value += Number(record.value) || 0
      current.records += 1
      summary.set(key, current)
      return summary
    }, new Map())
  }, [records])

  const chartItems = Array.from(totalsByMetric.values()).map((item) => ({
    label: item.metric,
    value: item.value,
  }))

  const totalOutput = chartItems.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const activeGoal = goals[0]
  const goalMetricTotal = activeGoal
    ? Array.from(totalsByMetric.values()).find((item) => item.metric === activeGoal.metric_name)?.value || 0
    : 0
  const goalTarget = Number(activeGoal?.target_value ?? 0)
  const topEmployee =
    records.reduce((summary, record) => {
      const name = record.employee_name || 'Sin empleado'
      summary[name] = (summary[name] || 0) + (Number(record.value) || 0)
      return summary
    }, {})

  const topEmployeeName = Object.entries(topEmployee).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Sin registros'

  function updateRecordForm(field, value) {
    setRecordForm((current) => ({ ...current, [field]: value }))
  }

  async function createDemoProductivity() {
    setSaving(true)
    setMessage('')
    try {
      let metricRows = metrics
      const demoMetrics = [
        { name: 'Libras despachadas', unit: 'lb', description: 'Producto entregado a clientes por dia' },
        { name: 'Pedidos preparados', unit: 'pedidos', description: 'Facturas o pedidos listos para ruta' },
        { name: 'Clientes atendidos', unit: 'clientes', description: 'Clientes atendidos por venta o despacho' },
      ]

      for (const metric of demoMetrics) {
        if (!metricRows.some((item) => item.name === metric.name)) {
          await createResource('/productivity-metrics/', metric)
        }
      }

      await loadProductivity()
      metricRows = await listResource('/productivity-metrics/')

      const poundsMetric = metricRows.find((metric) => metric.name === 'Libras despachadas')
      const ordersMetric = metricRows.find((metric) => metric.name === 'Pedidos preparados')
      const customersMetric = metricRows.find((metric) => metric.name === 'Clientes atendidos')

      if (!goals.length && poundsMetric) {
        await createResource('/productivity-goals/', {
          metric: poundsMetric.id,
          name: 'Meta semanal de despacho',
          target_value: '1200.00',
          starts_on: today,
          ends_on: today,
        })
      }

      const demoRecords = [
        { metric: poundsMetric?.id, value: '420.00', employee_name: 'Carlos Mejia', notes: 'Ruta centro' },
        { metric: poundsMetric?.id, value: '360.00', employee_name: 'Ana Lopez', notes: 'Ruta mayorista' },
        { metric: ordersMetric?.id, value: '18.00', employee_name: 'Carlos Mejia', notes: 'Pedidos listos' },
        { metric: customersMetric?.id, value: '24.00', employee_name: 'Ana Lopez', notes: 'Clientes atendidos' },
      ].filter((record) => record.metric)

      await Promise.all(
        demoRecords.map((record) =>
          createResource('/productivity-records/', {
            ...record,
            recorded_on: today,
          }),
        ),
      )

      await loadProductivity()
      setMessage('Datos demo de productividad listos.')
    } catch (err) {
      setMessage(`No se pudieron crear datos demo: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitRecord(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/productivity-records/', recordForm)
      await loadProductivity()
      setRecordForm((current) => ({ ...current, value: '', employee_name: '', notes: '' }))
      setMessage('Registro de productividad guardado.')
    } catch (err) {
      setMessage(`No se pudo guardar el registro: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="productivity-hero">
        <div>
          <span className="eyebrow">Productividad | Olanchito</span>
          <h2>Rendimiento operativo de Pollo Rey</h2>
          <p>Control de libras despachadas, pedidos preparados y clientes atendidos por equipo.</p>
        </div>
        <div className="hero-score">
          <span>Produccion total</span>
          <strong>{number.format(totalOutput)}</strong>
        </div>
      </section>

      <div className="report-actions">
        <button className="button" type="button" onClick={createDemoProductivity} disabled={saving}>
          Crear datos demo
        </button>
        <button className="button button--light" type="button" onClick={() => window.print()}>
          Imprimir tablero
        </button>
      </div>
      {message && <p className="form-message">{message}</p>}

      <div className="kpi-grid">
        <Card title={metrics.length} eyebrow="Metricas activas">
          <p>Indicadores configurados para medir el trabajo diario.</p>
        </Card>
        <Card title={records.length} eyebrow="Registros">
          <p>Eventos operativos capturados para analisis.</p>
        </Card>
        <Card title={topEmployeeName} eyebrow="Mayor aporte">
          <p>Empleado o equipo con mayor volumen registrado.</p>
        </Card>
        <Card title={activeGoal?.name ?? 'Sin meta'} eyebrow="Meta principal">
          <p>{activeGoal ? `${number.format(goalMetricTotal)} de ${number.format(goalTarget)} ${activeGoal.metric_name}` : 'Crea una meta para medir avance.'}</p>
        </Card>
      </div>

      <div className="productivity-grid">
        <Card title="Avance contra meta" eyebrow="Cumplimiento">
          <DonutChart value={goalMetricTotal} total={goalTarget || 1} label={activeGoal?.metric_name ?? 'Sin meta'} />
          <p className="card-note">Usa este indicador para mostrar cumplimiento diario o semanal.</p>
        </Card>
        <Card title="Produccion por metrica" eyebrow="Ranking operativo">
          <BarChart items={chartItems.length ? chartItems : [{ label: 'Sin datos', value: 0 }]} />
        </Card>
        <Card title="Registrar productividad" eyebrow="Captura rapida">
          <form className="productivity-form" onSubmit={submitRecord}>
            <label>
              Metrica
              <select value={recordForm.metric} onChange={(event) => updateRecordForm('metric', event.target.value)} required>
                <option value="">Seleccione metrica</option>
                {metrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha
              <input type="date" value={recordForm.recorded_on} onChange={(event) => updateRecordForm('recorded_on', event.target.value)} required />
            </label>
            <label>
              Valor
              <input type="number" step="0.01" value={recordForm.value} onChange={(event) => updateRecordForm('value', event.target.value)} required />
            </label>
            <label>
              Empleado
              <input value={recordForm.employee_name} onChange={(event) => updateRecordForm('employee_name', event.target.value)} placeholder="Nombre del empleado" />
            </label>
            <label className="productivity-form__full">
              Nota
              <textarea value={recordForm.notes} onChange={(event) => updateRecordForm('notes', event.target.value)} placeholder="Ruta, turno o comentario" />
            </label>
            <button className="button" type="submit" disabled={saving || !metrics.length}>
              Guardar registro
            </button>
          </form>
        </Card>
      </div>

      <Card title="Bitacora de productividad" eyebrow="Ultimos registros">
        <DataTable
          columns={[
            { key: 'recorded_on', label: 'Fecha' },
            { key: 'metric_name', label: 'Metrica' },
            { key: 'value', label: 'Valor' },
            { key: 'metric_unit', label: 'Unidad' },
            { key: 'employee_name', label: 'Empleado' },
            { key: 'notes', label: 'Nota' },
          ]}
          rows={records}
        />
      </Card>
    </div>
  )
}
