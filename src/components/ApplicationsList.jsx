import { useNavigate } from 'react-router-dom'

const getStatusBadge = (status) => {
  const badges = {
    en_attente: 'badge-pending',
    acceptee: 'badge-accepted',
    refusee: 'badge-rejected',
    validee: 'badge-validated'
  }
  const labels = {
    en_attente: 'En attente',
    acceptee: 'Acceptée',
    refusee: 'Refusée',
    validee: 'Validée'
  }
  return { className: badges[status], label: labels[status] }
}

export default function ApplicationsList({ applications, isStudentView = true }) {
  const navigate = useNavigate()

  if (applications.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">
          {isStudentView ? 'Vous n\'avez pas encore candidaté à une offre' : 'Aucune candidature'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const badge = getStatusBadge(app.status)
        return (
          <div key={app.id} className="card-soft border border-border bg-white hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{app.offerTitle || `Offre #${app.offerId}`}</h3>
                <p className="text-sm text-muted-foreground mt-1">{app.message || app.companyName}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Candidature du {app.appliedAt}
                </p>
                <div className="flex gap-2 mt-3">
                  {isStudentView && (
                    <button
                      onClick={() => navigate(`/application/${app.id}`)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Suivre ma candidature →
                    </button>
                  )}
                  {!isStudentView && (
                    <button
                      onClick={() => navigate(`/student/${app.studentEmail || app.studentId}`)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Voir le profil →
                    </button>
                  )}
                </div>
              </div>
              <span className={`badge ${badge.className} whitespace-nowrap ml-4`}>
                {badge.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
