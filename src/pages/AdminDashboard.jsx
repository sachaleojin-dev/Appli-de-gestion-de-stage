import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import conventionsData from '../data/conventions.json'
import rapportsData from '../data/rapports.json'
import evaluationsData from '../data/evaluations.json'
import ConventionsList from '../components/ConventionsList'
import ReportsList from '../components/ReportsList'
import Statistics from '../components/Statistics'

const tabs = [
  { id: 'conventions', label: 'Conventions' },
  { id: 'reports',     label: 'Rapports' },
  { id: 'stats',       label: 'Statistiques' }
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'conventions'
  const setActiveTab = (tab) => setSearchParams({ tab })

  const isDemo = user?.isDemo === true

  const [conventions, setConventions] = useState(conventionsData.conventions)
  const [reports, setReports] = useState(rapportsData.rapports)
  const [evaluations, setEvaluations] = useState(evaluationsData.evaluations)

  const handleValidateConvention = (convId) => {
    setConventions(conventions.map(conv =>
      conv.id === convId
        ? { ...conv, status: 'validee', validatedAt: new Date().toISOString().split('T')[0] }
        : conv
    ))
  }

  const handleGradeReport = (reportId, grade) => {
    setReports(reports.map(report =>
      report.id === reportId
        ? { ...report, status: 'evalue', grade }
        : report
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tableau de Bord Administration
        </h2>
        <p className="text-muted-foreground">
          Gérez les conventions, rapports et statistiques des stages
        </p>
        {isDemo && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">
            Mode démonstration — données fictives
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-soft border border-border bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary">{conventions.length}</h3>
            <p className="text-sm text-muted-foreground">Conventions</p>
          </div>
        </div>
        <div className="card-soft border border-border bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-accent">
              {conventions.filter(c => c.status === 'validee').length}
            </h3>
            <p className="text-sm text-muted-foreground">Validées</p>
          </div>
        </div>
        <div className="card-soft border border-border bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-success">
              {reports.filter(r => r.fileName).length}
            </h3>
            <p className="text-sm text-muted-foreground">Rapports Soumis</p>
          </div>
        </div>
        <div className="card-soft border border-border bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary">{evaluations.length}</h3>
            <p className="text-sm text-muted-foreground">Évaluations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="mt-6">
        {activeTab === 'conventions' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Gestion des Conventions ({conventions.length})
            </h3>
            <ConventionsList
              conventions={conventions}
              onValidate={handleValidateConvention}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Rapports de Stage ({reports.length})
            </h3>
            <ReportsList
              reports={reports}
              onGrade={handleGradeReport}
            />
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Statistiques Globales
            </h3>
            <Statistics
              conventions={conventions}
              reports={reports}
              evaluations={evaluations}
            />
          </div>
        )}
      </div>
    </div>
  )
}
