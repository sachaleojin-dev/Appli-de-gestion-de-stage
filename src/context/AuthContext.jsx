import { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// ─── Comptes démo (bypass Supabase Auth) ─────────────────────────────────────
const DEMO_ACCOUNTS = {
  'user@example.com': {
    role: 'etudiant',
    nom: 'Dupont',
    prenom: 'Jean',
    name: 'Jean Dupont'
  },
  'entreprise@example.com': {
    role: 'entreprise',
    nom: 'TechCorp',
    prenom: '',
    name: 'TechCorp'
  },
  'admin@example.com': {
    // use 'admin' for consistency with route guards
    role: 'admin',
    nom: 'Admin',
    prenom: '',
    name: 'Administrateur'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifie si un compte démo est en session (localStorage)
    const savedDemo = localStorage.getItem('demo_user')
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo))
        setLoading(false)
        return
      } catch {
        localStorage.removeItem('demo_user')
      }
    }

    // Sinon vérifie la session Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Ne pas écraser un compte démo actif
      if (!localStorage.getItem('demo_user')) {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    // ── Compte démo ──────────────────────────────────────────────────────────
    if (DEMO_ACCOUNTS[email] && password === 'password') {
      const demoUser = {
        id: email,
        email,
        isDemo: true,
        user_metadata: DEMO_ACCOUNTS[email]
      }
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
      setUser(demoUser)
      return { success: true, data: { user: demoUser } }
    }

    // ── Vrai compte Supabase ──────────────────────────────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }

  const logout = async () => {
    localStorage.removeItem('demo_user')
    await supabase.auth.signOut()
    setUser(null)
  }

  // Compatibilité : role et name accessibles directement
  const role = user?.user_metadata?.role ?? null
  const name = user?.user_metadata?.name
    ?? (user?.user_metadata?.prenom && user?.user_metadata?.nom
        ? `${user.user_metadata.prenom} ${user.user_metadata.nom}`.trim()
        : null)
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      role,
      name,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
