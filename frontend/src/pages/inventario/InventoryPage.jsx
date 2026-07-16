import { ResourcePage } from '../ResourcePage'

export function InventoryPage() {
  return (
    <ResourcePage
      title="Inventario"
      description="Existencias por producto y almacen, con alertas para minimo de reposicion."
      endpoint="/stock-levels/"
      columns={[
        { key: 'product_sku', label: 'SKU' },
        { key: 'product_name', label: 'Producto' },
        { key: 'warehouse_name', label: 'Almacen' },
        { key: 'quantity', label: 'Existencia' },
      ]}
    />
  )
}
