export default function OfferManagement({ offers }) {
  if (offers.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">
          Vous n'avez pas encore créé d'offre de stage
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div key={offer.id} className="card-soft border border-border bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg">{offer.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {offer.description}
              </p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                <span>📍 {offer.location}</span>
                <span>⏱️ {offer.duration}</span>
                <span>💰 {offer.salary}</span>
                <span>📅 {offer.startDate}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {offer.requirements && offer.requirements.map((req, idx) => (
                  <span key={idx} className="badge-pending text-xs">
                    {req}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-secondary text-sm">Modifier</button>
              <button className="btn-outline text-sm">Archiver</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
