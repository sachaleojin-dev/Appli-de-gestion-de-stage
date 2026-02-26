import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const studentMenuItems = [
  { label: 'Tableau de Bord',   id: 'dashboard',     path: '/' },
  { label: 'Offres de Stage',   id: 'offers',        path: '/?tab=offers' },
  { label: 'Mes Candidatures',  id: 'applications',  path: '/?tab=applications' },
  { label: 'Ma Convention',     id: 'convention',    path: '/convention' },
  { label: 'Soumettre Rapport', id: 'report',        path: '/?tab=report' },
  { label: 'Mes Évaluations',   id: 'evaluation',    path: '/evaluations' }
]

const companyMenuItems = [
  { label: 'Tableau de Bord',   id: 'dashboard',     path: '/' },
  { label: 'Mes Offres',        id: 'offers',        path: '/?tab=offers' },
  { label: 'Ajouter une Offre', id: 'add-offer',     path: '/?tab=add-offer' },
  { label: 'Mes Candidats',     id: 'applications',  path: '/candidates' },
  { label: 'Évaluer Étudiant',  id: 'evaluate',      path: '/?tab=evaluate' }
]

const adminMenuItems = [
  { label: 'Tableau de Bord',   id: 'dashboard',     path: '/' },
  { label: 'Conventions',       id: 'conventions',   path: '/conventions' },
  { label: 'Rapports',          id: 'reports',       path: '/reports' },
  { label: 'Statistiques',      id: 'stats',         path: '/?tab=stats' }
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const getMenuItems = () => {
    switch (role) {
      case 'etudiant':      return studentMenuItems
      case 'entreprise':    return companyMenuItems
      case 'administration':
      case 'admin':         return adminMenuItems
      default:              return []
    }
  }

  // Détermine si un item est actif selon l'URL courante
  const isActive = (item) => {
    const currentTab = new URLSearchParams(location.search).get('tab')
    const itemTab = new URLSearchParams(item.path.split('?')[1] || '').get('tab')

    if (item.path === '/' && !currentTab && location.pathname === '/') {
      return item.id === 'dashboard'
    }
    if (itemTab && itemTab === currentTab) return true
    if (item.path !== '/' && !itemTab) return location.pathname === item.path
    return false
  }

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-20'} bg-white border-r border-border shadow-sm transition-all duration-300 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {isExpanded && <h2 className="text-xl font-bold text-primary">Stage</h2>}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded-md transition"
          >
            {isExpanded ? '←' : '→'}
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {getMenuItems().map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              isExpanded ? '' : 'text-center'
            } ${
              isActive(item)
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {isExpanded ? item.label : item.label.charAt(0).toUpperCase()}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        {isExpanded && <div>© 2024 Gestion de Stage</div>}
      </div>
    </div>
  )
}
