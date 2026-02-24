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

export default function ApplicationsReview({ applications, onUpdateStatus }) {
  const pendingApps = applications.filter(app => app.status === 'en_attente')

  if (pendingApps.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">
          Aucune candidature en attente
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const badge = getStatusBadge(app.status)
        return (
          <div key={app.id} className="card-soft border border-border bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {app.studentName}
                  </h3>
                  <span className={`badge ${badge.className} text-xs`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  "{app.message}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Candidature du {app.appliedAt}
                </p>
              </div>
              
              {app.status === 'en_attente' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onUpdateStatus(app.id, 'acceptee')}
                    className="btn-secondary text-sm"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => onUpdateStatus(app.id, 'refusee')}
                    className="btn-outline text-sm"
                  >
                    Refuser
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
