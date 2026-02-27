const getStatusInfo = (status) => {
  const map = {
    en_attente:       { label: 'En attente',    className: 'bg-amber-100 text-amber-700' },
    en_cours:         { label: 'En cours',       className: 'bg-blue-100 text-blue-700' },
    validee:          { label: 'Validée',        className: 'bg-green-100 text-green-700' },
    annulee:          { label: 'Annulée',        className: 'bg-red-100 text-red-700' },
    signee_etudiant:  { label: 'Signée (étudiant)',   className: 'bg-blue-100 text-blue-700' },
    signee_entreprise:{ label: 'Signée (entreprise)', className: 'bg-purple-100 text-purple-700' },
    // compatibilité données mock
    acceptee: { label: 'Acceptée', className: 'bg-green-100 text-green-700' },
    rejetee:  { label: 'Rejetée',  className: 'bg-red-100 text-red-700' },
  }
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
}

export default function ConventionsList({ conventions, onValidate }) {
  if (!conventions || conventions.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">Aucune convention enregistrée</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conventions.map((conv) => {
        const si = getStatusInfo(conv.status)
        return (
          <div key={conv.id} className="card-soft border border-border bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{conv.studentName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${si.className}`}>{si.label}</span>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Entreprise :</span> {conv.companyName || conv.company || '—'}</p>
                  {(conv.offerTitle || conv.position) && (
                    <p><span className="font-medium text-foreground">Poste :</span> {conv.offerTitle || conv.position}</p>
                  )}
                  <p><span className="font-medium text-foreground">Durée :</span> {conv.startDate} → {conv.endDate}</p>
                  {(conv.mentor || conv.supervisor) && (
                    <p><span className="font-medium text-foreground">Superviseur :</span> {conv.mentor || conv.supervisor}</p>
                  )}
                </div>

                {/* Signatures */}
                {(conv.studentSigned !== undefined) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[
                      { label: 'Étudiant', signed: conv.studentSigned },
                      { label: 'Entreprise', signed: conv.companySigned },
                      { label: 'Établissement', signed: conv.schoolSigned },
                    ].map(sig => (
                      <span key={sig.label}
                        className={`text-xs px-2 py-0.5 rounded-full ${sig.signed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sig.signed ? '✓' : '○'} {sig.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {(conv.status === 'en_attente' || conv.status === 'en_cours') && (
                  <button onClick={() => onValidate(conv.id)} className="btn-primary text-sm whitespace-nowrap">
                    ✅ Valider
                  </button>
                )}
                {conv.status === 'validee' && (
                  <div className="text-xs text-muted-foreground text-right">
                    <p>Validée le</p>
                    <p className="font-medium text-foreground">{conv.validatedAt || '—'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
