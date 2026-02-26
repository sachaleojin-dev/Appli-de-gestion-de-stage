import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import OfferCard from '../components/OfferCard'
import ApplicationsList from '../components/ApplicationsList'
import ReportUpload from '../components/ReportUpload'
import offresData from '../data/offres.json'
import candidaturesData from '../data/candidatures.json'

const tabs = [
  { id: 'offers',       label: 'Offres Disponibles' },
  { id: 'applications', label: 'Mes Candidatures' },
  { id: 'report',       label: 'Soumettre Rapport' }
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'offers'
  const setActiveTab = (tab) => setSearchParams({ tab })

  const isDemo = user?.isDemo === true

  const [offers, setOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [applications, setApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [etudiantId, setEtudiantId] = useState(null)
  const [nomEtudiant, setNomEtudiant] = useState('')

  // Modale candidature
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [lettreMotivation, setLettreMotivation] = useState('')
  const [cvUrl, setCvUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isDemo) {
      setNomEtudiant('Jean Dupont')

      // Mapping correct depuis offres.json (champ 'requirements' et non 'skills')
      setOffers(offresData.offres.map(o => ({
        id: o.id,
        title: o.title,
        company: o.company,
        description: o.description,
        location: o.location,
        duration: o.duration,
        salary: o.salary,
        startDate: o.startDate,
        skills: o.requirements || [],
      })))

      // Mapping correct depuis candidatures.json — title/company récupérés via offerId
      setApplications(candidaturesData.candidatures.map(c => {
        const offre = offresData.offres.find(o => o.id === c.offerId)
        return {
          id: c.id,
          offerId: c.offerId,
          title: offre?.title || '',
          company: offre?.company || '',
          location: offre?.location || '',
          status: c.status,
          appliedAt: c.appliedAt,
          commentaire: c.message || '',
        }
      }))

      setLoadingOffers(false)
      setLoadingApplications(false)
    } else if (user) {
      fetchEtudiantId()
      fetchOffers()
    }
  }, [user, isDemo])

  useEffect(() => {
    if (!isDemo && etudiantId) fetchApplications()
  }, [etudiantId])

  const fetchEtudiantId = async () => {
    const { data: utilisateur } = await supabase
      .from('utilisateur')
      .select('nom, prenom')
      .eq('id_utilisateur', user.id)
      .single()
    if (utilisateur) setNomEtudiant(`${utilisateur.prenom} ${utilisateur.nom}`)

    const { data: etudiant } = await supabase
      .from('etudiant')
      .select('id_etudiant')
      .eq('id_utilisateur', user.id)
      .single()
    if (etudiant) setEtudiantId(etudiant.id_etudiant)
  }

  const fetchOffers = async () => {
    setLoadingOffers(true)
    const { data, error } = await supabase
      .from('offreStage')
      .select(`*, entreprise(nom_societe, secteur_activite)`)
      .eq('statut', 'ouverte')
      .order('date_publication', { ascending: false })

    if (!error && data) {
      setOffers(data.map(o => ({
        id: o.id_offre,
        title: o.titre,
        company: o.entreprise?.nom_societe || 'Entreprise',
        description: o.description,
        location: o.lieu,
        duration: o.duree ? `${o.duree} mois` : null,
        salary: o.remuneration ? `${o.remuneration}€/mois` : null,
        startDate: o.date_debut,
        deadline: o.date_limite_candidature,
        skills: o.competences_requises ? o.competences_requises.split(',').map(s => s.trim()) : [],
        places: o.nombre_places,
      })))
    }
    setLoadingOffers(false)
  }

  const fetchApplications = async () => {
    setLoadingApplications(true)
    const { data, error } = await supabase
      .from('candidature')
      .select(`*, offreStage(titre, lieu, remuneration, entreprise(nom_societe))`)
      .eq('id_etudiant', etudiantId)
      .order('date_postulation', { ascending: false })

    if (!error && data) {
      setApplications(data.map(c => ({
        id: c.id_candidature,
        offerId: c.id_offre,
        title: c.offreStage?.titre,
        company: c.offreStage?.entreprise?.nom_societe,
        location: c.offreStage?.lieu,
        salary: c.offreStage?.remuneration,
        status: c.statut,
        appliedAt: c.date_postulation?.split('T')[0],
        commentaire: c.commentaire_entreprise,
      })))
    }
    setLoadingApplications(false)
  }

  const handleOpenApply = (offerId) => {
    if (isDemo) {
      const already = applications.some(a => a.offerId === offerId)
      if (already) return
      const offer = offers.find(o => o.id === offerId)
      setApplications(prev => [...prev, {
        id: `demo-${Date.now()}`,
        offerId,
        title: offer?.title || '',
        company: offer?.company || '',
        status: 'en_attente',
        appliedAt: new Date().toISOString().split('T')[0],
        commentaire: '',
      }])
      return
    }
    const offer = offers.find(o => o.id === offerId)
    setSelectedOffer(offer)
    setLettreMotivation('')
    setCvUrl('')
    setSubmitError('')
    setModalOpen(true)
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    if (!etudiantId) { setSubmitError("Profil étudiant introuvable."); return }
    if (!lettreMotivation.trim()) { setSubmitError("La lettre de motivation est obligatoire."); return }

    setSubmitting(true)
    const { error } = await supabase.from('candidature').insert({
      id_etudiant: etudiantId,
      id_offre: selectedOffer.id,
      lettre_motivation: lettreMotivation,
      cv_candidature: cvUrl || null,
      statut: 'en_attente',
    })

    if (error) {
      setSubmitError(error.message.includes('unique')
        ? "Vous avez déjà postulé à cette offre."
        : error.message)
      setSubmitting(false)
      return
    }

    setModalOpen(false)
    await fetchApplications()
    setSubmitting(false)
  }

  const appliedOfferIds = new Set(applications.map(a => a.offerId))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bienvenue, {nomEtudiant || user?.email}
        </h2>
        <p className="text-muted-foreground">
          Explorez les offres de stage et gérez vos candidatures
        </p>
        {isDemo && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">
            Mode démonstration — données fictives
          </p>
        )}
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
        {activeTab === 'offers' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Offres de Stage Disponibles ({offers.length})
            </h3>
            {loadingOffers ? (
              <p className="text-muted-foreground text-center py-8">Chargement des offres…</p>
            ) : offers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune offre disponible.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onApply={handleOpenApply}
                    isApplied={appliedOfferIds.has(offer.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Mes Candidatures ({applications.length})
            </h3>
            {loadingApplications ? (
              <p className="text-muted-foreground text-center py-8">Chargement…</p>
            ) : (
              <ApplicationsList applications={applications} />
            )}
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

      {/* Modale candidature (vrais comptes uniquement) */}
      {modalOpen && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Postuler à l'offre</h3>
                  <p className="text-sm text-primary font-medium mt-1">{selectedOffer.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedOffer.company}</p>
                </div>
                <button onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Lettre de motivation <span className="text-red-500">*</span>
                  </label>
                  <textarea value={lettreMotivation}
                    onChange={(e) => setLettreMotivation(e.target.value)}
                    rows={6} placeholder="Décrivez votre motivation…"
                    className="input-soft resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Lien CV <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </label>
                  <input type="url" value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://drive.google.com/votre-cv"
                    className="input-soft" />
                </div>
                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{submitError}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" disabled={submitting}
                    className="btn-primary flex-1 disabled:opacity-50">
                    {submitting ? 'Envoi…' : 'Envoyer ma candidature'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
