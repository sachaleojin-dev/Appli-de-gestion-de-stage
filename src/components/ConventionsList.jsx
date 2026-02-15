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

export default function ConventionsList({ conventions, onValidate }) {
  if (conventions.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">
          Aucune convention enregistrée
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conventions.map((conv) => {
        const badge = getStatusBadge(conv.status)
        return (
          <div key={conv.id} className="card-soft border border-border bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {conv.studentName}
                  </h3>
                  <span className={`badge ${badge.className} text-xs`}>
                    {badge.label}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Entreprise:</span> {conv.companyName}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Poste:</span> {conv.offerTitle}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Durée:</span> {conv.startDate} à {conv.endDate}
                  </p>
                  {conv.mentor && (
                    <p>
                      <span className="font-medium text-foreground">Mentor:</span> {conv.mentor}
                    </p>
                  )}
                </div>
              </div>
              
              {conv.status === 'en_attente' && (
                <button
                  onClick={() => onValidate(conv.id)}
                  className="btn-secondary text-sm flex-shrink-0"
                >
                  Valider
                </button>
              )}
              {conv.status === 'validee' && (
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  <p>Validée le</p>
                  <p className="font-medium text-foreground">{conv.validatedAt}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
