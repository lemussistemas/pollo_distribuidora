import { useEffect, useState } from 'react'

import { createResource, getResource, listResource, updateResource } from '../../api/services/resources'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { formatDate } from '../../utils/format'

const today = new Date().toISOString().slice(0, 10)

export function SettingsPage() {
  const [company, setCompany] = useState(null)
  const [caiRanges, setCaiRanges] = useState([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [caiForm, setCaiForm] = useState({
    cai: '',
    establishment: '000',
    emission_point: '001',
    document_type: '01',
    start_number: '1',
    end_number: '99999999',
    current_number: '1',
    authorization_date: today,
    expiration_date: today,
    is_active: true,
  })

  async function loadSettings() {
    const [companyData, caiRows] = await Promise.all([getResource('/company-profile/'), listResource('/cai-ranges/')])
    setCompany(companyData)
    setCaiRanges(caiRows)
  }

  useEffect(() => {
    loadSettings().catch((err) => setMessage(`No se pudo cargar configuracion: ${err.message}`))
  }, [])

  function updateCompany(field, value) {
    setCompany((current) => ({ ...current, [field]: value }))
  }

  function updateCai(field, value) {
    setCaiForm((current) => ({ ...current, [field]: value }))
  }

  async function submitCompany(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const saved = await updateResource(`/company-profile/${company.id}/`, company)
      setCompany(saved)
      setMessage('Datos de empresa actualizados.')
    } catch (err) {
      setMessage(`No se pudo guardar empresa: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function submitCai(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createResource('/cai-ranges/', caiForm)
      await loadSettings()
      setCaiForm((current) => ({ ...current, cai: '' }))
      setMessage('Rango CAI creado correctamente.')
    } catch (err) {
      setMessage(`No se pudo crear CAI: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="settings-hero">
        <div>
          <span className="eyebrow">Configuracion | Empresa</span>
          <h2>Parametros comerciales y fiscales</h2>
          <p>Administra los datos de Pollo Rey, moneda, ISV y rangos CAI para facturacion Honduras.</p>
        </div>
      </section>
      {message && <p className="form-message">{message}</p>}
      <div className="settings-grid">
        <Card title="Datos de empresa" eyebrow="Perfil">
          {company && (
            <form className="settings-form" onSubmit={submitCompany}>
              <label>Nombre<input value={company.name} onChange={(event) => updateCompany('name', event.target.value)} /></label>
              <label>RTN<input value={company.rtn} onChange={(event) => updateCompany('rtn', event.target.value)} /></label>
              <label>Telefono<input value={company.phone} onChange={(event) => updateCompany('phone', event.target.value)} /></label>
              <label>Email<input value={company.email} onChange={(event) => updateCompany('email', event.target.value)} /></label>
              <label className="settings-form__full">Direccion<input value={company.address} onChange={(event) => updateCompany('address', event.target.value)} /></label>
              <label>ISV %<input type="number" step="0.01" value={company.default_tax_rate} onChange={(event) => updateCompany('default_tax_rate', event.target.value)} /></label>
              <label>Moneda<input value={company.currency} onChange={(event) => updateCompany('currency', event.target.value)} /></label>
              <button className="button" type="submit" disabled={saving}>Guardar empresa</button>
            </form>
          )}
        </Card>
        <Card title="Nuevo rango CAI" eyebrow="Facturacion Honduras">
          <form className="settings-form" onSubmit={submitCai}>
            <label className="settings-form__full">CAI<input value={caiForm.cai} onChange={(event) => updateCai('cai', event.target.value)} required /></label>
            <label>Establecimiento<input value={caiForm.establishment} onChange={(event) => updateCai('establishment', event.target.value)} /></label>
            <label>Punto emision<input value={caiForm.emission_point} onChange={(event) => updateCai('emission_point', event.target.value)} /></label>
            <label>Desde<input type="number" value={caiForm.start_number} onChange={(event) => updateCai('start_number', event.target.value)} /></label>
            <label>Hasta<input type="number" value={caiForm.end_number} onChange={(event) => updateCai('end_number', event.target.value)} /></label>
            <label>Actual<input type="number" value={caiForm.current_number} onChange={(event) => updateCai('current_number', event.target.value)} /></label>
            <label>Autorizacion<input type="date" value={caiForm.authorization_date} onChange={(event) => updateCai('authorization_date', event.target.value)} /></label>
            <label>Vencimiento<input type="date" value={caiForm.expiration_date} onChange={(event) => updateCai('expiration_date', event.target.value)} /></label>
            <button className="button" type="submit" disabled={saving}>Guardar CAI</button>
          </form>
        </Card>
      </div>
      <Card title="Rangos CAI registrados" eyebrow="Fiscal">
        <DataTable searchable columns={[
          { key: 'cai', label: 'CAI' },
          { key: 'start_number', label: 'Desde' },
          { key: 'end_number', label: 'Hasta' },
          { key: 'current_number', label: 'Actual' },
          { key: 'expiration_date', label: 'Vence', render: (row) => formatDate(row.expiration_date) },
          { key: 'is_active', label: 'Activo', render: (row) => (row.is_active ? 'Si' : 'No') },
        ]} rows={caiRanges} />
      </Card>
    </div>
  )
}
