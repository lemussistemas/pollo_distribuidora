import { useEffect, useState } from 'react'

import { listResource } from '../api/services/resources'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'

export function ResourcePage({ title, description, endpoint, columns, action }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadRows() {
      try {
        setLoading(true)
        const data = await listResource(endpoint)
        if (!ignore) setRows(data)
      } catch (err) {
        if (!ignore) setError(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadRows()
    return () => {
      ignore = true
    }
  }, [endpoint])

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Modulo</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      <Card title="Registros">
        {loading && <p className="empty-state">Cargando datos...</p>}
        {error && <p className="error-state">No se pudo cargar: {error}</p>}
        {!loading && !error && <DataTable columns={columns} rows={rows} />}
      </Card>
    </div>
  )
}
