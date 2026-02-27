export default function Statistics({ stats, conventions = [], reports = [], evaluations = [] }) {
  // Accepte soit un objet `stats` pré-calculé, soit les tableaux bruts
  const conv = stats?.conventions || {
    total: conventions.length,
    validated: conventions.filter(c => c.status === 'validee').length,
    pending: conventions.filter(c => c.status === 'en_attente' || c.status === 'en_cours').length,
  }
  const rep = stats?.reports || {
    total: reports.length,
    submitted: reports.filter(r => r.fileName || r.fichier_url).length,
    graded: reports.filter(r => r.grade || r.note).length,
  }
  const ev = stats?.evaluations || {
    total: evaluations.length,
    avgRating: evaluations.length > 0
      ? (evaluations.reduce((s, e) => s + (e.rating || e.note_entreprise || 0), 0) / evaluations.length).toFixed(1)
      : 0,
  }

  const validationRate = conv.total > 0 ? Math.round((conv.validated / conv.total) * 100) : 0
  const submissionRate = rep.total > 0 ? Math.round((rep.submitted / rep.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Taux de validation</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary">{validationRate}%</span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{conv.validated} validées</p>
              <p>{conv.pending} en attente</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${validationRate}%` }} />
          </div>
        </div>

        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Rapports soumis</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-accent">{submissionRate}%</span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{rep.submitted} soumis</p>
              <p>{rep.total - rep.submitted} manquants</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${submissionRate}%` }} />
          </div>
        </div>

        <div className="card-soft border border-border bg-white">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Note moyenne</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-green-600">{ev.avgRating}/5</span>
            <div className="text-right text-xs text-muted-foreground">
              <p>{ev.total} évaluations</p>
            </div>
          </div>
          <div className="flex gap-0.5 mt-2">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={i <= Math.round(ev.avgRating) ? 'text-primary' : 'text-muted-foreground'}>★</span>
            ))}
          </div>
        </div>
      </div>

      {/* Détails rapports */}
      <div className="card-soft border border-border bg-white">
        <h3 className="text-lg font-semibold text-foreground mb-4">Détail des rapports</h3>
        <div className="space-y-3">
          {[
            { label: 'Total rapports attendus', value: rep.total, color: 'text-foreground' },
            { label: 'Rapports soumis', value: rep.submitted, color: 'text-blue-600' },
            { label: 'Rapports notés', value: rep.graded, color: 'text-green-600' },
            { label: 'En attente de notation', value: rep.submitted - rep.graded, color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
              <span className="text-foreground">{item.label}</span>
              <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top évaluations */}
      {evaluations.length > 0 && (
        <div className="card-soft border border-border bg-white">
          <h3 className="text-lg font-semibold text-foreground mb-4">Meilleures évaluations</h3>
          <div className="space-y-2">
            {[...evaluations]
              .sort((a, b) => (b.rating || b.note_entreprise || 0) - (a.rating || a.note_entreprise || 0))
              .slice(0, 3)
              .map((ev, idx) => (
                <div key={idx} className="flex items-start justify-between pb-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{ev.studentName || 'Étudiant'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ev.comments || ev.commentaire_entreprise || ''}</p>
                  </div>
                  <span className="text-sm font-bold text-primary ml-4 flex-shrink-0">
                    {ev.rating || ev.note_entreprise || 0}/5 ⭐
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Conventions par statut */}
      {conventions.length > 0 && (
        <div className="card-soft border border-border bg-white">
          <h3 className="text-lg font-semibold text-foreground mb-4">Conventions par statut</h3>
          <div className="space-y-2">
            {[
              { label: 'En attente', count: conv.pending, color: 'bg-amber-100 text-amber-700' },
              { label: 'Validées', count: conv.validated, color: 'bg-green-100 text-green-700' },
              { label: 'Annulées', count: conventions.filter(c => c.status === 'annulee' || c.status === 'rejetee').length, color: 'bg-red-100 text-red-700' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                <span className="font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
