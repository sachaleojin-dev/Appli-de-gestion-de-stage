import { useState } from 'react'

export default function EvaluationForm() {
  const [formData, setFormData] = useState({
    studentName: '',
    rating: 4,
    comments: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Évaluation soumise:', formData)
    setFormData({ studentName: '', rating: 4, comments: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Nom de l'étudiant
        </label>
        <input
          type="text"
          value={formData.studentName}
          onChange={(e) => setFormData({...formData, studentName: e.target.value})}
          className="input-soft"
          required
          placeholder="Ex: Marie Dupont"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Note (0-5)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={formData.rating}
            onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
            className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <span className="text-lg font-bold text-primary w-12">
            {formData.rating}/5
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Commentaires
        </label>
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData({...formData, comments: e.target.value})}
          className="input-soft resize-none"
          rows="5"
          required
          placeholder="Donnez votre avis sur la performance et l'attitude de l'étudiant..."
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Soumettre l'Évaluation
      </button>
    </form>
  )
}
