import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import evaluationsData from '../data/evaluations.json'

export default function StudentEvaluations() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setEvaluations(evaluationsData.evaluations.filter(e => e.studentId === 'etudiant1'))
      setLoading(false)
    } else if (user) {
      fetchEvaluations()
    }
  }, [user, isDemo])

  const fetchEvaluations = async () => {
    setLoading(true)

    // Récupère id_etudiant
    const { data: etudiant } = await supabase
      .from('etudiant')
      .select('id_etudiant')
      .eq('id_utilisateur', user.id)
      .single()

    if (!etudiant) { setLoading(false); return }

    // Remonte la chaîne : etudiant → candidature → stage → evaluations
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        stage(
          date_debut, date_fin,
          candidature(
            offreStage(titre, entreprise(nom_societe)),
            etudiant(id_etudiant)
          )
        )
      `)
      .eq('stage.candidature.etudiant.id_etudiant', etudiant.id_etudiant)

    if (!error && data) {
      // Filtre côté client car le filtre imbriqué peut ne pas fonctionner
      const filtered = data.filter(
        e => e.stage?.candidature?.etudiant?.id_etudiant === etudiant.id_etudiant
      )
      setEvaluations(filtered.map(e => ({
        id: e.id_evaluation,
        company: e.stage?.candidature?.offreStage?.entreprise?.nom_societe || 'Entreprise',
        offerTitle: e.stage?.candidature?.offreStage?.titre || '',
        rating: e.note_entreprise || 0,
        note_tuteur: e.note_tuteur_ecole,
        note_finale: e.note_finale,
        comments: e.commentaire_entreprise || '',
        commentaire_tuteur: e.commentaire_tuteur_ecole || '',
        points_forts: e.points_forts || '',
        points_amelioration: e.points_amelioration || '',
        evaluatedAt: e.date_evaluation?.split('T')[0],
        type: e.type_evaluation,
      })))
    }
    setLoading(false)
  }

  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((s, e) => s + (e.rating || 0), 0) / evaluations.length).toFixed(1)
    : 0

  if (loading) return <div className="card-soft text-center py-12"><p className="text-muted-foreground">Chargement…</p></div>

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Mes Évaluations</h2>
        <p className="text-muted-foreground mt-1">Consultez les avis reçus des entreprises et de l'établissement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft border border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">Évaluations reçues</p>
          <p className="text-3xl font-bold text-primary">{evaluations.length}</p>
        </div>
        <div className="card-soft border border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">Note entreprise moy.</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-accent">{avgRating}</span>
            <span className="text-2xl">⭐</span>
          </div>
        </div>
        <div className="card-soft border border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">Note finale moy.</p>
          <p className="text-3xl font-bold text-green-600">
            {evaluations.filter(e => e.note_finale).length > 0
              ? (evaluations.filter(e => e.note_finale).reduce((s, e) => s + e.note_finale, 0) / evaluations.filter(e => e.note_finale).length).toFixed(1)
              : '—'
            }/20
          </p>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <div className="card-soft text-center py-12">
          <div className="text-4xl mb-4">⭐</div>
          <p className="text-lg text-muted-foreground mb-2">Pas encore d'évaluations</p>
          <p className="text-sm text-muted-foreground">Vous recevrez des évaluations à la fin de votre stage</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map(evaluation => (
            <div key={evaluation.id} className="card-soft border border-border hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{evaluation.company}</h4>
                  {evaluation.offerTitle && <p className="text-sm text-primary">{evaluation.offerTitle}</p>}
                  <p className="text-xs text-muted-foreground">{evaluation.evaluatedAt} {evaluation.type && `• Évaluation ${evaluation.type}`}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(evaluation.rating) ? 'text-primary' : 'text-muted-foreground'}>★</span>
                    ))}
                  </div>
                  <p className="font-bold text-primary">{evaluation.rating}/5</p>
                </div>
              </div>

              {evaluation.comments && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-foreground mb-1">Retours entreprise</p>
                  <p className="text-foreground bg-muted rounded-lg p-3 text-sm">{evaluation.comments}</p>
                </div>
              )}

              {evaluation.points_forts && (
                <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-medium text-green-800 mb-1">Points forts</p>
                  <p className="text-sm text-green-700">{evaluation.points_forts}</p>
                </div>
              )}

              {evaluation.points_amelioration && (
                <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">Axes d'amélioration</p>
                  <p className="text-sm text-amber-700">{evaluation.points_amelioration}</p>
                </div>
              )}

              {evaluation.note_finale && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Note finale</p>
                    {evaluation.commentaire_tuteur && <p className="text-xs text-blue-600 mt-1">{evaluation.commentaire_tuteur}</p>}
                  </div>
                  <span className="text-2xl font-bold text-blue-700">{evaluation.note_finale}/20</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
