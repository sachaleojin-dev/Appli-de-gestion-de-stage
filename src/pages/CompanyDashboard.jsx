import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import offresData from '../data/offres.json'
import candidaturesData from '../data/candidatures.json'
import conventionsData from '../data/conventions.json'
import OfferManagement from '../components/OfferManagement'
import ApplicationsReview from '../components/ApplicationsReview'
import EvaluationForm from '../components/EvaluationForm'

const tabs = [
  { id: 'offers',       label: 'Mes Offres' },
  { id: 'add-offer',    label: 'Créer une Offre' },
  { id: 'applications', label: 'Candidatures Reçues' },
  { id: 'conventions',  label: 'Conventions' },
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
  const [conventions, setConventions] = useState([])
  const [entrepriseId, setEntrepriseId] = useState(null)
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedForEval, setSelectedForEval] = useState(null)
  const [signing, setSigning] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleEditOffer = (offer) => {
    if (isDemo) {
      const newTitle = prompt("Titre de l'offre", offer.title)
      if (newTitle !== null) {
        setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, title: newTitle } : o))
      }
    } else {
      alert('Modification des offres non encore implémentée')
    }
  }

  const handleArchiveOffer = (offer) => {
    if (isDemo) {
      if (confirm('Archiver cette offre ?')) {
        setOffers(prev => prev.filter(o => o.id !== offer.id))
      }
    } else {
      alert('Archiver une offre non implémenté')
    }
  }

  const handleEvaluate = (app) => {
    setSelectedForEval(app)
    setActiveTab('evaluate')
  }

  useEffect(() => {
    if (isDemo) {
      setNomEntreprise('TechCorp')
      setOffers(offresData.offres.filter(o => o.companyId === 'entreprise1'))

      setApplications(candidaturesData.candidatures.map(c => {
        const offre = offresData.offres.find(o => o.id === c.offerId)
        return {
          id: c.id,
          offerId: c.offerId,
          offerTitle: offre?.title || '',
          studentName: c.studentName || 'Étudiant',
          studentEmail: c.studentEmail || '',
          status: c.status,
          appliedAt: c.appliedAt,
          lettreMotivation: c.message || '',
          cvUrl: c.cvUrl || null,
        }
      }))

      // Conventions démo filtrées pour TechCorp
      setConventions(conventionsData.conventions.filter(c => c.company === 'TechCorp').map(c => ({
        id: c.id,
        studentName: c.studentName,
        offerTitle: c.position || '',
        startDate: c.startDate,
        endDate: c.endDate,
        location: c.location,
        supervisor: c.supervisor,
        jobDescription: c.jobDescription,
        status: c.status,
        studentSigned: c.studentSigned,
        companySigned: c.companySigned,
        schoolSigned: c.schoolSigned,
      })))

      setLoading(false)
    } else if (user) {
      fetchEntrepriseData()
    }
  }, [user, isDemo])

  const fetchEntrepriseData = async () => {
    setLoading(true)
    const { data: entreprise } = await supabase
      .from('entreprise')
      .select('id_entreprise, nom_societe')
      .eq('id_utilisateur', user.id)
      .single()

    if (entreprise) {
      setEntrepriseId(entreprise.id_entreprise)
      setNomEntreprise(entreprise.nom_societe)
      await Promise.all([
        fetchOffres(entreprise.id_entreprise),
        fetchCandidatures(entreprise.id_entreprise),
        fetchConventions(entreprise.id_entreprise),
      ])
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
      .select(`*, offreStage(titre, id_entreprise), etudiant(id_utilisateur, utilisateur(nom, prenom, email))`)
      .order('date_postulation', { ascending: false })

    if (!error && data) {
      const filtered = data.filter(c => c.offreStage?.id_entreprise === idEntreprise)
      setApplications(filtered.map(c => ({
        id: c.id_candidature,
        offerId: c.id_offre,
        offerTitle: c.offreStage?.titre || '',
        studentName: c.etudiant?.utilisateur ? `${c.etudiant.utilisateur.prenom} ${c.etudiant.utilisateur.nom}` : 'Étudiant',
        studentEmail: c.etudiant?.utilisateur?.email || '',
        status: c.statut,
        appliedAt: c.date_postulation?.split('T')[0],
        lettreMotivation: c.lettre_motivation,
        cvUrl: c.cv_candidature,
      })))
    }
  }

  const fetchConventions = async (idEntreprise) => {
    const { data, error } = await supabase
      .from('convention')
      .select(`*, candidature(offreStage(titre, id_entreprise), etudiant(utilisateur(nom, prenom)))`)
      .order('date_creation', { ascending: false })

    if (!error && data) {
      const filtered = data.filter(c => c.candidature?.offreStage?.id_entreprise === idEntreprise)
      setConventions(filtered.map(c => ({
        id: c.id_convention,
        studentName: c.candidature?.etudiant?.utilisateur
          ? `${c.candidature.etudiant.utilisateur.prenom} ${c.candidature.etudiant.utilisateur.nom}` : 'Étudiant',
        offerTitle: c.candidature?.offreStage?.titre || '',
        startDate: c.date_debut,
        endDate: c.date_fin,
        location: c.lieu,
        supervisor: c.superviseur,
        jobDescription: c.description_poste,
        status: c.statut,
        studentSigned: c.signature_etudiant,
        companySigned: c.signature_entreprise,
        schoolSigned: c.signature_etablissement,
      })))
    }
  }

  // ── Signer une convention ─────────────────────────────────────────────────
  const handleSign = async (convId) => {
    setSigning(true)
    if (isDemo) {
      setConventions(prev => prev.map(c => c.id === convId ? { ...c, companySigned: true } : c))
      setSuccessMsg('Convention signée avec succès !')
      setTimeout(() => setSuccessMsg(''), 3000)
      setSigning(false)
      return
    }

    await supabase.from('convention').update({ signature_entreprise: true }).eq('id_convention', convId)
    await fetchConventions(entrepriseId)
    setSuccessMsg('Convention signée avec succès !')
    setTimeout(() => setSuccessMsg(''), 3000)
    setSigning(false)
  }

  const handleAddOffer = async (formData) => {
    if (isDemo) {
      setOffers(prev => [...prev, { id: `demo-${Date.now()}`, ...formData, company: 'TechCorp', status: 'active', createdAt: new Date().toISOString().split('T')[0] }])
      setActiveTab('offers')
      return
    }
    if (!entrepriseId) return
    const { error } = await supabase.from('offreStage').insert({
      id_entreprise: entrepriseId,
      titre: formData.title, description: formData.description, lieu: formData.location,
      duree: parseInt(formData.duration) || null, remuneration: parseFloat(formData.salary) || null,
      competences_requises: formData.requirements, date_debut: formData.startDate || null,
      date_limite_candidature: formData.deadline || null, nombre_places: parseInt(formData.places) || 1,
      statut: 'ouverte',
    })
    if (!error) { await fetchOffres(entrepriseId); setActiveTab('offers') }
  }

  const handleUpdateApplication = async (appId, status) => {
    if (isDemo) { setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a)); return }
    await supabase.from('candidature').update({ statut: status }).eq('id_candidature', appId)
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tableau de Bord {nomEntreprise || 'Entreprise'}</h2>
        <p className="text-muted-foreground">Gérez vos offres de stage et candidatures</p>
        {isDemo && <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">Mode démonstration — données fictives</p>}
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
            {tab.id === 'conventions' && conventions.filter(c => !c.companySigned).length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
                {conventions.filter(c => !c.companySigned).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'offers' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Offres Publiées ({offers.length})</h3>
            {loading ? <p className="text-muted-foreground text-center py-8">Chargement…</p> : (
              <OfferManagement offers={offers} onEdit={handleEditOffer} onArchive={handleArchiveOffer} />
            )}
          </div>
        )}

        {activeTab === 'add-offer' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Créer une Nouvelle Offre</h3>
            <OfferForm onSubmit={handleAddOffer} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Candidatures Reçues ({applications.length})</h3>
            {loading ? <p className="text-muted-foreground text-center py-8">Chargement…</p> :
              applications.length === 0 ? <p className="text-muted-foreground text-center py-8">Aucune candidature reçue.</p> : (
                <ApplicationsReview applications={applications} onUpdateStatus={handleUpdateApplication} onEvaluate={handleEvaluate} />
              )}
          </div>
        )}

        {activeTab === 'conventions' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Conventions à signer ({conventions.length})</h3>
            {loading ? <p className="text-muted-foreground text-center py-8">Chargement…</p> :
              conventions.length === 0 ? (
                <div className="card-soft text-center py-8">
                  <p className="text-muted-foreground">Aucune convention pour le moment.</p>
                  <p className="text-xs text-muted-foreground mt-1">Les conventions sont créées par l'administration après acceptation des candidatures.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conventions.map(conv => (
                    <div key={conv.id} className="card-soft border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{conv.studentName}</h4>
                          {conv.offerTitle && <p className="text-sm text-primary">{conv.offerTitle}</p>}
                          <p className="text-xs text-muted-foreground">{conv.startDate} → {conv.endDate} • {conv.location}</p>
                        </div>
                        {conv.companySigned ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">✅ Signée</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">⏳ À signer</span>
                        )}
                      </div>

                      {conv.jobDescription && (
                        <p className="text-sm text-muted-foreground bg-muted rounded p-2 mb-3">{conv.jobDescription}</p>
                      )}

                      <div className="flex gap-2 mb-3">
                        {[
                          { label: 'Étudiant', signed: conv.studentSigned },
                          { label: 'Entreprise (vous)', signed: conv.companySigned },
                          { label: 'Établissement', signed: conv.schoolSigned },
                        ].map(sig => (
                          <span key={sig.label}
                            className={`text-xs px-2 py-1 rounded-full ${sig.signed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {sig.signed ? '✓' : '○'} {sig.label}
                          </span>
                        ))}
                      </div>

                      {!conv.companySigned && (
                        <button onClick={() => handleSign(conv.id)} disabled={signing}
                          className="btn-primary w-full text-sm disabled:opacity-50">
                          {signing ? 'Signature…' : '✍️ Signer cette convention'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {activeTab === 'evaluate' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Évaluer {selectedForEval?.studentName || 'un Étudiant'}</h3>
            <EvaluationForm studentName={selectedForEval?.studentName || ''}
              onSubmit={() => { setSelectedForEval(null); setActiveTab('applications') }} />
          </div>
        )}
      </div>
    </div>
  )
}

function OfferForm({ onSubmit }) {
  const [formData, setFormData] = useState({ title: '', description: '', location: '', duration: '', salary: '', requirements: '', startDate: '', deadline: '', places: '1' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, startDate: formData.startDate || new Date().toISOString().split('T')[0] })
    setFormData({ title: '', description: '', location: '', duration: '', salary: '', requirements: '', startDate: '', deadline: '', places: '1' })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft max-w-2xl space-y-4">
      {submitted && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-sm text-green-700">✅ Offre publiée avec succès !</p></div>}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Titre du poste *</label>
        <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input-soft" required placeholder="Ex: Développeur Python" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-soft resize-none" rows="4" required placeholder="Décrivez le poste et les responsabilités…" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-foreground mb-2">Lieu</label><input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="input-soft" placeholder="Ex: Paris" /></div>
        <div><label className="block text-sm font-medium text-foreground mb-2">Durée (mois)</label><input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="input-soft" placeholder="Ex: 6" min="1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-foreground mb-2">Rémunération (€/mois)</label><input type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="input-soft" placeholder="Ex: 800" min="0" /></div>
        <div><label className="block text-sm font-medium text-foreground mb-2">Nombre de places</label><input type="number" value={formData.places} onChange={(e) => setFormData({...formData, places: e.target.value})} className="input-soft" min="1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-foreground mb-2">Date de début</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="input-soft" /></div>
        <div><label className="block text-sm font-medium text-foreground mb-2">Date limite candidature</label><input type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="input-soft" /></div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Compétences requises <span className="text-xs text-muted-foreground">(séparées par des virgules)</span></label>
        <input type="text" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} className="input-soft" placeholder="Ex: Python, JavaScript, React" />
      </div>
      <button type="submit" className="btn-primary w-full">Publier l'Offre</button>
    </form>
  )
}
