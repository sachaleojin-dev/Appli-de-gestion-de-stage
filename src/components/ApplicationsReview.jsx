const getStatusBadge = (status) => {
  const badges = {
    en_attente: 'badge-pending',
    acceptee:   'badge-accepted',
    refusee:    'badge-rejected',
    validee:    'badge-validated'
  }
  const labels = {
    en_attente: 'En attente',
    acceptee:   'Acceptée',
    refusee:    'Refusée',
    validee:    'Validée'
  }
  return { className: badges[status] || 'badge-pending', label: labels[status] || status }
}

export default function ApplicationsReview({ applications, onUpdateStatus, onEvaluate }) {

  if (!applications || applications.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">Aucune candidature reçue</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const badge = getStatusBadge(app.status)
        // Compatibilité : lettre_motivation OU message selon la source
        const lettre = app.lettreMotivation || app.lettre_motivation || app.message || ''

        return (
          <div key={app.id} className="card-soft border border-border bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Nom étudiant + statut */}
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{app.studentName || 'Étudiant'}</h3>
                  <span className={`badge ${badge.className} text-xs`}>{badge.label}</span>
                </div>

                {/* Offre concernée */}
                {app.offerTitle && (
                  <p className="text-sm text-primary font-medium mb-1">📋 {app.offerTitle}</p>
                )}

                {/* Email */}
                {app.studentEmail && (
                  <p className="text-xs text-muted-foreground mb-2">✉️ {app.studentEmail}</p>
                )}

                {/* Lettre de motivation */}
                {lettre ? (
                  <div className="bg-muted rounded-lg p-3 mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Lettre de motivation</p>
                    <p className="text-sm text-foreground line-clamp-3">{lettre}</p>
                  </div>
                ) : null}

                {/* CV */}
                {app.cvUrl && (
                  <a href={app.cvUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline">
                    📎 Voir le CV
                  </a>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Candidature du {app.appliedAt || '—'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {app.status === 'en_attente' && (
                  <>
                    <button onClick={() => onUpdateStatus(app.id, 'acceptee')}
                      className="btn-primary text-sm whitespace-nowrap">
                      ✅ Accepter
                    </button>
                    <button onClick={() => onUpdateStatus(app.id, 'refusee')}
                      className="btn-secondary text-sm whitespace-nowrap">
                      ❌ Refuser
                    </button>
                  </>
                )}

                {(app.status === 'acceptee' || app.status === 'validee') && onEvaluate && (
                  <button onClick={() => onEvaluate(app)} className="btn-primary text-sm whitespace-nowrap">
                    ⭐ Évaluer
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
