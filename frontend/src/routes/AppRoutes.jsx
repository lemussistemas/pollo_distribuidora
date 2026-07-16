import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'

import { AppShell } from '../components/layout/AppShell'
import { AuthProvider } from '../context/AuthContext'
import { useAuth } from '../context/useAuth'
import { AccountingPage } from '../pages/contabilidad/AccountingPage'
import { DashboardPage } from '../pages/DashboardPage'
import { InvoicesPage } from '../pages/facturacion/InvoicesPage'
import { NewInvoicePage } from '../pages/facturacion/NewInvoicePage'
import { InventoryPage } from '../pages/inventario/InventoryPage'
import { LoginPage } from '../pages/LoginPage'
import { ProductivityPage } from '../pages/productividad/ProductivityPage'
import { ReportsPage } from '../pages/reportes/ReportsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="route-loader">Cargando sesion...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'facturacion', element: <InvoicesPage /> },
      { path: 'facturacion/nueva', element: <NewInvoicePage /> },
      { path: 'inventario', element: <InventoryPage /> },
      { path: 'contabilidad', element: <AccountingPage /> },
      { path: 'reportes', element: <ReportsPage /> },
      { path: 'productividad', element: <ProductivityPage /> },
    ],
  },
])

export function AppRoutes() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
