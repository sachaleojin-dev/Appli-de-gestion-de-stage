import { useState } from 'react'
<<<<<<< HEAD
import { useNavigate, Link } from 'react-router-dom'
=======
import { useNavigate } from 'react-router-dom'
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

<<<<<<< HEAD
  const handleSubmit = async (e) => {
=======
  const handleSubmit = (e) => {
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
<<<<<<< HEAD
      const result = await login(email, password)
      if (result.success) {
        const role = result.data.user?.user_metadata?.role
        if (role === 'etudiant') navigate('/etudiant/dashboard')
        else if (role === 'entreprise') navigate('/entreprise/dashboard')
        else if (role === 'administration') navigate('/admin/dashboard')
        else navigate('/')
=======
      const result = login(email, password)
      if (result.success) {
        navigate('/')
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
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
<<<<<<< HEAD

=======
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Gestion de Stage
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous à votre compte
          </p>
        </div>

<<<<<<< HEAD
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <span className="flex-1 py-2 text-center rounded-md bg-white shadow-sm text-sm font-semibold text-foreground cursor-default">
            Connexion
          </span>
          <Link
            to="/register"
            className="flex-1 py-2 text-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Inscription
          </Link>
        </div>

        {/* Error */}
=======
        {/* Error Message */}
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

<<<<<<< HEAD
        {/* Form */}
=======
        {/* Login Form */}
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
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
<<<<<<< HEAD
=======

>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
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
<<<<<<< HEAD
          <button type="submit" disabled={loading} className="btn-primary w-full">
=======

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

<<<<<<< HEAD
        {/* Demo accounts */}
=======
        {/* Demo Accounts */}
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wide">
            Comptes de démonstration
          </p>
          <div className="space-y-2">
<<<<<<< HEAD
            <button onClick={() => handleDemoLogin('user@example.com')} className="btn-secondary w-full text-sm">
              👤 Étudiant
            </button>
            <button onClick={() => handleDemoLogin('entreprise@example.com')} className="btn-secondary w-full text-sm">
              🏢 Entreprise
            </button>
            <button onClick={() => handleDemoLogin('admin@example.com')} className="btn-secondary w-full text-sm">
=======
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
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
              ⚙️ Administrateur
            </button>
          </div>
        </div>

<<<<<<< HEAD
        <p className="text-xs text-muted-foreground text-center mt-4">
          Mot de passe : <span className="font-mono">password</span>
        </p>

=======
        {/* Footer Info */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Mot de passe: <span className="font-mono">password</span>
        </p>
>>>>>>> 1d50a4e0ad8021b8090356fccc502fd2a5632bb5
      </div>
    </div>
  )
}
