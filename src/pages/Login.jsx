import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = login(email, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Gestion de Stage
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Adresse email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@example.com"
              className="input-soft"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-soft"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wide">
            Comptes de démonstration
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoLogin('user@example.com')}
              className="btn-secondary w-full text-sm"
            >
              👤 Étudiant
            </button>
            <button
              onClick={() => handleDemoLogin('entrepris@example.com')}
              className="btn-secondary w-full text-sm"
            >
              🏢 Entreprise
            </button>
            <button
              onClick={() => handleDemoLogin('admin@example.com')}
              className="btn-secondary w-full text-sm"
            >
              ⚙️ Administrateur
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Mot de passe: <span className="font-mono">password</span>
        </p>
      </div>
    </div>
  )
}
