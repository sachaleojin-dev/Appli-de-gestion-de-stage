import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const UserProfileContext = createContext()

const DEMO_EMAILS = ['user@example.com', 'entreprise@example.com', 'admin@example.com']

const DEMO_PROFILES = {
  'user@example.com': {
    id: 'user@example.com',
    name: 'Jean Dupont',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'user@example.com',
    role: 'etudiant',
    avatar: 'JD',
    telephone: '+33 6 12 34 56 78',
    adresse: '',
    // Champs étudiant — noms identiques à la BDD
    filiere: 'Informatique',
    niveau: 'Licence 3',
    date_naissance: '',
    cv_url: 'https://example.com/cv-jean-dupont.pdf',
  },
  'entreprise@example.com': {
    id: 'entreprise@example.com',
    name: 'TechCorp',
    nom: 'TechCorp',
    prenom: '',
    email: 'entreprise@example.com',
    role: 'entreprise',
    avatar: 'TC',
    telephone: '+33 1 23 45 67 89',
    adresse: 'Paris, France',
    // Champs entreprise — noms identiques à la BDD
    nom_societe: 'TechCorp',
    secteur_activite: 'Technologie & Développement',
    site_web: 'https://techcorp.fr',
    description: 'Entreprise spécialisée dans les solutions web innovantes',
    statut_validation: 'validee',
  },
  'admin@example.com': {
    id: 'admin@example.com',
    name: 'Administrateur',
    nom: 'Admin',
    prenom: '',
    email: 'admin@example.com',
    role: 'administration',
    avatar: 'AD',
    telephone: '+33 1 98 76 54 32',
    adresse: '',
    // Champs admin — noms identiques à la BDD
    departement: 'Gestion des Stages',
    fonction: 'Responsable pédagogique',
    niveau_acces: 'admin',
  }
}

const getInitials = (prenom, nom) =>
  `${(prenom?.[0] || '').toUpperCase()}${(nom?.[0] || '').toUpperCase()}` || '?'

export function UserProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (!user) { setProfile(null); return }
    loadProfile(user)
  }, [user])

  const loadProfile = async (authUser) => {
    const email = authUser.email

    // ── Compte démo ───────────────────────────────────────────────────────
    if (authUser.isDemo || DEMO_EMAILS.includes(email)) {
      // Cherche d'abord dans les clés exactes
      const demoKey = Object.keys(DEMO_PROFILES).find(k => k === email)
        || (email === 'entrepris@example.com' ? 'entreprise@example.com' : null)
      setProfile(demoKey ? DEMO_PROFILES[demoKey] : null)
      return
    }

    // ── Vrai compte Supabase ──────────────────────────────────────────────
    setLoadingProfile(true)
    try {
      const { data: utilisateur, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', authUser.id)
        .single()

      if (error || !utilisateur) {
        console.warn('Profil utilisateur non trouvé, tentative de réparation…')
        await tryRepairAndReload(authUser)
        return
      }

      let extra = {}
      const role = utilisateur.role

      if (role === 'etudiant') {
        const { data: e } = await supabase
          .from('etudiant').select('*').eq('id_utilisateur', authUser.id).single()
        extra = {
          // Noms de champs = noms BDD exacts
          filiere:         e?.filiere || '',
          niveau:          e?.niveau || '',
          date_naissance:  e?.date_naissance || '',
          cv_url:          e?.cv_url || '',
          photo_url:       e?.photo_url || '',
        }

      } else if (role === 'entreprise') {
        const { data: e } = await supabase
          .from('entreprise').select('*').eq('id_utilisateur', authUser.id).single()
        extra = {
          nom_societe:        e?.nom_societe || '',
          secteur_activite:   e?.secteur_activite || '',
          site_web:           e?.site_web || '',
          description:        e?.description || '',
          statut_validation:  e?.statut_validation || 'en_attente',
          logo_url:           e?.logo_url || '',
        }

      } else if (role === 'administration') {
        const { data: a } = await supabase
          .from('administration').select('*').eq('id_utilisateur', authUser.id).single()
        extra = {
          departement:   a?.departement || '',
          fonction:      a?.fonction || '',
          niveau_acces:  a?.niveau_acces || 'lecture',
        }
      }

      setProfile({
        id:        authUser.id,
        email:     utilisateur.email,
        nom:       utilisateur.nom || '',
        prenom:    utilisateur.prenom || '',
        name:      `${utilisateur.prenom || ''} ${utilisateur.nom || ''}`.trim(),
        role:      utilisateur.role,
        avatar:    getInitials(utilisateur.prenom, utilisateur.nom),
        telephone: utilisateur.telephone || '',
        adresse:   utilisateur.adresse || '',
        ...extra
      })

    } catch (err) {
      console.error('Erreur chargement profil:', err)
      setProfile(null)
    } finally {
      setLoadingProfile(false)
    }
  }

  // Recrée la ligne utilisateur depuis les metadata auth si elle manque
  const tryRepairAndReload = async (authUser) => {
    const meta = authUser.user_metadata || {}
    try {
      await supabase.from('utilisateur').insert({
        id_utilisateur: authUser.id,
        nom:    meta.nom    || authUser.email.split('@')[0],
        prenom: meta.prenom || '',
        email:  authUser.email,
        role:   meta.role   || 'etudiant',
        mot_de_passe: 'MANAGED_BY_SUPABASE_AUTH',
      })
      await loadProfile(authUser)
    } catch (e) {
      console.error('Réparation échouée:', e)
      setLoadingProfile(false)
    }
  }

  // ── Mise à jour profil ────────────────────────────────────────────────────
  const updateUserProfile = async (userId, updates) => {
    // Démo → local uniquement
    if (user?.isDemo || DEMO_EMAILS.includes(user?.email)) {
      setProfile(prev => ({ ...prev, ...updates }))
      return { success: true }
    }

    try {
      // 1. Table utilisateur (champs communs)
      const { error: e1 } = await supabase
        .from('utilisateur')
        .update({
          nom:       updates.nom       || undefined,
          prenom:    updates.prenom    || undefined,
          telephone: updates.telephone || null,
          adresse:   updates.adresse   || null,
        })
        .eq('id_utilisateur', userId)
      if (e1) throw e1

      // 2. Table spécifique au rôle
      if (profile?.role === 'etudiant') {
        await supabase.from('etudiant').upsert({
          id_utilisateur: userId,
          filiere:        updates.filiere        || null,
          niveau:         updates.niveau         || null,
          date_naissance: updates.date_naissance || null,
          cv_url:         updates.cv_url         || null,
        }, { onConflict: 'id_utilisateur' })

      } else if (profile?.role === 'entreprise') {
        await supabase.from('entreprise').update({
          secteur_activite: updates.secteur_activite || null,
          site_web:         updates.site_web         || null,
          description:      updates.description      || null,
        }).eq('id_utilisateur', userId)

      } else if (profile?.role === 'administration') {
        await supabase.from('administration').update({
          departement: updates.departement || null,
          fonction:    updates.fonction    || null,
        }).eq('id_utilisateur', userId)
      }

      // 3. Met à jour le state local
      setProfile(prev => ({
        ...prev,
        ...updates,
        name: `${updates.prenom || prev.prenom} ${updates.nom || prev.nom}`.trim(),
        avatar: getInitials(updates.prenom || prev.prenom, updates.nom || prev.nom),
      }))
      return { success: true }

    } catch (err) {
      console.error('updateUserProfile error:', err)
      return { success: false, error: err.message }
    }
  }

  return (
    <UserProfileContext.Provider value={{
      profile,
      loadingProfile,
      updateUserProfile,
      // Compatibilité avec ancien code
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
