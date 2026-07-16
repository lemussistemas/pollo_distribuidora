import { useEffect, useMemo, useState } from 'react'

import { createResource, listResource } from '../../api/services/resources'
import { getIncomeStatement } from '../../api/services/reports'
import { Card } from '../../components/ui/Card'
import { BarChart, DonutChart } from '../../components/ui/Charts'
import { DataTable } from '../../components/ui/DataTable'

const money = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL',
})

const today = new Date().toISOString().slice(0, 10)

const accountTypeLabels = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Patrimonio',
  revenue: 'Ingreso',
  expense: 'Gasto',
  cost: 'Costo',
}

export function AccountingPage() {
  const [accounts, setAccounts] = useState([])
  const [entries, setEntries] = useState([])
  const [income, setIncome] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [entryForm, setEntryForm] = useState({
    date: today,
    description: 'Gasto operativo',
    reference: 'REC-001',
    source: 'manual',
    debit_account: '',
    credit_account: '',
    amount: '',
    memo: '',
  })

  async function loadAccounting() {
    const [accountRows, entryRows, incomeData] = await Promise.all([
      listResource('/accounts/'),
      listResource('/journal-entries/'),
      getIncomeStatement(),
    ])
    setAccounts(accountRows)
    setEntries(entryRows)
    setIncome(incomeData)
    setEntryForm((current) => ({
      ...current,
      debit_account: current.debit_account || accountRows.find((account) => account.account_type === 'expense')?.id || '',
      credit_account: current.credit_account || accountRows.find((account) => account.account_type === 'asset')?.id || '',
    }))
  }

  useEffect(() => {
    loadAccounting().catch((err) => setMessage(`No se pudo cargar contabilidad: ${err.message}`))
  }, [])

  const accountSummary = useMemo(() => {
    return accounts.reduce((summary, account) => {
      summary[account.account_type] = (summary[account.account_type] || 0) + 1
      return summary
    }, {})
  }, [accounts])

  const journalTotals = useMemo(() => {
    return entries.reduce(
      (totals, entry) => {
        const lines = entry.lines || []
        totals.debit += lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
        totals.credit += lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
        return totals
      },
      { debit: 0, credit: 0 },
    )
  }, [entries])

  const revenue = Number(income?.revenue ?? 0)
  const cost = Number(income?.cost_of_goods_sold ?? 0)
  const profit = Number(income?.net_income ?? income?.gross_profit ?? 0)
  const balanceDifference = Math.abs(journalTotals.debit - journalTotals.credit)

  function updateEntryForm(field, value) {
    setEntryForm((current) => ({ ...current, [field]: value }))
  }

  async function createDemoAccounting() {
    setSaving(true)
    setMessage('')
    try {
      const demoAccounts = [
        { code: '1101', name: 'Caja y bancos', account_type: 'asset' },
        { code: '1201', name: 'Inventario de pollo', account_type: 'asset' },
        { code: '2101', name: 'Impuesto sobre ventas por pagar', account_type: 'liability' },
        { code: '3101', name: 'Capital propietario', account_type: 'equity' },
        { code: '4101', name: 'Ingresos por ventas', account_type: 'revenue' },
        { code: '5101', name: 'Costo de ventas', account_type: 'cost' },
        { code: '6101', name: 'Gastos operativos', account_type: 'expense' },
      ]

      let accountRows = accounts
      for (const account of demoAccounts) {
        if (!accountRows.some((item) => item.code === account.code)) {
          await createResource('/accounts/', account)
        }
      }

      accountRows = await listResource('/accounts/')
      const cash = accountRows.find((account) => account.code === '1101')
      const capital = accountRows.find((account) => account.code === '3101')
      const expense = accountRows.find((account) => account.code === '6101')

      if (cash && capital && !entries.some((entry) => entry.reference === 'APERTURA-OLANCHITO')) {
        await createResource('/journal-entries/', {
          date: today,
          description: 'Apertura contable Distribuidora Pollo Rey',
          reference: 'APERTURA-OLANCHITO',
          source: 'demo',
          lines: [
            { account: cash.id, debit: '25000.00', credit: '0.00', memo: 'Capital inicial en caja' },
            { account: capital.id, debit: '0.00', credit: '25000.00', memo: 'Aporte inicial' },
          ],
        })
      }

      if (expense && cash && !entries.some((entry) => entry.reference === 'GASTO-DEMO-001')) {
        await createResource('/journal-entries/', {
          date: today,
          description: 'Gasto de combustible para reparto',
          reference: 'GASTO-DEMO-001',
          source: 'demo',
          lines: [
            { account: expense.id, debit: '850.00', credit: '0.00', memo: 'Combustible ruta Olanchito' },
            { account: cash.id, debit: '0.00', credit: '850.00', memo: 'Pago en efectivo' },
          ],
        })
      }

      await loadAccounting()
      setMessage('Datos demo contables listos.')
    } catch (err) {
      setMessage(`No se pudieron crear datos demo: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitEntry(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/journal-entries/', {
        date: entryForm.date,
        description: entryForm.description,
        reference: entryForm.reference,
        source: entryForm.source,
        lines: [
          {
            account: entryForm.debit_account,
            debit: entryForm.amount,
            credit: '0.00',
            memo: entryForm.memo,
          },
          {
            account: entryForm.credit_account,
            debit: '0.00',
            credit: entryForm.amount,
            memo: entryForm.memo,
          },
        ],
      })
      await loadAccounting()
      setEntryForm((current) => ({ ...current, amount: '', memo: '' }))
      setMessage('Asiento contable registrado correctamente.')
    } catch (err) {
      setMessage(`No se pudo registrar el asiento: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="accounting-hero">
        <div>
          <span className="eyebrow">Contabilidad | Olanchito</span>
          <h2>Control financiero de Distribuidora Pollo Rey</h2>
          <p>Plan de cuentas, libro diario, estado de resultados y control de partida doble.</p>
        </div>
        <div className="hero-score">
          <span>Utilidad neta</span>
          <strong>{money.format(profit)}</strong>
        </div>
      </section>

      <div className="report-actions">
        {import.meta.env.DEV && (
          <button className="button" type="button" onClick={createDemoAccounting} disabled={saving}>
            Crear datos demo
          </button>
        )}
        <button className="button button--light" type="button" onClick={() => window.print()}>
          Imprimir contabilidad
        </button>
      </div>
      {message && <p className="form-message">{message}</p>}

      <div className="kpi-grid">
        <Card title={money.format(revenue)} eyebrow="Ingresos">
          <p>Ventas reconocidas en el estado de resultados.</p>
        </Card>
        <Card title={money.format(cost)} eyebrow="Costo de ventas">
          <p>Costo estimado de producto vendido.</p>
        </Card>
        <Card title={money.format(balanceDifference)} eyebrow="Diferencia debe/haber">
          <p>{balanceDifference === 0 ? 'Libro diario cuadrado.' : 'Revisar descuadre contable.'}</p>
        </Card>
        <Card title={accounts.length} eyebrow="Cuentas">
          <p>Plan contable base para operacion comercial.</p>
        </Card>
      </div>

      <div className="accounting-grid">
        <Card title="Estado de resultados" eyebrow="Resultado operativo">
          <BarChart
            valueFormatter={(value) => money.format(value)}
            items={[
              { label: 'Ingresos', value: revenue },
              { label: 'Costo ventas', value: cost },
              { label: 'Utilidad neta', value: profit },
            ]}
          />
        </Card>
        <Card title="Balance del libro diario" eyebrow="Partida doble">
          <DonutChart value={journalTotals.credit} total={journalTotals.debit || 1} label="Haber contra debe" />
          <p className="card-note">
            Debe: {money.format(journalTotals.debit)} | Haber: {money.format(journalTotals.credit)}
          </p>
        </Card>
        <Card title="Tipos de cuentas" eyebrow="Plan contable">
          <BarChart
            items={Object.entries(accountTypeLabels).map(([type, label]) => ({
              label,
              value: accountSummary[type] || 0,
            }))}
          />
        </Card>
      </div>

      <div className="accounting-grid accounting-grid--wide">
        <Card title="Registrar asiento" eyebrow="Libro diario">
          <form className="accounting-form" onSubmit={submitEntry}>
            <label>
              Fecha
              <input type="date" value={entryForm.date} onChange={(event) => updateEntryForm('date', event.target.value)} required />
            </label>
            <label>
              Referencia
              <input value={entryForm.reference} onChange={(event) => updateEntryForm('reference', event.target.value)} />
            </label>
            <label className="accounting-form__full">
              Descripcion
              <input value={entryForm.description} onChange={(event) => updateEntryForm('description', event.target.value)} required />
            </label>
            <label>
              Cuenta debe
              <select value={entryForm.debit_account} onChange={(event) => updateEntryForm('debit_account', event.target.value)} required>
                <option value="">Seleccione cuenta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cuenta haber
              <select value={entryForm.credit_account} onChange={(event) => updateEntryForm('credit_account', event.target.value)} required>
                <option value="">Seleccione cuenta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monto
              <input type="number" step="0.01" value={entryForm.amount} onChange={(event) => updateEntryForm('amount', event.target.value)} required />
            </label>
            <label>
              Origen
              <input value={entryForm.source} onChange={(event) => updateEntryForm('source', event.target.value)} />
            </label>
            <label className="accounting-form__full">
              Memo
              <textarea value={entryForm.memo} onChange={(event) => updateEntryForm('memo', event.target.value)} />
            </label>
            <button className="button" type="submit" disabled={saving || !accounts.length}>
              Guardar asiento
            </button>
          </form>
        </Card>

        <Card title="Plan de cuentas" eyebrow="Catalogo">
          <DataTable
            columns={[
              { key: 'code', label: 'Codigo' },
              { key: 'name', label: 'Cuenta' },
              { key: 'account_type', label: 'Tipo', render: (row) => accountTypeLabels[row.account_type] ?? row.account_type },
              { key: 'is_active', label: 'Activa', render: (row) => (row.is_active ? 'Si' : 'No') },
            ]}
            rows={accounts}
          />
        </Card>
      </div>

      <Card title="Libro diario" eyebrow="Asientos recientes">
        <DataTable
          columns={[
            { key: 'date', label: 'Fecha' },
            { key: 'description', label: 'Descripcion' },
            { key: 'reference', label: 'Referencia' },
            { key: 'source', label: 'Origen' },
            {
              key: 'total',
              label: 'Debe / Haber',
              render: (row) => {
                const debit = (row.lines || []).reduce((sum, line) => sum + Number(line.debit || 0), 0)
                const credit = (row.lines || []).reduce((sum, line) => sum + Number(line.credit || 0), 0)
                return `${money.format(debit)} / ${money.format(credit)}`
              },
            },
          ]}
          rows={entries}
        />
      </Card>
    </div>
  )
}
