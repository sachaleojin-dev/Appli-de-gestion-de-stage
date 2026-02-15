import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import candidaturesData from '../data/candidatures.json'

export default function CompanyCandidates() {
  const navigate = useNavigate()
  const [candidates] = useState(candidaturesData.candidatures)
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredCandidates = filterStatus === 'all' 
    ? candidates 
    : candidates.filter(c => c.status === filterStatus)

  const getStatusColor = (status) => {
    const colors = {
      en_attente: 'badge-pending',
      acceptee: 'badge-accepted',
      rejetee: 'badge-rejected'
    }
    return colors[status] || 'badge-pending'
  }

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En Attente',
      acceptee: 'Acceptée',
      rejetee: 'Rejetée'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Candidats Reçus</h2>
        <p className="text-muted-foreground mt-1">Gérez les candidatures reçues pour vos offres</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Tous ({candidates.length})
        </button>
        <button
          onClick={() => setFilterStatus('en_attente')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'en_attente'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          En Attente ({candidates.filter(c => c.status === 'en_attente').length})
        </button>
        <button
          onClick={() => setFilterStatus('acceptee')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'acceptee'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Acceptées ({candidates.filter(c => c.status === 'acceptee').length})
        </button>
        <button
          onClick={() => setFilterStatus('rejetee')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'rejetee'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Rejetées ({candidates.filter(c => c.status === 'rejetee').length})
        </button>
      </div>

      {/* Candidates List */}
      {filteredCandidates.length > 0 ? (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="card-soft border border-border hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {candidate.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{candidate.studentName}</h4>
                      <p className="text-xs text-muted-foreground">
                        Candidature reçue le {candidate.appliedAt}
                      </p>
                    </div>
                  </div>
                  {candidate.message && (
                    <p className="text-sm text-foreground mt-2 p-2 bg-muted rounded">
                      {candidate.message}
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/student/${candidate.studentEmail || candidate.studentId}`)}
                    className="text-sm text-primary hover:underline font-medium mt-2"
                  >
                    Voir le profil complet →
                  </button>
                </div>
                <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`${getStatusColor(candidate.status)} whitespace-nowrap`}>
                    {getStatusLabel(candidate.status)}
                  </span>
                  <button className="btn-primary text-xs px-3 py-1">
                    Évaluer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft text-center py-12">
          <p className="text-lg text-muted-foreground">Aucun candidat trouvé</p>
        </div>
      )}
    </div>
  )
}
