import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// return a default dashboard title for the given role
const getRoleTitle = (role) => {
  const titles = {
    etudiant: 'Tableau de Bord Étudiant',
    entreprise: 'Tableau de Bord Entreprise',
    administration: 'Tableau de Bord Administration',
    admin: 'Tableau de Bord Admin'
  }
  return titles[role] || 'Gestion de Stage'
}

// derive a title based on the current location path
// only display a title on the dashboard root; all other routes hide
const getPageTitle = (role, pathname) => {
  return pathname === '/' ? getRoleTitle(role) : ''
}

export default function Navbar() {
  const { user, role, name, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Génère les initiales pour l'avatar
  const getInitials = () => {
    if (name) {
      const parts = name.trim().split(' ')
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || '?'
  }

  const title = getPageTitle(role, location.pathname)

  return (
    <nav className="bg-white shadow-sm border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* show page-specific title or nothing */}
        {title && (
          <h1 className="text-2xl font-bold text-foreground">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:bg-muted px-3 py-2 rounded-lg transition"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
              {getInitials()}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-lg w-48 z-50">
              <button
                onClick={() => { navigate('/profile'); setIsProfileOpen(false) }}
                className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground"
              >
                Mon Profil
              </button>

              {(role === 'etudiant') && (
                <>
                  <button
                    onClick={() => { navigate('/convention'); setIsProfileOpen(false) }}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground border-t border-border"
                  >
                    Ma Convention
                  </button>
                  <button
                    onClick={() => { navigate('/evaluations'); setIsProfileOpen(false) }}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition text-foreground border-t border-border"
                  >
                    Mes Évaluations
                  </button>
                </>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-muted transition text-red-500 border-t border-border"
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
