export default function OfferCard({ offer, onApply, isApplied }) {
  return (
    <div className="card-soft border border-border bg-white">
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-foreground text-lg">{offer.title}</h3>
          <p className="text-sm text-primary font-medium">{offer.company}</p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {offer.description}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>📍</span>
            <span>{offer.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>⏱️</span>
            <span>{offer.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>💰</span>
            <span>{offer.salary}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>📅</span>
            <span>{offer.startDate}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {offer.requirements && offer.requirements.slice(0, 3).map((req, idx) => (
            <span key={idx} className="badge-pending">
              {req}
            </span>
          ))}
        </div>

        <button
          onClick={() => onApply(offer.id)}
          disabled={isApplied}
          className={`w-full btn-soft transition-all ${
            isApplied
              ? 'bg-success text-white cursor-default'
              : 'btn-primary hover:opacity-90'
          }`}
        >
          {isApplied ? '✓ Candidature envoyée' : 'Postuler'}
        </button>
      </div>
    </div>
  )
}
