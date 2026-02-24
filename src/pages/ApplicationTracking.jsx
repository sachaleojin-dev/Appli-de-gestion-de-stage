import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const applicationSteps = [
  { id: 1, label: 'Candidature Reçue', icon: '📤' },
  { id: 2, label: 'En Examen', icon: '👀' },
  { id: 3, label: 'Entretien', icon: '💬' },
  { id: 4, label: 'Validation', icon: '✅' },
  { id: 5, label: 'Convention Signée', icon: '📝' }
]

export default function ApplicationTracking() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(2)

  // Mock application data - in real app, fetch from context/API
  const application = {
    id: applicationId,
    offerTitle: 'Développeur Web Frontend React',
    companyName: 'TechCorp',
    appliedDate: '2024-02-01',
    status: 'En Examen',
    currentStep: currentStep,
    description: 'Nous sommes en train d\'examiner votre candidature. Nous vous recontacterons sous peu.',
    notes: []
  }

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suivi de Candidature</h2>
          <p className="text-muted-foreground mt-1">{application.offerTitle}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline text-sm"
        >
          Retour
        </button>
      </div>

      {/* Company Info Card */}
      <div className="card-soft border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{application.companyName}</h3>
            <p className="text-sm text-muted-foreground">Posté le {application.appliedDate}</p>
          </div>
          <div className="badge badge-validated">
            {application.status}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-6">Progression de votre Candidature</h3>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-border">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(currentStep / applicationSteps.length) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between mb-8">
            {applicationSteps.map((step) => {
              const status = getStepStatus(step.id)
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all z-10 relative ${
                      status === 'completed'
                        ? 'bg-success text-white'
                        : status === 'current'
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-border text-muted-foreground'
                    }`}
                  >
                    {status === 'completed' ? '✓' : step.icon}
                  </button>
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-medium ${
                      status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Step Details */}
        <div className="border-t border-border pt-6 mt-6">
          <h4 className="font-semibold text-foreground mb-3">
            Étape Actuelle: {applicationSteps[currentStep - 1].label}
          </h4>
          <div className="bg-gradient-soft p-4 rounded-lg border border-border/50">
            <p className="text-foreground">{application.description}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Historique</h3>
        <div className="space-y-4">
          {[
            { step: 1, date: '2024-02-01', message: 'Votre candidature a été reçue' },
            { step: 2, date: '2024-02-05', message: 'Votre candidature est en cours d\'examen' },
          ].map((entry, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                {idx < 1 && <div className="w-0.5 h-16 bg-border mt-2"></div>}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{entry.message}</p>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <button className="btn-secondary">
          Contacter l'Entreprise
        </button>
        <button className="btn-outline">
          Annuler ma Candidature
        </button>
      </div>
    </div>
  )
}
