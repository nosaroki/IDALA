import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      navigate('/admin/praticiens')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <p className="admin-login__eyebrow">Administration</p>
          <h1 className="admin-login__title">The Idala Family</h1>
          <p className="admin-login__sub">Espace réservé</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login__form">
          <div className="admin-login__field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-login__field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="admin-login__error">{error}</p>}

          <button type="submit" className="btn btn--violet-mid" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}