import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const UserProfileContext = createContext()

// ─── Comptes démo (gardés en fallback) ───────────────────────────────────────
const DEMO_PROFILES = {
  'user@example.com': {
    id: 'user@example.com',
    name: 'Jean Dupont',
    email: 'user@example.com',
    role: 'etudiant',
    avatar: 'JD',
    phone: '+33 6 12 34 56 78',
    university: 'Université Paris 1',
    specialization: 'Informatique',
    bio: 'Étudiant en informatique passionné par le développement web',
    cvUrl: 'https://example.com/cv-jean-dupont.pdf',
    github: 'https://github.com/jeandupont',
    linkedin: 'https://linkedin.com/in/jeandupont',
    ratings: [
      { id: 'eval1', company: 'TechCorp', rating: 5, comment: 'Excellent stagiaire, très motivé', date: '2024-01-15' },
      { id: 'eval2', company: 'WebDev Inc', rating: 4.5, comment: 'Très bonne collaboration', date: '2024-02-20' }
    ],
    averageRating: 4.75,
    stagesCompleted: 2,
    reportsSubmitted: 1
  },
  'entrepris@example.com': {
    id: 'entrepris@example.com',
    name: 'TechCorp',
    email: 'entrepris@example.com',
    role: 'entreprise',
    avatar: 'TC',
    phone: '+33 1 23 45 67 89',
    industry: 'Technologie & Développement',
    location: 'Paris, France',
    bio: 'Entreprise spécialisée dans les solutions web innovantes',
    offersPublished: 5,
    studentsHired: 12,
    averageRating: 4.6,
    ratings: [
      { id: 'eval1', student: 'Jean Dupont', rating: 5, comment: 'Entreprise exceptionnelle', date: '2024-01-15' },
      { id: 'eval2', student: 'Marie Martin', rating: 4.5, comment: 'Bon environnement de travail', date: '2024-02-20' }
    ]
  },
  'admin@example.com': {
    id: 'admin@example.com',
    name: 'Administrateur',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'AD',
    phone: '+33 1 98 76 54 32',
    school: 'Université Paris 1',
    department: 'Gestion des Stages',
    bio: "Responsable de la coordination des stages au sein de l'établissement",
    cvUrl: null,
    github: null,
    linkedin: null
  }
}

const DEMO_EMAILS = Object.keys(DEMO_PROFILES)

// ─── Helper : formate les initiales avatar ────────────────────────────────────
const getInitials = (nom, prenom) => {
  return `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}`
}

export function UserProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // ── Charge le profil dès qu'un user est connecté ──────────────────────────
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    fetchProfile(user)
  }, [user])

  const fetchProfile = async (authUser) => {
    const email = authUser.email

    // Compte démo → retourne les données mockées directement
    if (DEMO_EMAILS.includes(email)) {
      setProfile(DEMO_PROFILES[email])
      return
    }

    // Vrai compte → charge depuis Supabase
    setLoadingProfile(true)
    try {
      const { data: utilisateur, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', authUser.id)
        .single()

      if (error || !utilisateur) {
        console.error('Profil non trouvé dans Supabase:', error?.message)
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      const role = utilisateur.role
      let extra = {}

      // Charge les données spécifiques au rôle
      if (role === 'etudiant') {
        const { data: etudiant } = await supabase
          .from('etudiant')
          .select('*')
          .eq('id_utilisateur', authUser.id)
          .single()

        extra = {
          specialization: etudiant?.filiere || '',
          niveau: etudiant?.niveau || '',
          date_naissance: etudiant?.date_naissance || null,
          cvUrl: etudiant?.cv_url || null,
          photo_url: etudiant?.photo_url || null,
        }

      } else if (role === 'entreprise') {
        const { data: entreprise } = await supabase
          .from('entreprise')
          .select('*')
          .eq('id_utilisateur', authUser.id)
          .single()

        extra = {
          nom_societe: entreprise?.nom_societe || '',
          industry: entreprise?.secteur_activite || '',
          site_web: entreprise?.site_web || '',
          description: entreprise?.description || '',
          statut_validation: entreprise?.statut_validation || 'en_attente',
          logo_url: entreprise?.logo_url || null,
        }

      } else if (role === 'administration') {
        const { data: admin } = await supabase
          .from('administration')
          .select('*')
          .eq('id_utilisateur', authUser.id)
          .single()

        extra = {
          departement: admin?.departement || '',
          fonction: admin?.fonction || '',
          niveau_acces: admin?.niveau_acces || 'lecture',
        }
      }

      // Construit le profil unifié
      setProfile({
        id: authUser.id,
        email: utilisateur.email,
        name: `${utilisateur.prenom} ${utilisateur.nom}`,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role,
        avatar: getInitials(utilisateur.nom, utilisateur.prenom),
        phone: utilisateur.telephone || '',
        adresse: utilisateur.adresse || '',
        bio: '',
        ratings: [],
        averageRating: 0,
        ...extra
      })

    } catch (err) {
      console.error('Erreur chargement profil:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  // ── Mise à jour du profil dans Supabase ───────────────────────────────────
  const updateUserProfile = async (userId, updates) => {
    // Compte démo → mise à jour locale uniquement
    const email = user?.email
    if (DEMO_EMAILS.includes(email)) {
      setProfile(prev => ({ ...prev, ...updates }))
      return { success: true }
    }

    // Vrai compte → mise à jour dans Supabase
    const { error } = await supabase
      .from('utilisateur')
      .update({
        nom: updates.nom,
        prenom: updates.prenom,
        telephone: updates.phone,
        adresse: updates.adresse,
      })
      .eq('id_utilisateur', userId)

    if (error) return { success: false, error: error.message }

    setProfile(prev => ({ ...prev, ...updates }))
    return { success: true }
  }

  // ── Récupère le profil d'un autre utilisateur (ex: admin voit étudiant) ───
  const getUserProfile = (emailOrId) => {
    // Démo → retourne depuis DEMO_PROFILES
    if (DEMO_EMAILS.includes(emailOrId)) return DEMO_PROFILES[emailOrId]
    // Utilisateur connecté → retourne son profil chargé
    if (profile && (profile.id === emailOrId || profile.email === emailOrId)) return profile
    return null
  }

  const addRating = (userId, rating) => {
    setProfile(prev => {
      if (!prev) return prev
      const updatedRatings = [...(prev.ratings || []), rating]
      const newAverage = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length
      return { ...prev, ratings: updatedRatings, averageRating: Number(newAverage.toFixed(2)) }
    })
  }

  return (
    <UserProfileContext.Provider value={{
      profile,          // profil de l'utilisateur connecté
      loadingProfile,
      getUserProfile,   // pour accéder au profil d'un autre user
      updateUserProfile,
      addRating,
      // Garde la compatibilité avec l'ancien code qui utilisait userProfiles[email]
      userProfiles: {
        ...DEMO_PROFILES,
        ...(profile ? { [profile.email]: profile } : {})
      }
    }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  return useContext(UserProfileContext)
}
