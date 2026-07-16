import { useMemo, useState } from 'react'

import { EmptyState } from './EmptyState'

export function DataTable({
  actions,
  columns,
  emptyMessage = 'Cuando agregues informacion aparecera aqui.',
  emptyTitle = 'Sin datos registrados',
  rows,
  searchable = false,
  searchPlaceholder = 'Buscar...',
}) {
  const [query, setQuery] = useState('')
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows ?? []
    const normalized = query.toLowerCase()
    return (rows ?? []).filter((row) =>
      columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(normalized)),
    )
  }, [columns, query, rows])

  if (!rows?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="data-table">
      {searchable && (
        <div className="table-toolbar">
          <input value={query} placeholder={searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
          <span>{filteredRows.length} registros</span>
        </div>
      )}
      {!filteredRows.length ? (
        <EmptyState title="Sin resultados" message="No hay registros que coincidan con la busqueda." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {actions && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id ?? index}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                  ))}
                  {actions && <td className="table-actions">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
