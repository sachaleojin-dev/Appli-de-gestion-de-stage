import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext(null)

// Mock user database
const USERS = {
  'user@example.com': { password: 'password', role: 'etudiant', name: 'Jean Dupont' },
  'entrepris@example.com': { password: 'password', role: 'entreprise', name: 'TechCorp' },
  'admin@example.com': { password: 'password', role: 'admin', name: 'Administrateur' }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    const userData = USERS[email]
    
    if (!userData) {
      return { success: false, error: 'Email non trouvé' }
    }
    
    if (userData.password !== password) {
      return { success: false, error: 'Mot de passe incorrect' }
    }

    const userObj = {
      email,
      role: userData.role,
      name: userData.name
    }

    setUser(userObj)
    localStorage.setItem('user', JSON.stringify(userObj))
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const isAuthenticated = !!user
  const role = user?.role

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      role,
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
