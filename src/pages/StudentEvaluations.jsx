import { useState } from 'react'
import evaluationsData from '../data/evaluations.json'

export default function StudentEvaluations() {
  const [evaluations] = useState(evaluationsData.evaluations.filter(e => e.studentId === 'etudiant1'))

  const avgRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(2)
    : 0

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Mes Évaluations</h2>
        <p className="text-muted-foreground mt-1">Consultez les avis reçus des entreprises</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Nombre d'Évaluations</p>
          <p className="text-3xl font-bold text-primary">{evaluations.length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Note Moyenne</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-accent">{avgRating}</span>
            <span className="text-2xl">⭐</span>
          </div>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Taux de Satisfaction</p>
          <p className="text-3xl font-bold text-success">{evaluations.length > 0 ? Math.round((avgRating / 5) * 100) : 0}%</p>
        </div>
      </div>

      {/* Evaluations List */}
      {evaluations.length > 0 ? (
        <div className="space-y-4">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="card-soft border border-border hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{evaluation.company}</h4>
                  <p className="text-xs text-muted-foreground">{evaluation.evaluationDate}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < evaluation.rating ? 'text-primary' : 'text-muted-foreground'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-lg font-bold text-primary">{evaluation.rating}/5</p>
                </div>
              </div>

              {/* Skills Evaluation */}
              {evaluation.skillsRating && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Compétences</p>
                  <div className="space-y-2">
                    {Object.entries(evaluation.skillsRating).map(([skill, rating]) => (
                      <div key={skill} className="flex items-center justify-between text-sm">
                        <span className="text-foreground capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < rating ? 'text-primary' : 'text-muted-foreground'}>
                              ●
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Retours</p>
                <p className="text-foreground bg-white rounded-lg p-3 border border-border">
                  {evaluation.comments}
                </p>
              </div>

              {/* Suggestions */}
              {evaluation.suggestions && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">Suggestions d'Amélioration</p>
                  <p className="text-sm text-amber-800">{evaluation.suggestions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-soft text-center py-12">
          <p className="text-lg text-muted-foreground mb-2">Pas encore d'évaluations</p>
          <p className="text-sm text-muted-foreground">Complétez vos stages pour recevoir des évaluations</p>
        </div>
      )}

      {/* Rating Distribution */}
      {evaluations.length > 0 && (
        <div className="card-soft border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Distribution des Notes</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = evaluations.filter(e => Math.round(e.rating) === rating).length
              const percentage = evaluations.length > 0 ? (count / evaluations.length) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(rating)].map((_, i) => (
                      <span key={i} className="text-primary">★</span>
                    ))}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
