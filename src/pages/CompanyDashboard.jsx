import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import offresData from '../data/offres.json'
import candidaturesData from '../data/candidatures.json'
import OfferManagement from '../components/OfferManagement'
import ApplicationsReview from '../components/ApplicationsReview'
import EvaluationForm from '../components/EvaluationForm'

const tabs = [
  { id: 'offers',       label: 'Mes Offres' },
  { id: 'add-offer',    label: 'Créer une Offre' },
  { id: 'applications', label: 'Candidatures Reçues' },
  { id: 'evaluate',     label: 'Évaluer Étudiant' }
]

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'offers'
  const setActiveTab = (tab) => setSearchParams({ tab })

  const isDemo = user?.isDemo === true

  const [offers, setOffers] = useState([])
  const [applications, setApplications] = useState([])
  const [entrepriseId, setEntrepriseId] = useState(null)
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      // ── Données mockées pour le compte démo ───────────────────────────────
      setNomEntreprise('TechCorp')
      setOffers(offresData.offres.filter(o => o.companyId === 'entreprise1'))
      setApplications(candidaturesData.candidatures)
      setLoading(false)
    } else if (user) {
      fetchEntrepriseData()
    }
  }, [user, isDemo])

  const fetchEntrepriseData = async () => {
    setLoading(true)

    // Récupère le nom de l'entreprise
    const { data: utilisateur } = await supabase
      .from('utilisateur')
      .select('nom, prenom')
      .eq('id_utilisateur', user.id)
      .single()

    const { data: entreprise } = await supabase
      .from('entreprise')
      .select('id_entreprise, nom_societe')
      .eq('id_utilisateur', user.id)
      .single()

    if (entreprise) {
      setEntrepriseId(entreprise.id_entreprise)
      setNomEntreprise(entreprise.nom_societe)
      await fetchOffres(entreprise.id_entreprise)
      await fetchCandidatures(entreprise.id_entreprise)
    }
    setLoading(false)
  }

  const fetchOffres = async (idEntreprise) => {
    const { data, error } = await supabase
      .from('offreStage')
      .select('*')
      .eq('id_entreprise', idEntreprise)
      .order('date_publication', { ascending: false })

    if (!error && data) {
      setOffers(data.map(o => ({
        id: o.id_offre,
        title: o.titre,
        description: o.description,
        location: o.lieu,
        duration: o.duree ? `${o.duree} mois` : '',
        salary: o.remuneration ? `${o.remuneration}€/mois` : '',
        status: o.statut,
        startDate: o.date_debut,
        requirements: o.competences_requises?.split(',').map(s => s.trim()) || [],
        places: o.nombre_places,
        createdAt: o.date_publication?.split('T')[0],
      })))
    }
  }

  const fetchCandidatures = async (idEntreprise) => {
    const { data, error } = await supabase
      .from('candidature')
      .select(`
        *,
        offreStage(titre, id_entreprise),
        etudiant(id_utilisateur, utilisateur(nom, prenom, email))
      `)
      .order('date_postulation', { ascending: false })

    if (!error && data) {
      // Filtre les candidatures appartenant aux offres de cette entreprise
      const filtered = data.filter(c => c.offreStage?.id_entreprise === idEntreprise)
      setApplications(filtered.map(c => ({
        id: c.id_candidature,
        offerId: c.id_offre,
        offerTitle: c.offreStage?.titre,
        studentName: c.etudiant?.utilisateur
          ? `${c.etudiant.utilisateur.prenom} ${c.etudiant.utilisateur.nom}`
          : 'Étudiant',
        studentEmail: c.etudiant?.utilisateur?.email || '',
        status: c.statut,
        appliedAt: c.date_postulation?.split('T')[0],
        lettreMotivation: c.lettre_motivation,
        cvUrl: c.cv_candidature,
      })))
    }
  }

  // ── Créer une offre (vrai compte) ─────────────────────────────────────────
  const handleAddOffer = async (formData) => {
    if (isDemo) {
      // Démo : ajout local uniquement
      setOffers(prev => [...prev, {
        id: `demo-${Date.now()}`,
        ...formData,
        company: 'TechCorp',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      }])
      setActiveTab('offers')
      return
    }

    if (!entrepriseId) return

    const { error } = await supabase.from('offreStage').insert({
      id_entreprise: entrepriseId,
      titre: formData.title,
      description: formData.description,
      lieu: formData.location,
      duree: parseInt(formData.duration) || null,
      remuneration: parseFloat(formData.salary) || null,
      competences_requises: formData.requirements,
      date_debut: formData.startDate || null,
      date_limite_candidature: formData.deadline || null,
      nombre_places: parseInt(formData.places) || 1,
      statut: 'ouverte',
    })

    if (!error) {
      await fetchOffres(entrepriseId)
      setActiveTab('offers')
    }
  }

  // ── Mettre à jour statut candidature ──────────────────────────────────────
  const handleUpdateApplication = async (appId, status) => {
    if (isDemo) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      return
    }

    await supabase
      .from('candidature')
      .update({ statut: status })
      .eq('id_candidature', appId)

    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Tableau de Bord {nomEntreprise || 'Entreprise'}
        </h2>
        <p className="text-muted-foreground">
          Gérez vos offres de stage et candidatures
        </p>
        {isDemo && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">
            Mode démonstration — données fictives
          </p>
        )}
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

      {/* Contenu */}
      <div className="mt-6">
        {activeTab === 'offers' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Offres Publiées ({offers.length})
            </h3>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Chargement…</p>
            ) : (
              <OfferManagement offers={offers} />
            )}
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
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Chargement…</p>
            ) : (
              <ApplicationsReview
                applications={applications}
                onUpdateStatus={handleUpdateApplication}
              />
            )}
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

// ── Formulaire création d'offre ───────────────────────────────────────────────
function OfferForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', duration: '',
    salary: '', requirements: '', startDate: '', deadline: '', places: '1'
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      startDate: formData.startDate || new Date().toISOString().split('T')[0]
    })
    setFormData({
      title: '', description: '', location: '', duration: '',
      salary: '', requirements: '', startDate: '', deadline: '', places: '1'
    })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft max-w-2xl space-y-4">
      {submitted && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ Offre publiée avec succès !</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Titre du poste *</label>
        <input type="text" value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="input-soft" required placeholder="Ex: Développeur Python" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
        <textarea value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="input-soft resize-none" rows="4" required
          placeholder="Décrivez le poste et les responsabilités…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Lieu</label>
          <input type="text" value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="input-soft" placeholder="Ex: Paris" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Durée (en mois)</label>
          <input type="number" value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            className="input-soft" placeholder="Ex: 6" min="1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Rémunération (€/mois)</label>
          <input type="number" value={formData.salary}
            onChange={(e) => setFormData({...formData, salary: e.target.value})}
            className="input-soft" placeholder="Ex: 800" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nombre de places</label>
          <input type="number" value={formData.places}
            onChange={(e) => setFormData({...formData, places: e.target.value})}
            className="input-soft" min="1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Date de début</label>
          <input type="date" value={formData.startDate}
            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            className="input-soft" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Date limite candidature</label>
          <input type="date" value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            className="input-soft" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Compétences requises <span className="text-xs text-muted-foreground">(séparées par des virgules)</span>
        </label>
        <input type="text" value={formData.requirements}
          onChange={(e) => setFormData({...formData, requirements: e.target.value})}
          className="input-soft" placeholder="Ex: Python, JavaScript, React" />
      </div>

      <button type="submit" className="btn-primary w-full">
        Publier l'Offre
      </button>
    </form>
  )
}
