import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ReportUpload() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [stage, setStage] = useState(null)
  const [existingReport, setExistingReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const [fichierUrl, setFichierUrl] = useState('')
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isDemo) {
      // Démo : simule un stage existant
      setStage({ id_stage: 'demo-stage', label: 'Stage chez TechCorp' })
      setLoading(false)
    } else if (user) {
      fetchStageEtudiant()
    }
  }, [user, isDemo])

  const fetchStageEtudiant = async () => {
    setLoading(true)

    const { data: etudiant } = await supabase
      .from('etudiant')
      .select('id_etudiant')
      .eq('id_utilisateur', user.id)
      .single()

    if (!etudiant) { setLoading(false); return }

    // Cherche un stage en cours ou terminé pour cet étudiant
    const { data: stages } = await supabase
      .from('stage')
      .select(`
        id_stage, date_debut, date_fin, statut,
        candidature(
          offreStage(titre, entreprise(nom_societe))
        )
      `)
      .eq('candidature.etudiant.id_etudiant', etudiant.id_etudiant)
      .in('statut', ['en_cours', 'termine'])
      .limit(1)

    if (stages && stages.length > 0) {
      const s = stages[0]
      setStage({
        id_stage: s.id_stage,
        label: `${s.candidature?.offreStage?.titre || 'Stage'} @ ${s.candidature?.offreStage?.entreprise?.nom_societe || ''}`,
      })

      // Vérifie si rapport déjà soumis
      const { data: rapport } = await supabase
        .from('rapport_stage')
        .select('*')
        .eq('id_stage', s.id_stage)
        .single()

      if (rapport) {
        setExistingReport(rapport)
        setTitre(rapport.titre || '')
        setFichierUrl(rapport.fichier_url || '')
        setDescription(rapport.description || '')
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (isDemo) {
      setSuccess(true)
      setSaving(false)
      return
    }

    if (!stage) { setError('Aucun stage actif trouvé.'); setSaving(false); return }
    if (!fichierUrl.trim()) { setError('Le lien vers le fichier est obligatoire.'); setSaving(false); return }

    if (existingReport) {
      // Mise à jour
      const { error: err } = await supabase
        .from('rapport_stage')
        .update({ titre, description, fichier_url: fichierUrl, date_soumission: new Date().toISOString() })
        .eq('id_rapport', existingReport.id_rapport)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // Création
      const { error: err } = await supabase
        .from('rapport_stage')
        .insert({ id_stage: stage.id_stage, titre, description, fichier_url: fichierUrl, statut: 'soumis' })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSuccess(true)
    await fetchStageEtudiant()
    setSaving(false)
  }

  if (loading) return <div className="card-soft text-center py-8"><p className="text-muted-foreground">Chargement…</p></div>

  if (!stage && !isDemo) {
    return (
      <div className="card-soft text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <p className="font-semibold text-foreground mb-2">Aucun stage actif</p>
        <p className="text-sm text-muted-foreground">Vous pourrez soumettre votre rapport une fois votre stage commencé.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="card-soft max-w-2xl text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-lg font-semibold text-foreground mb-2">Rapport soumis avec succès !</p>
        <p className="text-sm text-muted-foreground">L'administration peut maintenant le consulter et le noter.</p>
        <button onClick={() => setSuccess(false)} className="btn-secondary mt-4 text-sm">Modifier le rapport</button>
      </div>
    )
  }

  return (
    <div className="card-soft max-w-2xl space-y-6">
      {stage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">📋 {stage.label || 'Stage actif'}</p>
        </div>
      )}

      {existingReport && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            ✅ Rapport déjà soumis le {existingReport.date_soumission?.split('T')[0]}
            {existingReport.note && ` — Note : ${existingReport.note}/20`}
          </p>
          <p className="text-xs text-green-600 mt-1">Vous pouvez mettre à jour votre rapport ci-dessous.</p>
        </div>
      )}

      {/* Lien fichier */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Lien vers le rapport *
          <span className="text-xs text-muted-foreground ml-2">(Google Drive, OneDrive, Dropbox…)</span>
        </label>
        <input type="url" value={fichierUrl} onChange={e => setFichierUrl(e.target.value)}
          className="input-soft" placeholder="https://drive.google.com/votre-rapport.pdf" required />
        <p className="text-xs text-muted-foreground mt-1">
          Assurez-vous que le lien est accessible (mode "Tout le monde peut consulter").
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Titre du rapport</label>
        <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
          className="input-soft" placeholder="Ex: Rapport de Stage — TechCorp 2024" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description <span className="text-xs text-muted-foreground">(optionnel)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          className="input-soft resize-none" rows={4}
          placeholder="Résumez les points clés de votre stage…" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      <button onClick={handleSubmit} disabled={saving || (!isDemo && !fichierUrl.trim())}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? 'Envoi…' : existingReport ? 'Mettre à jour le rapport' : 'Soumettre le rapport'}
      </button>
    </div>
  )
}
