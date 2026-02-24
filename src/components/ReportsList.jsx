import { useState } from 'react'

export default function ReportsList({ reports, onGrade }) {
  const [gradingId, setGradingId] = useState(null)
  const [gradeValue, setGradeValue] = useState(0)

  const handleSubmitGrade = (reportId) => {
    onGrade(reportId, gradeValue)
    setGradingId(null)
    setGradeValue(0)
  }

  if (reports.length === 0) {
    return (
      <div className="card-soft bg-white text-center py-8">
        <p className="text-muted-foreground">
          Aucun rapport enregistré
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="card-soft border border-border bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-foreground">
                  {report.studentName}
                </h3>
                <span className={`badge text-xs ${
                  report.fileName ? 'badge-accepted' : 'badge-pending'
                }`}>
                  {report.status === 'soumis' ? 'Soumis' : 'Non soumis'}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {report.title}
              </p>

              {report.fileName && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📄</span>
                  <span className="text-foreground">{report.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    (Uploadé le {report.uploadedAt})
                  </span>
                </div>
              )}

              {report.grade && (
                <div className="mt-2 p-2 bg-primary bg-opacity-10 rounded text-sm">
                  <span className="font-medium text-foreground">Note:</span> {report.grade}/20
                </div>
              )}
            </div>
            
            {report.fileName && !report.grade && (
              <div className="flex-shrink-0">
                {gradingId === report.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={gradeValue}
                      onChange={(e) => setGradeValue(parseFloat(e.target.value))}
                      className="input-soft w-16 text-sm"
                      placeholder="/20"
                    />
                    <button
                      onClick={() => handleSubmitGrade(report.id)}
                      className="btn-secondary text-sm whitespace-nowrap"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => setGradingId(null)}
                      className="btn-outline text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setGradingId(report.id)
                      setGradeValue(0)
                    }}
                    className="btn-secondary text-sm"
                  >
                    Noter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
