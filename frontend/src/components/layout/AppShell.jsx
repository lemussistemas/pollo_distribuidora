import { NavLink, Outlet } from 'react-router-dom'

import iguanaLogo from '../../assets/iguana-software.png'
import { useAuth } from '../../context/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/facturacion', label: 'Facturacion' },
  { to: '/facturacion/nueva', label: 'Nueva factura' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/contabilidad', label: 'Contabilidad' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/productividad', label: 'Productividad' },
]

export function AppShell() {
  const { logout, user } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">PR</span>
          <div>
            <strong>Pollo Rey</strong>
            <small>Distribuidora de Olanchito</small>
          </div>
        </div>
        <nav className="sidebar__nav" aria-label="Principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="developer-card">
          <img src={iguanaLogo} alt="Iguana Software" />
          <span>Desarrollado por</span>
          <strong>Iguana Software</strong>
        </div>
      </aside>
      <div className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">ERP avicola | Olanchito, Honduras</span>
            <h1>Distribuidora Pollo Rey</h1>
          </div>
          <div className="topbar__session">
            <div className="topbar__status">
              <span>{user?.first_name || user?.username || 'Usuario'} conectado</span>
            </div>
            <button className="button button--light" type="button" onClick={logout}>
              Salir
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
