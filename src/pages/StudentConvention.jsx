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
      if (conv) {
        setConvention({
          id: conv.id, company: conv.companyName, offerTitle: conv.offerTitle,
          startDate: conv.startDate, endDate: conv.endDate, location: conv.location || '',
          supervisor: conv.mentor, supervisorContact: '',
          jobDescription: '', objectives: '',
          status: conv.status, studentSigned: conv.studentSigned || false,
          companySigned: conv.companySigned || false, schoolSigned: conv.schoolSigned || false,
        })
      }
      setLoading(false)
    } else if (user) {
      fetchConvention()
    }
  }, [user, isDemo])

  const fetchConvention = async () => {
    setLoading(true)

    const { data: etudiant } = await supabase
      .from('etudiant')
      .select('id_etudiant')
      .eq('id_utilisateur', user.id)
      .single()

    if (!etudiant) { setLoading(false); return }

    // convention → stage → candidature → etudiant
    const { data, error } = await supabase
      .from('convention')
      .select(`
        *,
        stage(
          id_stage, date_debut, date_fin, encadrant_entreprise,
          candidature(
            id_etudiant,
            offreStage(titre, lieu, entreprise(nom_societe))
          )
        )
      `)
      .order('date_generation', { ascending: false })

    if (!error && data) {
      // Filtre côté client pour l'étudiant connecté
      const conv = data.find(c => c.stage?.candidature?.id_etudiant === etudiant.id_etudiant)
      if (conv) {
        setConvention({
          id: conv.id_convention,
          id_stage: conv.id_stage,
          company: conv.stage?.candidature?.offreStage?.entreprise?.nom_societe || '',
          offerTitle: conv.stage?.candidature?.offreStage?.titre || '',
          startDate: conv.date_debut,
          endDate: conv.date_fin,
          location: conv.lieu || conv.stage?.candidature?.offreStage?.lieu || '',
          supervisor: conv.superviseur || conv.stage?.encadrant_entreprise || '',
          supervisorContact: conv.contact_superviseur || '',
          jobDescription: conv.description_poste || '',
          objectives: conv.objectifs || '',
          status: conv.statut,
          studentSigned: conv.signature_etudiant,
          companySigned: conv.signature_entreprise,
          schoolSigned: conv.signature_ecole,
          rejectionReason: conv.raison_rejet,
        })
      }
    }
    setLoading(false)
  }

  const handleSign = async () => {
    setSigning(true)
    if (isDemo) {
      setConvention(prev => ({ ...prev, studentSigned: true }))
      setSuccessMsg('Vous avez signé la convention !')
      setTimeout(() => setSuccessMsg(''), 3000)
      setSigning(false)
      return
    }

    const { error } = await supabase.rpc('convention_signer', {
      p_id_convention: convention.id,
      p_type_signataire: 'etudiant',
    })

    if (!error) {
      await fetchConvention()
      setSuccessMsg('Vous avez signé la convention !')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    setSigning(false)
  }

  const getStatusInfo = (status, studentSigned) => {
    if (status === 'annulee') return { label: 'Annulée', color: 'bg-red-100 text-red-700' }
    if (status === 'validee') return { label: '✅ Validée par l\'établissement', color: 'bg-green-100 text-green-800' }
    if (studentSigned) return { label: 'Signée par vous ✓', color: 'bg-blue-100 text-blue-700' }
    if (status === 'en_attente' || status === 'en_cours') return { label: 'En attente de signature', color: 'bg-amber-100 text-amber-700' }
    return { label: status, color: 'bg-gray-100 text-gray-600' }
  }

  if (loading) return <div className="card-soft text-center py-12"><p className="text-muted-foreground">Chargement…</p></div>

  if (!convention) {
    return (
      <div className="card-soft text-center py-12">
        <div className="text-4xl mb-4">📋</div>
        <p className="font-semibold text-foreground mb-2">Pas encore de convention</p>
        <p className="text-sm text-muted-foreground">
          L'administration créera votre convention une fois votre candidature acceptée par l'entreprise.
        </p>
        <div className="mt-4 text-left max-w-xs mx-auto text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Étapes :</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Postulez à une offre de stage</li>
            <li>L'entreprise accepte votre candidature</li>
            <li>L'administration génère la convention</li>
            <li>Vous signez ici</li>
          </ol>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(convention.status, convention.studentSigned)
  const canSign = !convention.studentSigned && (convention.status === 'en_attente' || convention.status === 'en_cours')

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Ma Convention de Stage</h2>
        <p className="text-muted-foreground mt-1">Consultez et signez votre convention</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ {successMsg}</p>
        </div>
      )}

      {/* Statut + bouton signer */}
      <div className="card-soft border border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Statut</p>
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        {canSign ? (
          <button onClick={handleSign} disabled={signing} className="btn-primary disabled:opacity-50">
            {signing ? 'Signature…' : '✍️ Signer la convention'}
          </button>
        ) : convention.studentSigned ? (
          <span className="text-sm text-green-600 font-medium">✅ Vous avez signé</span>
        ) : null}
      </div>

      {/* Infos */}
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
        <h3 className="text-lg font-semibold text-foreground mb-4">Informations détaillées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Superviseur</p>
            <p className="text-foreground">{convention.supervisor || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Contact</p>
            <p className="text-foreground">{convention.supervisorContact || '—'}</p>
          </div>
        </div>
        {convention.jobDescription && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-1">Description du poste</p>
            <p className="text-foreground bg-muted rounded-lg p-3 text-sm">{convention.jobDescription}</p>
          </div>
        )}
        {convention.objectives && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Objectifs pédagogiques</p>
            <p className="text-foreground bg-muted rounded-lg p-3 text-sm">{convention.objectives}</p>
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">État des signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Étudiant', sublabel: '(vous)', signed: convention.studentSigned },
            { label: 'Entreprise', sublabel: '', signed: convention.companySigned },
            { label: 'Établissement', sublabel: '', signed: convention.schoolSigned },
          ].map(sig => (
            <div key={sig.label} className={`border-2 rounded-lg p-4 text-center transition ${sig.signed ? 'border-green-300 bg-green-50' : 'border-dashed border-border'}`}>
              <p className="text-sm font-medium text-foreground mb-1">{sig.label}</p>
              {sig.sublabel && <p className="text-xs text-muted-foreground mb-3">{sig.sublabel}</p>}
              <div className="text-3xl my-2">{sig.signed ? '✅' : '⏳'}</div>
              <p className={`text-xs ${sig.signed ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                {sig.signed ? 'Signé' : 'En attente'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {convention.rejectionReason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Convention annulée par l'administration</p>
          <p className="text-sm text-red-700 mt-1">{convention.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}
