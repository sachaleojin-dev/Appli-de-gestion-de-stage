import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import conventionsData from '../data/conventions.json'

export default function StudentConvention() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true

  const [convention, setConvention] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (isDemo) {
      const conv = conventionsData.conventions.find(c => c.studentId === 'etudiant1')
      setConvention(conv || null)
      setLoading(false)
    } else if (user) {
      fetchConvention()
    }
  }, [user, isDemo])

  const fetchConvention = async () => {
    setLoading(true)

    // Récupère l'id_etudiant
    const { data: etudiant } = await supabase
      .from('etudiant')
      .select('id_etudiant')
      .eq('id_utilisateur', user.id)
      .single()

    if (!etudiant) { setLoading(false); return }

    // Cherche la convention liée à une candidature de cet étudiant
    const { data, error } = await supabase
      .from('convention')
      .select(`
        *,
        candidature(
          offreStage(titre, lieu, entreprise(nom_societe))
        )
      `)
      .eq('candidature.id_etudiant', etudiant.id_etudiant)
      .order('date_creation', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      setConvention({
        id: data.id_convention,
        company: data.candidature?.offreStage?.entreprise?.nom_societe || '',
        offerTitle: data.candidature?.offreStage?.titre || '',
        startDate: data.date_debut,
        endDate: data.date_fin,
        location: data.lieu,
        supervisor: data.superviseur,
        supervisorContact: data.contact_superviseur,
        jobDescription: data.description_poste,
        objectives: data.objectifs,
        status: data.statut,
        studentSigned: data.signature_etudiant,
        companySigned: data.signature_entreprise,
        schoolSigned: data.signature_etablissement,
      })
    }
    setLoading(false)
  }

  // ── Signer la convention ─────────────────────────────────────────────────
  const handleSign = async () => {
    setSigning(true)

    if (isDemo) {
      setConvention(prev => ({ ...prev, studentSigned: true }))
      setSuccessMsg('Vous avez signé la convention !')
      setTimeout(() => setSuccessMsg(''), 3000)
      setSigning(false)
      return
    }

    const { error } = await supabase
      .from('convention')
      .update({ signature_etudiant: true })
      .eq('id_convention', convention.id)

    if (!error) {
      await fetchConvention()
      setSuccessMsg('Vous avez signé la convention !')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSigning(false)
  }

  const getStatusInfo = (status, studentSigned) => {
    if (status === 'rejetee') return { label: 'Rejetée', color: 'bg-red-100 text-red-700' }
    if (status === 'signee_tous') return { label: '✅ Complète', color: 'bg-green-100 text-green-800' }
    if (studentSigned) return { label: 'Signée par vous', color: 'bg-blue-100 text-blue-700' }
    if (status === 'validee') return { label: 'En attente de signature', color: 'bg-amber-100 text-amber-700' }
    return { label: 'En attente de validation', color: 'bg-gray-100 text-gray-600' }
  }

  if (loading) {
    return <div className="card-soft text-center py-12"><p className="text-muted-foreground">Chargement…</p></div>
  }

  if (!convention) {
    return (
      <div className="card-soft text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <p className="text-foreground font-semibold mb-2">Pas encore de convention</p>
        <p className="text-muted-foreground text-sm">
          Votre convention sera créée par l'administration une fois votre candidature acceptée.
        </p>
      </div>
    )
  }

  const statusInfo = getStatusInfo(convention.status, convention.studentSigned)
  const canSign = (convention.status === 'validee' || convention.status === 'en_attente') && !convention.studentSigned

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Ma Convention de Stage</h2>
        <p className="text-muted-foreground mt-1">Consultez et signez votre convention de stage</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      {/* Statut + action */}
      <div className="card-soft border border-border flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Statut de la convention</p>
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        {canSign && (
          <button onClick={handleSign} disabled={signing}
            className="btn-primary disabled:opacity-50">
            {signing ? 'Signature en cours…' : '✍️ Signer la convention'}
          </button>
        )}
        {convention.studentSigned && !canSign && (
          <span className="text-sm text-green-600 font-medium">✅ Vous avez signé</span>
        )}
      </div>

      {/* Infos rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-soft border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Entreprise</p>
          <p className="font-bold text-foreground">{convention.company || '—'}</p>
          {convention.offerTitle && <p className="text-xs text-primary mt-1">{convention.offerTitle}</p>}
        </div>
        <div className="card-soft border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Période</p>
          <p className="font-medium text-foreground text-sm">{convention.startDate} → {convention.endDate}</p>
        </div>
        <div className="card-soft border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Lieu</p>
          <p className="font-bold text-foreground">{convention.location || '—'}</p>
        </div>
      </div>

      {/* Détails */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Informations Détaillées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Superviseur</label>
            <p className="text-foreground">{convention.supervisor || '—'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Contact superviseur</label>
            <p className="text-foreground">{convention.supervisorContact || '—'}</p>
          </div>
        </div>

        {convention.jobDescription && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Description du poste</label>
            <p className="text-foreground bg-muted rounded-lg p-3 text-sm">{convention.jobDescription}</p>
          </div>
        )}

        {convention.objectives && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Objectifs pédagogiques</label>
            <p className="text-foreground bg-muted rounded-lg p-3 text-sm">{convention.objectives}</p>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">État des Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Étudiant', signed: convention.studentSigned, isYou: true },
            { label: 'Entreprise', signed: convention.companySigned, isYou: false },
            { label: 'Établissement', signed: convention.schoolSigned, isYou: false },
          ].map(sig => (
            <div key={sig.label}
              className={`border-2 rounded-lg p-4 text-center transition ${
                sig.signed ? 'border-green-300 bg-green-50' : 'border-dashed border-border'
              }`}>
              <p className="text-sm font-medium text-foreground mb-3">
                {sig.label} {sig.isYou && <span className="text-xs text-muted-foreground">(vous)</span>}
              </p>
              <div className={`h-16 rounded flex items-center justify-center text-2xl ${
                sig.signed ? '' : 'text-muted-foreground'
              }`}>
                {sig.signed ? '✅' : '⏳'}
              </div>
              <p className={`text-xs mt-2 ${sig.signed ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                {sig.signed ? 'Signé' : 'En attente'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Rejet */}
      {convention.status === 'rejetee' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800 mb-1">Convention rejetée par l'administration</p>
          {convention.rejectionReason && (
            <p className="text-sm text-red-700">{convention.rejectionReason}</p>
          )}
        </div>
      )}
    </div>
  )
}
