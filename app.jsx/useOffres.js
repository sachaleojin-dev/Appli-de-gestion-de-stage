import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Hook pour lire toutes les offres ───────────────────────────────────────
export function useOffres() {
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOffres()
  }, [])

  const fetchOffres = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('offres')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setOffres(data)
    setLoading(false)
  }

  return { offres, loading, error, refetch: fetchOffres }
}

// ─── Hook pour créer une offre (usage entreprise) ───────────────────────────
export function useCreateOffre() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createOffre = async ({ titre, entreprise, description, localisation, duree, remuneration }) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('offres')
      .insert([{ titre, entreprise, description, localisation, duree, remuneration }])
      .select()
      .single()

    setLoading(false)
    if (error) {
      setError(error.message)
      return { success: false, error: error.message }
    }
    return { success: true, data }
  }

  return { createOffre, loading, error }
}

// ─── Hook pour supprimer une offre ─────────────────────────────────────────
export function useDeleteOffre() {
  const deleteOffre = async (id) => {
    const { error } = await supabase.from('offres').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }
  return { deleteOffre }
}
