import { useState } from 'react'
import offresData from '../data/offres.json'
import candidaturesData from '../data/candidatures.json'
import OfferManagement from '../components/OfferManagement'
import ApplicationsReview from '../components/ApplicationsReview'
import EvaluationForm from '../components/EvaluationForm'

const tabs = [
  { id: 'offers', label: 'Mes Offres' },
  { id: 'add-offer', label: 'Créer une Offre' },
  { id: 'applications', label: 'Candidatures Reçues' },
  { id: 'evaluate', label: 'Évaluer Étudiant' }
]

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('offers')
  const [offers, setOffers] = useState(offresData.offres.filter(o => o.companyId === 'entreprise1'))
  const [applications, setApplications] = useState(candidaturesData.candidatures)

  const handleAddOffer = (newOffer) => {
    setOffers([...offers, {
      id: `offre${Date.now()}`,
      ...newOffer,
      companyId: 'entreprise1',
      company: 'TechCorp',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    }])
  }

  const handleUpdateApplication = (appId, status) => {
    setApplications(applications.map(app =>
      app.id === appId ? { ...app, status } : app
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tableau de Bord TechCorp
        </h2>
        <p className="text-muted-foreground">
          Gérez vos offres de stage et candidatures
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'offers' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Offres Publiées ({offers.length})
            </h3>
            <OfferManagement offers={offers} />
          </div>
        )}

        {activeTab === 'add-offer' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Créer une Nouvelle Offre
            </h3>
            <OfferForm onSubmit={handleAddOffer} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Candidatures Reçues ({applications.length})
            </h3>
            <ApplicationsReview 
              applications={applications}
              onUpdateStatus={handleUpdateApplication}
            />
          </div>
        )}

        {activeTab === 'evaluate' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Évaluer un Étudiant
            </h3>
            <EvaluationForm />
          </div>
        )}
      </div>
    </div>
  )
}

function OfferForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    duration: '',
    salary: '',
    requirements: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      requirements: formData.requirements.split(',').map(r => r.trim()),
      startDate: new Date().toISOString().split('T')[0]
    })
    setFormData({
      title: '',
      description: '',
      location: '',
      duration: '',
      salary: '',
      requirements: ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Titre du poste
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="input-soft"
          required
          placeholder="Ex: Développeur Python"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="input-soft resize-none"
          rows="4"
          required
          placeholder="Décrivez le poste et les responsabilités..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Lieu
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="input-soft"
            placeholder="Ex: Paris"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Durée
          </label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            className="input-soft"
            placeholder="Ex: 6 mois"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Salaire
        </label>
        <input
          type="text"
          value={formData.salary}
          onChange={(e) => setFormData({...formData, salary: e.target.value})}
          className="input-soft"
          placeholder="Ex: 800€/mois"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Compétences requises (séparées par des virgules)
        </label>
        <input
          type="text"
          value={formData.requirements}
          onChange={(e) => setFormData({...formData, requirements: e.target.value})}
          className="input-soft"
          placeholder="Ex: Python, JavaScript, React"
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Publier l'Offre
      </button>
    </form>
  )
}
