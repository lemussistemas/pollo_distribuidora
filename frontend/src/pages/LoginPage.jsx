import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import iguanaLogo from '../assets/iguana-software.png'
import { useAuth } from '../context/useAuth'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: import.meta.env.DEV ? 'admin' : '',
    password: import.meta.env.DEV ? 'PolloRey2026' : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submitLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail ?? err.message ?? 'No se pudo iniciar sesion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <span className="eyebrow">ERP avicola | Olanchito, Honduras</span>
        <h1>Distribuidora Pollo Rey</h1>
        <p>Sistema de facturacion, inventario, contabilidad, reportes y productividad.</p>
        <div className="login-brand__logo">
          <img src={iguanaLogo} alt="Iguana Software" />
          <div>
            <span>Desarrollado por</span>
            <strong>Iguana Software</strong>
          </div>
        </div>
      </section>

      <section className="login-card">
        <div>
          <span className="eyebrow">Acceso seguro</span>
          <h2>Iniciar sesion</h2>
          <p>Ingresa con tu usuario para administrar Pollo Rey.</p>
        </div>
        <form className="login-form" onSubmit={submitLogin}>
          <label>
            Usuario
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField('username', event.target.value)}
              required
            />
          </label>
          <label>
            Contrasena
            <input
              autoComplete="current-password"
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required
            />
          </label>
          {error && <p className="error-state">{error}</p>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar al sistema'}
          </button>
        </form>
        {import.meta.env.DEV && (
          <div className="login-demo">
            <strong>Demo:</strong> usuario <code>admin</code> / clave <code>PolloRey2026</code>
          </div>
        )}
      </section>
    </main>
  )
}
