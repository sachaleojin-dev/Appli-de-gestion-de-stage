import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import conventionsData from '../data/conventions.json'

const STATUS_LABELS = {
  en_attente:           { label: 'En attente',    color: 'bg-amber-100 text-amber-700' },
  validee:              { label: 'Validée',        color: 'bg-green-100 text-green-700' },
  rejetee:              { label: 'Rejetée',        color: 'bg-red-100 text-red-700' },
  signee_etudiant:      { label: 'Signée étudiant', color: 'bg-blue-100 text-blue-700' },
  signee_entreprise:    { label: 'Signée entreprise', color: 'bg-purple-100 text-purple-700' },
  signee_tous:          { label: '✅ Complète',    color: 'bg-green-100 text-green-800' },
}

export default function AdminConventions() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [conventions, setConventions] = useState([])
  const [candidaturesAcceptees, setCandidaturesAcceptees] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedConvention, setSelectedConvention] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Formulaire création convention
  const [createForm, setCreateForm] = useState({
    id_candidature: '',
    date_debut: '',
    date_fin: '',
    lieu: '',
    superviseur: '',
    contact_superviseur: '',
    description_poste: '',
    objectifs: '',
  })

  useEffect(() => {
    if (isDemo) {
      setConventions(conventionsData.conventions)
      setLoading(false)
    } else {
      fetchConventions()
      fetchCandidaturesAcceptees()
    }
  }, [user, isDemo])

  // ── Supabase : charger les conventions ───────────────────────────────────
  const fetchConventions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('convention')
      .select(`
        *,
        candidature(
          id_candidature,
          offreStage(titre, entreprise(nom_societe, id_entreprise)),
          etudiant(utilisateur(nom, prenom, email))
        )
      `)
      .order('date_creation', { ascending: false })

    if (!error && data) {
      setConventions(data.map(c => ({
        id: c.id_convention,
        studentName: c.candidature?.etudiant?.utilisateur
          ? `${c.candidature.etudiant.utilisateur.prenom} ${c.candidature.etudiant.utilisateur.nom}`
          : 'Étudiant',
        studentEmail: c.candidature?.etudiant?.utilisateur?.email || '',
        company: c.candidature?.offreStage?.entreprise?.nom_societe || '',
        offerTitle: c.candidature?.offreStage?.titre || '',
        startDate: c.date_debut,
        endDate: c.date_fin,
        location: c.lieu,
        supervisor: c.superviseur,
        supervisorContact: c.contact_superviseur,
        jobDescription: c.description_poste,
        objectives: c.objectifs,
        status: c.statut,
        studentSigned: c.signature_etudiant,
        companySigned: c.signature_entreprise,
        schoolSigned: c.signature_etablissement,
        rejectionReason: c.raison_rejet,
        validatedAt: c.date_validation,
      })))
    }
    setLoading(false)
  }

  // ── Supabase : candidatures acceptées sans convention ────────────────────
  const fetchCandidaturesAcceptees = async () => {
    const { data } = await supabase
      .from('candidature')
      .select(`
        id_candidature,
        offreStage(titre, entreprise(nom_societe)),
        etudiant(utilisateur(nom, prenom))
      `)
      .eq('statut', 'acceptee')

    if (data) {
      setCandidaturesAcceptees(data.map(c => ({
        id: c.id_candidature,
        label: `${c.etudiant?.utilisateur?.prenom} ${c.etudiant?.utilisateur?.nom} — ${c.offreStage?.titre} @ ${c.offreStage?.entreprise?.nom_societe}`
      })))
    }
  }

  // ── Créer une convention ─────────────────────────────────────────────────
  const handleCreateConvention = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (isDemo) {
      const newConv = {
        id: `demo-${Date.now()}`,
        studentName: 'Étudiant Démo',
        company: 'Entreprise Démo',
        startDate: createForm.date_debut,
        endDate: createForm.date_fin,
        location: createForm.lieu,
        supervisor: createForm.superviseur,
        supervisorContact: createForm.contact_superviseur,
        jobDescription: createForm.description_poste,
        objectives: createForm.objectifs,
        status: 'en_attente',
        studentSigned: false,
        companySigned: false,
        schoolSigned: false,
      }
      setConventions(prev => [newConv, ...prev])
      setShowCreateForm(false)
      setSuccessMsg('Convention créée avec succès !')
      setTimeout(() => setSuccessMsg(''), 3000)
      setSaving(false)
      return
    }

    const { error } = await supabase.from('convention').insert({
      id_candidature: createForm.id_candidature,
      date_debut: createForm.date_debut,
      date_fin: createForm.date_fin,
      lieu: createForm.lieu,
      superviseur: createForm.superviseur,
      contact_superviseur: createForm.contact_superviseur,
      description_poste: createForm.description_poste,
      objectifs: createForm.objectifs,
      statut: 'en_attente',
      signature_etudiant: false,
      signature_entreprise: false,
      signature_etablissement: false,
    })

    if (!error) {
      await fetchConventions()
      setShowCreateForm(false)
      setSuccessMsg('Convention créée et envoyée aux parties !')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSaving(false)
  }

  // ── Valider ──────────────────────────────────────────────────────────────
  const handleValidate = async (convId) => {
    if (isDemo) {
      setConventions(prev => prev.map(c =>
        c.id === convId ? { ...c, status: 'validee', schoolSigned: true, validatedAt: new Date().toISOString().split('T')[0] } : c
      ))
      return
    }

    await supabase.from('convention').update({
      statut: 'validee',
      signature_etablissement: true,
      date_validation: new Date().toISOString().split('T')[0],
    }).eq('id_convention', convId)

    await fetchConventions()
  }

  // ── Rejeter ──────────────────────────────────────────────────────────────
  const handleReject = async (convId) => {
    if (!rejectionReason.trim()) return
    setSaving(true)

    if (isDemo) {
      setConventions(prev => prev.map(c =>
        c.id === convId ? { ...c, status: 'rejetee', rejectionReason } : c
      ))
    } else {
      await supabase.from('convention').update({
        statut: 'rejetee',
        raison_rejet: rejectionReason,
      }).eq('id_convention', convId)
      await fetchConventions()
    }

    setRejectionReason('')
    setSelectedConvention(null)
    setSaving(false)
  }

  const filteredConventions = filterStatus === 'all'
    ? conventions
    : conventions.filter(c => c.status === filterStatus)

  const getSignatureProgress = (conv) => {
    const signed = [conv.studentSigned, conv.companySigned, conv.schoolSigned].filter(Boolean).length
    return `${signed}/3 signatures`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Conventions</h2>
          <p className="text-muted-foreground mt-1">Créez, validez et suivez les conventions de stage</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
          + Créer une convention
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: conventions.length, color: 'text-primary' },
          { label: 'En attente', value: conventions.filter(c => c.status === 'en_attente').length, color: 'text-amber-600' },
          { label: 'Validées', value: conventions.filter(c => c.status === 'validee' || c.status === 'signee_tous').length, color: 'text-green-600' },
          { label: 'Rejetées', value: conventions.filter(c => c.status === 'rejetee').length, color: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="card-soft border border-border text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'en_attente', label: 'En attente' },
          { id: 'validee', label: 'Validées' },
          { id: 'rejetee', label: 'Rejetées' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              filterStatus === f.id ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-border'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Chargement…</p>
      ) : filteredConventions.length === 0 ? (
        <div className="card-soft text-center py-8">
          <p className="text-muted-foreground">Aucune convention trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConventions.map((convention) => {
            const statusInfo = STATUS_LABELS[convention.status] || STATUS_LABELS['en_attente']
            return (
              <div key={convention.id} className="card-soft border border-border hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{convention.studentName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {convention.company} {convention.offerTitle && `• ${convention.offerTitle}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Début</p>
                    <p className="font-medium">{convention.startDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fin</p>
                    <p className="font-medium">{convention.endDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lieu</p>
                    <p className="font-medium">{convention.location || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Signatures</p>
                    <p className="font-medium">{getSignatureProgress(convention)}</p>
                  </div>
                </div>

                {/* Indicateurs de signature */}
                <div className="flex gap-2 mb-3">
                  {[
                    { label: 'Étudiant', signed: convention.studentSigned },
                    { label: 'Entreprise', signed: convention.companySigned },
                    { label: 'Établissement', signed: convention.schoolSigned },
                  ].map(sig => (
                    <span key={sig.label}
                      className={`text-xs px-2 py-1 rounded-full ${sig.signed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sig.signed ? '✓' : '○'} {sig.label}
                    </span>
                  ))}
                </div>

                {convention.status === 'en_attente' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleValidate(convention.id)} className="flex-1 btn-primary text-sm">
                      ✅ Valider & Signer
                    </button>
                    <button onClick={() => setSelectedConvention(convention)} className="flex-1 btn-secondary text-sm">
                      ❌ Rejeter
                    </button>
                  </div>
                )}

                {convention.status === 'rejetee' && convention.rejectionReason && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-900 font-medium mb-1">Raison du rejet</p>
                    <p className="text-sm text-red-800">{convention.rejectionReason}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modale : Créer une convention ─────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Créer une convention de stage</h3>
                <button onClick={() => setShowCreateForm(false)}
                  className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>

              <form onSubmit={handleCreateConvention} className="space-y-4">
                {!isDemo && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Candidature acceptée <span className="text-red-500">*</span>
                    </label>
                    <select value={createForm.id_candidature}
                      onChange={(e) => setCreateForm({...createForm, id_candidature: e.target.value})}
                      className="input-soft" required>
                      <option value="">Sélectionner une candidature…</option>
                      {candidaturesAcceptees.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date de début *</label>
                    <input type="date" value={createForm.date_debut}
                      onChange={(e) => setCreateForm({...createForm, date_debut: e.target.value})}
                      className="input-soft" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date de fin *</label>
                    <input type="date" value={createForm.date_fin}
                      onChange={(e) => setCreateForm({...createForm, date_fin: e.target.value})}
                      className="input-soft" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Lieu du stage *</label>
                    <input type="text" value={createForm.lieu}
                      onChange={(e) => setCreateForm({...createForm, lieu: e.target.value})}
                      className="input-soft" placeholder="Ex: Paris" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Superviseur</label>
                    <input type="text" value={createForm.superviseur}
                      onChange={(e) => setCreateForm({...createForm, superviseur: e.target.value})}
                      className="input-soft" placeholder="Nom du tuteur" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contact superviseur</label>
                  <input type="text" value={createForm.contact_superviseur}
                    onChange={(e) => setCreateForm({...createForm, contact_superviseur: e.target.value})}
                    className="input-soft" placeholder="Email ou téléphone" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description du poste</label>
                  <textarea value={createForm.description_poste}
                    onChange={(e) => setCreateForm({...createForm, description_poste: e.target.value})}
                    className="input-soft resize-none" rows={3}
                    placeholder="Missions et responsabilités…" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Objectifs pédagogiques</label>
                  <textarea value={createForm.objectifs}
                    onChange={(e) => setCreateForm({...createForm, objectifs: e.target.value})}
                    className="input-soft resize-none" rows={3}
                    placeholder="Compétences visées…" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateForm(false)}
                    className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                    {saving ? 'Création…' : 'Créer & Envoyer aux parties'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale : Rejeter ─────────────────────────────────────────────── */}
      {selectedConvention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Rejeter la convention de {selectedConvention.studentName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Raison du rejet *</label>
                <textarea value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-soft resize-none" rows={4}
                  placeholder="Expliquez les raisons du rejet…" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedConvention(null)} className="flex-1 btn-secondary">
                  Annuler
                </button>
                <button onClick={() => handleReject(selectedConvention.id)}
                  disabled={!rejectionReason.trim() || saving}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50">
                  {saving ? '…' : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
