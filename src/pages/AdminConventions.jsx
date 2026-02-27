import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import conventionsData from '../data/conventions.json'

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
  const [createForm, setCreateForm] = useState({
    id_candidature: '', date_debut: '', date_fin: '', lieu: '',
    superviseur: '', contact_superviseur: '', description_poste: '', objectifs: '',
  })

  useEffect(() => {
    if (isDemo) {
      setConventions(conventionsData.conventions.map(c => ({
        id: c.id, studentName: c.studentName, companyName: c.companyName,
        offerTitle: c.offerTitle, startDate: c.startDate, endDate: c.endDate,
        status: c.status, studentSigned: c.studentSigned || false,
        companySigned: c.companySigned || false, schoolSigned: c.schoolSigned || false,
        validatedAt: c.validatedAt, mentor: c.mentor,
      })))
      setLoading(false)
    } else {
      fetchConventions()
      fetchCandidaturesAcceptees()
    }
  }, [user, isDemo])

  const fetchConventions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('convention')
      .select(`
        *,
        stage(
          id_stage, encadrant_entreprise,
          candidature(
            id_candidature,
            offreStage(titre, entreprise(nom_societe)),
            etudiant(utilisateur(nom, prenom, email))
          )
        )
      `)
      .order('date_generation', { ascending: false })

    if (!error && data) {
      setConventions(data.map(c => ({
        id: c.id_convention,
        id_stage: c.id_stage,
        studentName: c.stage?.candidature?.etudiant?.utilisateur
          ? `${c.stage.candidature.etudiant.utilisateur.prenom} ${c.stage.candidature.etudiant.utilisateur.nom}`
          : 'Étudiant',
        companyName: c.stage?.candidature?.offreStage?.entreprise?.nom_societe || '',
        offerTitle: c.stage?.candidature?.offreStage?.titre || '',
        startDate: c.date_debut,
        endDate: c.date_fin,
        location: c.lieu,
        supervisor: c.superviseur || c.stage?.encadrant_entreprise,
        status: c.statut,
        studentSigned: c.signature_etudiant,
        companySigned: c.signature_entreprise,
        schoolSigned: c.signature_ecole,
        validatedAt: c.date_validation,
        rejectionReason: c.raison_rejet,
      })))
    }
    setLoading(false)
  }

  const fetchCandidaturesAcceptees = async () => {
    // Candidatures acceptées sans stage existant
    const { data } = await supabase
      .from('candidature')
      .select(`
        id_candidature,
        offreStage(titre, entreprise(nom_societe)),
        etudiant(utilisateur(nom, prenom))
      `)
      .eq('statut', 'acceptee')

    if (data) {
      // Exclure celles qui ont déjà un stage
      const { data: stagesExistants } = await supabase
        .from('stage')
        .select('id_candidature')

      const idsAvecStage = new Set((stagesExistants || []).map(s => s.id_candidature))

      setCandidaturesAcceptees(
        data
          .filter(c => !idsAvecStage.has(c.id_candidature))
          .map(c => ({
            id: c.id_candidature,
            label: `${c.etudiant?.utilisateur?.prenom} ${c.etudiant?.utilisateur?.nom} — ${c.offreStage?.titre} @ ${c.offreStage?.entreprise?.nom_societe}`
          }))
      )
    }
  }

  // ── Créer convention (= créer stage + convention via SQL function) ─────────
  const handleCreateConvention = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (isDemo) {
      setConventions(prev => [{
        id: `demo-${Date.now()}`, studentName: 'Étudiant Démo', companyName: 'Entreprise Démo',
        offerTitle: 'Poste Démo', startDate: createForm.date_debut, endDate: createForm.date_fin,
        location: createForm.lieu, supervisor: createForm.superviseur,
        status: 'en_attente', studentSigned: false, companySigned: false, schoolSigned: false,
      }, ...prev])
      setShowCreateForm(false)
      setSaving(false)
      setSuccessMsg('Convention créée (démo) !')
      setTimeout(() => setSuccessMsg(''), 3000)
      return
    }

    // Utilise la fonction SQL convention_generer qui crée stage + convention
    const { data, error } = await supabase.rpc('convention_generer', {
      p_id_candidature: createForm.id_candidature,
      p_date_debut: createForm.date_debut,
      p_date_fin: createForm.date_fin,
      p_objectifs: createForm.objectifs,
      p_remuneration: null,
    })

    if (error || !data?.[0]?.succes) {
      setSuccessMsg(`Erreur : ${data?.[0]?.message || error?.message}`)
      setSaving(false)
      return
    }

    const idConvention = data[0].id_convention

    // Mettre à jour les champs supplémentaires
    await supabase.from('convention').update({
      lieu: createForm.lieu,
      superviseur: createForm.superviseur,
      contact_superviseur: createForm.contact_superviseur,
      description_poste: createForm.description_poste,
      statut: 'en_attente',
    }).eq('id_convention', idConvention)

    await fetchConventions()
    await fetchCandidaturesAcceptees()
    setShowCreateForm(false)
    setCreateForm({ id_candidature: '', date_debut: '', date_fin: '', lieu: '', superviseur: '', contact_superviseur: '', description_poste: '', objectifs: '' })
    setSuccessMsg('Convention créée et envoyée aux parties !')
    setTimeout(() => setSuccessMsg(''), 3000)
    setSaving(false)
  }

  // ── Valider (signer côté école) ───────────────────────────────────────────
  const handleValidate = async (convId) => {
    if (isDemo) {
      setConventions(prev => prev.map(c =>
        c.id === convId ? { ...c, status: 'validee', schoolSigned: true } : c
      ))
      return
    }
    await supabase.rpc('convention_signer', { p_id_convention: convId, p_type_signataire: 'ecole' })
    await fetchConventions()
  }

  // ── Rejeter ──────────────────────────────────────────────────────────────
  const handleReject = async (convId) => {
    if (!rejectionReason.trim()) return
    setSaving(true)
    if (isDemo) {
      setConventions(prev => prev.map(c => c.id === convId ? { ...c, status: 'annulee', rejectionReason } : c))
    } else {
      await supabase.from('convention').update({ statut: 'annulee', raison_rejet: rejectionReason }).eq('id_convention', convId)
      await fetchConventions()
    }
    setRejectionReason('')
    setSelectedConvention(null)
    setSaving(false)
  }

  const getStatusInfo = (status) => {
    const map = {
      en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
      en_cours:   { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
      validee:    { label: 'Validée ✅', color: 'bg-green-100 text-green-800' },
      annulee:    { label: 'Annulée', color: 'bg-red-100 text-red-700' },
      signee_etudiant:  { label: 'Signée (étudiant)', color: 'bg-blue-100 text-blue-700' },
      signee_entreprise:{ label: 'Signée (entreprise)', color: 'bg-purple-100 text-purple-700' },
    }
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  }

  const filtered = filterStatus === 'all' ? conventions : conventions.filter(c => c.status === filterStatus)

  return (
    <div className="space-y-6">
      <div className="card-soft flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Conventions</h2>
          <p className="text-muted-foreground mt-1">Créez, validez et suivez les conventions de stage</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
          + Créer une convention
        </button>
      </div>

      {successMsg && (
        <div className={`p-3 rounded-lg border text-sm ${successMsg.startsWith('Erreur') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: conventions.length, color: 'text-primary' },
          { label: 'En attente', value: conventions.filter(c => c.status === 'en_attente' || c.status === 'en_cours').length, color: 'text-amber-600' },
          { label: 'Validées', value: conventions.filter(c => c.status === 'validee').length, color: 'text-green-600' },
          { label: 'Annulées', value: conventions.filter(c => c.status === 'annulee').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card-soft border border-border text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Tous' }, { id: 'en_attente', label: 'En attente' },
          { id: 'en_cours', label: 'En cours' }, { id: 'validee', label: 'Validées' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${filterStatus === f.id ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-border'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="card-soft text-center py-8">
          <p className="text-muted-foreground">Aucune convention.</p>
          {!isDemo && candidaturesAcceptees.length > 0 && (
            <p className="text-xs text-primary mt-2">{candidaturesAcceptees.length} candidature(s) acceptée(s) en attente de convention</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(conv => {
            const si = getStatusInfo(conv.status)
            const sigCount = [conv.studentSigned, conv.companySigned, conv.schoolSigned].filter(Boolean).length
            return (
              <div key={conv.id} className="card-soft border border-border hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{conv.studentName}</h4>
                    <p className="text-sm text-muted-foreground">{conv.companyName} {conv.offerTitle && `• ${conv.offerTitle}`}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${si.color}`}>{si.label}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div><p className="text-muted-foreground">Début</p><p className="font-medium">{conv.startDate || '—'}</p></div>
                  <div><p className="text-muted-foreground">Fin</p><p className="font-medium">{conv.endDate || '—'}</p></div>
                  <div><p className="text-muted-foreground">Signatures</p><p className="font-medium">{sigCount}/3</p></div>
                </div>

                <div className="flex gap-2 mb-3 flex-wrap">
                  {[
                    { label: 'Étudiant', signed: conv.studentSigned },
                    { label: 'Entreprise', signed: conv.companySigned },
                    { label: 'Établissement', signed: conv.schoolSigned },
                  ].map(sig => (
                    <span key={sig.label} className={`text-xs px-2 py-1 rounded-full ${sig.signed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sig.signed ? '✓' : '○'} {sig.label}
                    </span>
                  ))}
                </div>

                {(conv.status === 'en_attente' || conv.status === 'en_cours') && (
                  <div className="flex gap-2">
                    <button onClick={() => handleValidate(conv.id)} className="flex-1 btn-primary text-sm">✅ Valider & Signer (école)</button>
                    <button onClick={() => setSelectedConvention(conv)} className="flex-1 btn-secondary text-sm">❌ Annuler</button>
                  </div>
                )}
                {conv.status === 'annulee' && conv.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">{conv.rejectionReason}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modale création */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Créer une convention de stage</h3>
                <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>
              <form onSubmit={handleCreateConvention} className="space-y-4">
                {!isDemo && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Candidature acceptée *</label>
                    {candidaturesAcceptees.length === 0 ? (
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        Aucune candidature acceptée sans convention. Acceptez d'abord une candidature depuis l'espace entreprise.
                      </p>
                    ) : (
                      <select value={createForm.id_candidature}
                        onChange={e => setCreateForm({...createForm, id_candidature: e.target.value})}
                        className="input-soft" required>
                        <option value="">Sélectionner une candidature…</option>
                        {candidaturesAcceptees.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date de début *</label>
                    <input type="date" value={createForm.date_debut} onChange={e => setCreateForm({...createForm, date_debut: e.target.value})} className="input-soft" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Date de fin *</label>
                    <input type="date" value={createForm.date_fin} onChange={e => setCreateForm({...createForm, date_fin: e.target.value})} className="input-soft" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Lieu *</label>
                    <input type="text" value={createForm.lieu} onChange={e => setCreateForm({...createForm, lieu: e.target.value})} className="input-soft" placeholder="Ex: Paris" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Superviseur</label>
                    <input type="text" value={createForm.superviseur} onChange={e => setCreateForm({...createForm, superviseur: e.target.value})} className="input-soft" placeholder="Nom du tuteur" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contact superviseur</label>
                  <input type="text" value={createForm.contact_superviseur} onChange={e => setCreateForm({...createForm, contact_superviseur: e.target.value})} className="input-soft" placeholder="Email ou téléphone" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Objectifs pédagogiques</label>
                  <textarea value={createForm.objectifs} onChange={e => setCreateForm({...createForm, objectifs: e.target.value})} className="input-soft resize-none" rows={3} placeholder="Compétences visées…" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description du poste</label>
                  <textarea value={createForm.description_poste} onChange={e => setCreateForm({...createForm, description_poste: e.target.value})} className="input-soft resize-none" rows={3} placeholder="Missions et responsabilités…" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary flex-1">Annuler</button>
                  <button type="submit" disabled={saving || (!isDemo && candidaturesAcceptees.length === 0)} className="btn-primary flex-1 disabled:opacity-50">
                    {saving ? 'Création…' : 'Créer & Envoyer aux parties'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale annulation */}
      {selectedConvention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Annuler la convention de {selectedConvention.studentName}</h3>
            <div className="space-y-4">
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                className="input-soft resize-none" rows={4} placeholder="Raison de l'annulation…" />
              <div className="flex gap-2">
                <button onClick={() => setSelectedConvention(null)} className="flex-1 btn-secondary">Annuler</button>
                <button onClick={() => handleReject(selectedConvention.id)} disabled={!rejectionReason.trim() || saving}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
