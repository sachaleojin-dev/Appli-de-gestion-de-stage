export default function Statistics({ conventions, reports, evaluations }) {
  const validatedConventions = conventions.filter(c => c.status === 'validee').length
  const pendingConventions = conventions.filter(c => c.status === 'en_attente').length
  const submittedReports = reports.filter(r => r.fileName).length
  const gradedReports = reports.filter(r => r.grade).length
  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(2)
    : 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Taux de Validation
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary">
              {conventions.length > 0 ? Math.round((validatedConventions / conventions.length) * 100) : 0}%
            </span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{validatedConventions} validées</p>
              <p>{pendingConventions} en attente</p>
            </div>
          </div>
        </div>

        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Rapports Soumis
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-accent">
              {reports.length > 0 ? Math.round((submittedReports / reports.length) * 100) : 0}%
            </span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{submittedReports} soumis</p>
              <p>{reports.length - submittedReports} manquants</p>
            </div>
          </div>
        </div>

        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Note Moyenne
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-success">
              {avgRating}/5
            </span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{evaluations.length} évaluations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="card-soft border border-border bg-white">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Détails des Rapports
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-foreground">Rapports soumis</span>
            <span className="font-bold text-lg text-primary">{submittedReports}</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-foreground">Rapports notés</span>
            <span className="font-bold text-lg text-success">{gradedReports}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">En attente de notation</span>
            <span className="font-bold text-lg text-accent">{submittedReports - gradedReports}</span>
          </div>
        </div>
      </div>

      {/* Top Evaluations */}
      {evaluations.length > 0 && (
        <div className="card-soft border border-border bg-white">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Meilleures Évaluations
          </h3>
          <div className="space-y-2">
            {evaluations
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map((evaluation, idx) => (
                <div key={idx} className="flex items-start justify-between pb-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{evaluation.studentName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {evaluation.comments}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary ml-4 flex-shrink-0">
                    {evaluation.rating}/5 ⭐
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
