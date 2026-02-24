import { useState } from 'react'
import rapportsData from '../data/rapports.json'

export default function AdminReports() {
  const [reports, setReports] = useState(rapportsData.rapports)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')

  const filteredReports = filterStatus === 'all'
    ? reports
    : reports.filter(r => filterStatus === 'graded' ? r.grade : !r.grade)

  const handleGradeReport = (reportId) => {
    if (!grade) return
    
    setReports(reports.map(r =>
      r.id === reportId
        ? { ...r, grade: parseFloat(grade), feedback, gradedAt: new Date().toISOString().split('T')[0], gradedBy: 'Admin' }
        : r
    ))
    
    setGrade('')
    setFeedback('')
    setSelectedReport(null)
  }

  const avgGrade = reports.filter(r => r.grade).length > 0
    ? (reports.filter(r => r.grade).reduce((sum, r) => sum + r.grade, 0) / reports.filter(r => r.grade).length).toFixed(2)
    : 0

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Rapports</h2>
        <p className="text-muted-foreground mt-1">Évaluez les rapports de stage soumis par les étudiants</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total Rapports</p>
          <p className="text-3xl font-bold text-primary">{reports.length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Notés</p>
          <p className="text-3xl font-bold text-success">{reports.filter(r => r.grade).length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">En Attente</p>
          <p className="text-3xl font-bold text-accent">{reports.filter(r => !r.grade).length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Moyenne</p>
          <p className="text-3xl font-bold text-primary">{avgGrade}/20</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'pending'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          En Attente
        </button>
        <button
          onClick={() => setFilterStatus('graded')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'graded'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Notés
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report) => (
          <div key={report.id} className="card-soft border border-border hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{report.studentName}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Stage chez <strong>{report.company}</strong> - {report.period}
                </p>
                <p className="text-sm text-foreground mb-3">
                  Fichier: <a href="#" className="text-primary hover:underline">{report.fileName}</a>
                </p>
                
                {report.grade ? (
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">Note Attribuée</p>
                      <p className="text-2xl font-bold text-success">{report.grade}/20</p>
                    </div>
                    {report.feedback && (
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Retours</p>
                        <p className="text-sm text-foreground">{report.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900">
                      Rapport en attente de notation
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                {!report.grade && (
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="btn-primary text-sm"
                  >
                    Noter
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de notation */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Noter le rapport de {selectedReport.studentName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Note (0-20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="input-soft"
                  placeholder="15"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Retours</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="input-soft resize-none"
                  rows="4"
                  placeholder="Entrez vos commentaires..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleGradeReport(selectedReport.id)}
                  className="flex-1 btn-primary"
                >
                  Enregistrer Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
