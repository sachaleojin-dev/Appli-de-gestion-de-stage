import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
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

  const [conventions, setConventions] = useState([])
  const [reports, setReports] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setConventions(conventionsData.conventions)
      setReports(rapportsData.rapports)
      setEvaluations(evaluationsData.evaluations)
      setLoading(false)
    } else {
      fetchAll()
    }
  }, [user, isDemo])

  // ── Fetch Supabase data ────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchConventions(), fetchReports(), fetchEvaluations()])
    setLoading(false)
  }

  const fetchConventions = async () => {
    const { data, error } = await supabase
      .from('convention')
      .select(`
        *,
        stage(
          id_stage,
          date_debut, date_fin,
          encadrant_entreprise,
          candidature(
            id_candidature,
            statut,
            offreStage(titre, entreprise(nom_societe)),
            etudiant(utilisateur(nom, prenom, email))
          )
        )
      `)
      .order('date_generation', { ascending: false })

    if (!error && data) {
      setConventions(data.map(c => ({
        id: c.id_convention,
        studentName: c.stage?.candidature?.etudiant?.utilisateur
          ? `${c.stage.candidature.etudiant.utilisateur.prenom} ${c.stage.candidature.etudiant.utilisateur.nom}`
          : 'Étudiant',
        companyName: c.stage?.candidature?.offreStage?.entreprise?.nom_societe || '',
        offerTitle: c.stage?.candidature?.offreStage?.titre || '',
        startDate: c.date_debut,
        endDate: c.date_fin,
        location: c.lieu,
        supervisor: c.superviseur,
        status: c.statut,
        studentSigned: c.signature_etudiant,
        companySigned: c.signature_entreprise,
        schoolSigned: c.signature_ecole,
        validatedAt: c.date_validation,
        rejectionReason: c.raison_rejet,
        mentor: c.stage?.encadrant_entreprise,
      })))
    }
  }

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('rapport_stage')
      .select(`
        *,
        stage(
          id_stage,
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
  }

  const fetchEvaluations = async () => {
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        stage(
          candidature(
            offreStage(entreprise(nom_societe)),
            etudiant(utilisateur(nom, prenom))
          )
        )
      `)
      .order('date_evaluation', { ascending: false })

    if (!error && data) {
      setEvaluations(data.map(e => ({
        id: e.id_evaluation,
        studentName: e.stage?.candidature?.etudiant?.utilisateur
          ? `${e.stage.candidature.etudiant.utilisateur.prenom} ${e.stage.candidature.etudiant.utilisateur.nom}`
          : 'Étudiant',
        company: e.stage?.candidature?.offreStage?.entreprise?.nom_societe || '',
        rating: e.note_entreprise || e.note_finale || 0,
        comments: e.commentaire_entreprise || e.commentaire_tuteur_ecole || '',
        note_finale: e.note_finale,
        evaluatedAt: e.date_evaluation?.split('T')[0],
      })))
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleValidateConvention = async (convId) => {
    if (isDemo) {
      setConventions(prev => prev.map(c =>
        c.id === convId ? { ...c, status: 'validee', schoolSigned: true, validatedAt: new Date().toISOString().split('T')[0] } : c
      ))
      return
    }
    await supabase.from('convention').update({
      statut: 'validee',
      signature_ecole: true,
      date_signature_ecole: new Date().toISOString(),
      date_validation: new Date().toISOString().split('T')[0],
    }).eq('id_convention', convId)
    await fetchConventions()
  }

  const handleGradeReport = async (reportId, grade, feedback) => {
    if (isDemo) {
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, grade: parseFloat(grade), feedback, status: 'evalue' } : r
      ))
      return
    }
    await supabase.from('rapport_stage').update({
      note: parseFloat(grade),
      feedback,
      statut: 'evalue',
      note_par: 'Administration',
      date_notation: new Date().toISOString(),
    }).eq('id_rapport', reportId)
    await fetchReports()
  }

  const statsData = {
    conventions: {
      total: conventions.length,
      validated: conventions.filter(c => c.status === 'validee').length,
      pending: conventions.filter(c => c.status === 'en_attente' || c.status === 'en_cours').length,
    },
    reports: {
      total: reports.length,
      submitted: reports.filter(r => r.fileName).length,
      graded: reports.filter(r => r.grade).length,
    },
    evaluations: {
      total: evaluations.length,
      avgRating: evaluations.length > 0
        ? (evaluations.reduce((s, e) => s + (e.rating || 0), 0) / evaluations.length).toFixed(2)
        : 0,
    },
  }

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tableau de Bord Administration</h2>
        <p className="text-muted-foreground">Gérez les conventions, rapports et statistiques des stages</p>
        {isDemo && <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">Mode démonstration — données fictives</p>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Conventions', value: conventions.length, color: 'text-primary' },
          { label: 'Validées', value: statsData.conventions.validated, color: 'text-green-600' },
          { label: 'Rapports soumis', value: statsData.reports.submitted, color: 'text-blue-600' },
          { label: 'Évaluations', value: evaluations.length, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card-soft border border-border bg-white text-center">
            <h3 className={`text-2xl font-bold ${s.color}`}>{s.value}</h3>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'conventions' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Gestion des Conventions ({conventions.length})</h3>
            {loading ? <p className="text-muted-foreground text-center py-8">Chargement…</p> : (
              <ConventionsList conventions={conventions} onValidate={handleValidateConvention} />
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Rapports de Stage ({reports.length})</h3>
            {loading ? <p className="text-muted-foreground text-center py-8">Chargement…</p> : (
              <ReportsList reports={reports} onGrade={handleGradeReport} />
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Statistiques Globales</h3>
            <Statistics stats={statsData} conventions={conventions} reports={reports} evaluations={evaluations} />
          </div>
        )}
      </div>
    </div>
  )
}
