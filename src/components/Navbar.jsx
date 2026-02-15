import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const getRoleTitle = (role) => {
  const titles = {
    etudiant: 'Tableau de Bord Étudiant',
    entreprise: 'Tableau de Bord Entreprise',
    admin: 'Tableau de Bord Admin'
  }
  return titles[role] || 'Gestion de Stage'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {getRoleTitle(user?.role)}
        </h1>
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:bg-muted px-3 py-2 rounded-lg transition"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}{user?.name?.split(' ')[1]?.charAt(0).toUpperCase()}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-lg w-48 z-50">
              <button
                onClick={() => {
                  navigate('/profile')
                  setIsProfileOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground"
              >
                Mon Profil
              </button>
              {user?.role === 'etudiant' && (
                <>
                  <button
                    onClick={() => {
                      navigate('/convention')
                      setIsProfileOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground border-t border-border"
                  >
                    Ma Convention
                  </button>
                  <button
                    onClick={() => {
                      navigate('/evaluations')
                      setIsProfileOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground border-t border-border"
                  >
                    Mes Évaluations
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground border-t border-border"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
