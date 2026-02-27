import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function EvaluationForm({ studentName = '', studentId = null, stageId = null, onSubmit }) {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [formData, setFormData] = useState({
    studentName: studentName,
    note: 3,
    commentaire: '',
    points_forts: '',
    points_amelioration: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Mettre à jour le nom si fourni en prop
  useEffect(() => {
    if (studentName) setFormData(prev => ({ ...prev, studentName }))
  }, [studentName])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (isDemo) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onSubmit) onSubmit(formData)
      }, 1500)
      setSaving(false)
      return
    }

    // Si on a un stageId (passé depuis CompanyDashboard), on insère directement
    if (stageId) {
      const { error: err } = await supabase.from('evaluations').insert({
        id_stage: stageId,
        note_entreprise: formData.note * 4, // convertit /5 en /20
        commentaire_entreprise: formData.commentaire,
        points_forts: formData.points_forts,
        points_amelioration: formData.points_amelioration,
        type_evaluation: 'finale',
      })
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // Si pas de stageId, on cherche le stage correspondant à cet étudiant
      setError("Impossible d'identifier le stage. Revenez depuis la liste des candidatures.")
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      if (onSubmit) onSubmit(formData)
    }, 1500)
    setSaving(false)
  }

  if (success) {
    return (
      <div className="card-soft max-w-2xl text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-lg font-semibold text-foreground">Évaluation enregistrée !</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Nom de l'étudiant</label>
        <input type="text" value={formData.studentName}
          onChange={e => setFormData({...formData, studentName: e.target.value})}
          className="input-soft" placeholder="Ex: Marie Dupont" required
          readOnly={!!studentName} />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Note globale — <span className="text-primary font-bold">{formData.note}/5</span>
          <span className="text-muted-foreground text-xs ml-2">(= {formData.note * 4}/20)</span>
        </label>
        <div className="flex items-center gap-4">
          <input type="range" min="0" max="5" step="0.5" value={formData.note}
            onChange={e => setFormData({...formData, note: parseFloat(e.target.value)})}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={i <= formData.note ? 'text-primary text-xl' : 'text-muted-foreground text-xl'}>★</span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Commentaire général *</label>
        <textarea value={formData.commentaire}
          onChange={e => setFormData({...formData, commentaire: e.target.value})}
          className="input-soft resize-none" rows={4} required
          placeholder="Avis global sur la performance et l'attitude de l'étudiant…" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Points forts</label>
        <textarea value={formData.points_forts}
          onChange={e => setFormData({...formData, points_forts: e.target.value})}
          className="input-soft resize-none" rows={2}
          placeholder="Qualités, compétences remarquées…" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Axes d'amélioration</label>
        <textarea value={formData.points_amelioration}
          onChange={e => setFormData({...formData, points_amelioration: e.target.value})}
          className="input-soft resize-none" rows={2}
          placeholder="Suggestions de progression…" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
        {saving ? 'Enregistrement…' : "Soumettre l'évaluation"}
      </button>
    </form>
  )
}
