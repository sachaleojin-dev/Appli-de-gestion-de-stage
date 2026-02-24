import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Hook pour lire les candidatures de l'étudiant connecté ─────────────────
export function useMesCandidatures() {
  const { user } = useAuth()
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchCandidatures()
  }, [user])

  const fetchCandidatures = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('candidatures')
      .select(`
        *,
        offres (
          titre,
          entreprise,
          localisation,
          duree,
          remuneration
        )
      `)
      .eq('etudiant_id', user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setCandidatures(data)
    setLoading(false)
  }

  return { candidatures, loading, error, refetch: fetchCandidatures }
}

// ─── Hook pour les candidatures reçues (usage entreprise) ───────────────────
export function useCandidaturesRecues(offreId = null) {
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCandidatures()
  }, [offreId])

  const fetchCandidatures = async () => {
    setLoading(true)
    let query = supabase
      .from('candidatures')
      .select(`*, offres(titre, entreprise)`)
      .order('created_at', { ascending: false })

    if (offreId) query = query.eq('offre_id', offreId)

    const { data, error } = await query
    if (error) setError(error.message)
    else setCandidatures(data)
    setLoading(false)
  }

  return { candidatures, loading, error, refetch: fetchCandidatures }
}

// ─── Hook pour postuler à une offre ─────────────────────────────────────────
export function usePostuler() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const postuler = async (offreId) => {
    if (!user) return { success: false, error: 'Non connecté' }
    setLoading(true)
    setError(null)

    // Vérifie si déjà candidat
    const { data: existing } = await supabase
      .from('candidatures')
      .select('id')
      .eq('etudiant_id', user.id)
      .eq('offre_id', offreId)
      .single()

    if (existing) {
      setLoading(false)
      return { success: false, error: 'Vous avez déjà postulé à cette offre.' }
    }

    const { data, error } = await supabase
      .from('candidatures')
      .insert([{ etudiant_id: user.id, offre_id: offreId, statut: 'en_attente' }])
      .select()
      .single()

    setLoading(false)
    if (error) {
      setError(error.message)
      return { success: false, error: error.message }
    }
    return { success: true, data }
  }

  return { postuler, loading, error }
}

// ─── Hook pour changer le statut d'une candidature (usage entreprise) ───────
export function useUpdateStatutCandidature() {
  const updateStatut = async (candidatureId, statut) => {
    const { error } = await supabase
      .from('candidatures')
      .update({ statut })
      .eq('id', candidatureId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }
  return { updateStatut }
}
