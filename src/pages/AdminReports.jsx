import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import rapportsData from '../data/rapports.json'

export default function AdminReports() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setReports(rapportsData.rapports)
      setLoading(false)
    } else {
      fetchReports()
    }
  }, [user, isDemo])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rapport_stage')
      .select(`
        *,
        stage(
          date_debut, date_fin,
          candidature(
            offreStage(titre, entreprise(nom_societe)),
            etudiant(utilisateur(nom, prenom))
          )
        )
      `)
      .order('date_soumission', { ascending: false })

    if (!error && data) {
      setReports(data.map(r => ({
        id: r.id_rapport,
        id_stage: r.id_stage,
        studentName: r.stage?.candidature?.etudiant?.utilisateur
          ? `${r.stage.candidature.etudiant.utilisateur.prenom} ${r.stage.candidature.etudiant.utilisateur.nom}`
          : 'Étudiant',
        company: r.stage?.candidature?.offreStage?.entreprise?.nom_societe || '',
        title: r.titre,
        fileName: r.fichier_url ? r.fichier_url.split('/').pop() : null,
        fichier_url: r.fichier_url,
        uploadedAt: r.date_soumission?.split('T')[0],
        grade: r.note,
        feedback: r.feedback,
        status: r.statut,
        period: r.stage ? `${r.stage.date_debut} → ${r.stage.date_fin}` : '',
      })))
    }
    setLoading(false)
  }

  const handleGradeReport = async (reportId) => {
    if (!grade) return
    setSaving(true)

    if (isDemo) {
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, grade: parseFloat(grade), feedback, status: 'evalue' } : r
      ))
    } else {
      await supabase.from('rapport_stage').update({
        note: parseFloat(grade),
        feedback,
        statut: 'evalue',
        note_par: 'Administration',
        date_notation: new Date().toISOString(),
      }).eq('id_rapport', reportId)
      await fetchReports()
    }

    setGrade('')
    setFeedback('')
    setSelectedReport(null)
    setSaving(false)
  }

  const filteredReports = filterStatus === 'all' ? reports
    : filterStatus === 'graded' ? reports.filter(r => r.grade)
    : reports.filter(r => !r.grade && r.fileName)

  const avgGrade = reports.filter(r => r.grade).length > 0
    ? (reports.filter(r => r.grade).reduce((s, r) => s + r.grade, 0) / reports.filter(r => r.grade).length).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Rapports</h2>
        <p className="text-muted-foreground mt-1">Évaluez les rapports de stage soumis</p>
        {isDemo && <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">Mode démonstration</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total rapports', value: reports.length, color: 'text-primary' },
          { label: 'Soumis', value: reports.filter(r => r.fileName).length, color: 'text-blue-600' },
          { label: 'Notés', value: reports.filter(r => r.grade).length, color: 'text-green-600' },
          { label: 'Moyenne', value: `${avgGrade}/20`, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card-soft border border-border text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[{ id: 'all', label: 'Tous' }, { id: 'pending', label: 'En attente' }, { id: 'graded', label: 'Notés' }].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${filterStatus === f.id ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-border'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Chargement…</p>
      ) : filteredReports.length === 0 ? (
        <div className="card-soft text-center py-8"><p className="text-muted-foreground">Aucun rapport trouvé.</p></div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => (
            <div key={report.id} className="card-soft border border-border hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{report.studentName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${report.grade ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {report.grade ? 'Noté' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Stage chez <strong>{report.company}</strong> {report.period && `• ${report.period}`}</p>
                  {report.title && <p className="text-sm text-foreground mb-1">📋 {report.title}</p>}
                  {report.fileName && (
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span>📄</span>
                      {report.fichier_url ? (
                        <a href={report.fichier_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{report.fileName}</a>
                      ) : (
                        <span className="text-foreground">{report.fileName}</span>
                      )}
                      {report.uploadedAt && <span className="text-xs text-muted-foreground">({report.uploadedAt})</span>}
                    </div>
                  )}
                  {report.grade && (
                    <div className="flex items-start gap-4 mt-2">
                      <div className="p-2 bg-green-50 rounded-lg border border-green-200 text-center">
                        <p className="text-xs text-muted-foreground">Note</p>
                        <p className="text-2xl font-bold text-green-700">{report.grade}/20</p>
                      </div>
                      {report.feedback && (
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Retours</p>
                          <p className="text-sm text-foreground">{report.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {report.fileName && !report.grade && (
                  <button onClick={() => setSelectedReport(report)} className="btn-primary text-sm flex-shrink-0">
                    ✏️ Noter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale notation */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Noter le rapport de {selectedReport.studentName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Note (0-20) *</label>
                <input type="number" min="0" max="20" step="0.5" value={grade}
                  onChange={e => setGrade(e.target.value)} className="input-soft" placeholder="Ex: 15" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Retours</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  className="input-soft resize-none" rows={4} placeholder="Commentaires sur le rapport…" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedReport(null); setGrade(''); setFeedback('') }} className="flex-1 btn-secondary">Annuler</button>
                <button onClick={() => handleGradeReport(selectedReport.id)} disabled={!grade || saving}
                  className="flex-1 btn-primary disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
