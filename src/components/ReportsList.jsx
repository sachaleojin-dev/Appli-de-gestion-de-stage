import { useState } from 'react'

export default function ReportsList({ reports, onGrade }) {
  const [gradingId, setGradingId] = useState(null)
  const [gradeValue, setGradeValue] = useState('')
  const [feedbackValue, setFeedbackValue] = useState('')

  const handleSubmitGrade = (reportId) => {
    if (!gradeValue) return
    // Passe aussi le feedback si onGrade accepte 3 params
    onGrade(reportId, gradeValue, feedbackValue)
    setGradingId(null)
    setGradeValue('')
    setFeedbackValue('')
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">Aucun rapport enregistré</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const hasFile = !!(report.fileName || report.fichier_url)
        const grade = report.grade || report.note

        return (
          <div key={report.id} className="card-soft border border-border bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{report.studentName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${hasFile ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {hasFile ? 'Soumis' : 'Non soumis'}
                  </span>
                </div>

                {report.company && (
                  <p className="text-sm text-muted-foreground mb-1">Stage chez <strong>{report.company}</strong></p>
                )}

                {report.title && <p className="text-sm text-foreground mb-2">📋 {report.title}</p>}

                {hasFile && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span>📄</span>
                    {report.fichier_url ? (
                      <a href={report.fichier_url} target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline">
                        {report.fileName || 'Voir le rapport'}
                      </a>
                    ) : (
                      <span className="text-foreground">{report.fileName}</span>
                    )}
                    {report.uploadedAt && (
                      <span className="text-xs text-muted-foreground">(soumis le {report.uploadedAt})</span>
                    )}
                  </div>
                )}

                {grade && (
                  <div className="flex items-start gap-3 mt-2">
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Note</p>
                      <p className="text-2xl font-bold text-green-700">{grade}/20</p>
                    </div>
                    {(report.feedback) && (
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Retours</p>
                        <p className="text-sm text-foreground">{report.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {hasFile && !grade && (
                <div className="flex-shrink-0">
                  {gradingId === report.id ? (
                    <div className="space-y-2 w-48">
                      <input type="number" min="0" max="20" step="0.5" value={gradeValue}
                        onChange={e => setGradeValue(e.target.value)}
                        className="input-soft text-sm" placeholder="Note /20" />
                      <input type="text" value={feedbackValue}
                        onChange={e => setFeedbackValue(e.target.value)}
                        className="input-soft text-sm" placeholder="Retours (optionnel)" />
                      <div className="flex gap-1">
                        <button onClick={() => handleSubmitGrade(report.id)}
                          disabled={!gradeValue}
                          className="btn-primary text-sm flex-1 disabled:opacity-50">✓</button>
                        <button onClick={() => { setGradingId(null); setGradeValue(''); setFeedbackValue('') }}
                          className="btn-secondary text-sm">✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setGradingId(report.id); setGradeValue(''); setFeedbackValue('') }}
                      className="btn-primary text-sm">
                      ✏️ Noter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
