import { useState, useEffect } from 'react'
import offresData from '../data/offres.json'
import candidaturesData from '../data/candidatures.json'
import OfferCard from '../components/OfferCard'
import ApplicationsList from '../components/ApplicationsList'
import ReportUpload from '../components/ReportUpload'

const tabs = [
  { id: 'offers', label: 'Offres Disponibles' },
  { id: 'applications', label: 'Mes Candidatures' },
  { id: 'report', label: 'Soumettre Rapport' }
]

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('offers')
  const [offers, setOffers] = useState(offresData.offres)
  const [applications, setApplications] = useState(candidaturesData.candidatures)

  const handleApply = (offerId) => {
    const newApplication = {
      id: `cand${Date.now()}`,
      offerId,
      studentId: 'etudiant1',
      studentName: 'Marie Dupont',
      status: 'en_attente',
      appliedAt: new Date().toISOString().split('T')[0],
      message: 'Candidature soumise'
    }
    setApplications([...applications, newApplication])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bienvenue, Marie Dupont
        </h2>
        <p className="text-muted-foreground">
          Explorez les offres de stage et gérez vos candidatures
        </p>
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

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'offers' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Offres de Stage Disponibles ({offers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onApply={handleApply}
                  isApplied={applications.some(app => app.offerId === offer.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Mes Candidatures ({applications.length})
            </h3>
            <ApplicationsList applications={applications} />
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Soumettre Rapport de Stage
            </h3>
            <ReportUpload />
          </div>
        )}
      </div>
    </div>
  )
}
