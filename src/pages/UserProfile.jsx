import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const DEMO_EMAILS = ['user@example.com', 'entreprise@example.com', 'admin@example.com']

export default function UserProfile() {
  const { user } = useAuth()
  const isDemo = user?.isDemo === true || DEMO_EMAILS.includes(user?.email)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    if (isDemo) {
      // Profil démo depuis les metadata auth
      setProfile({
        id: user.id,
        nom: user.user_metadata?.nom || user.nom || 'Démo',
        prenom: user.user_metadata?.prenom || user.prenom || '',
        email: user.email,
        role: user.role || user.user_metadata?.role || 'etudiant',
        telephone: '',
        adresse: '',
      })
      setLoading(false)
    } else if (user) {
      fetchProfile()
    }
  }, [user, isDemo])

  useEffect(() => {
    if (profile) setFormData(profile)
  }, [profile])

  // ── Charger le profil depuis Supabase ───────────────────────────────────
  const fetchProfile = async () => {
    setLoading(true)

    const { data: utilisateur, error } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('id_utilisateur', user.id)
      .single()

    if (error || !utilisateur) {
      // Essaye de recréer le profil depuis les metadata auth
      await repairProfile()
      setLoading(false)
      return
    }

    let extra = {}

    if (utilisateur.role === 'etudiant') {
      const { data } = await supabase.from('etudiant').select('*').eq('id_utilisateur', user.id).single()
      extra = {
        filiere: data?.filiere || '',
        niveau: data?.niveau || '',
        date_naissance: data?.date_naissance || '',
        cv_url: data?.cv_url || '',
        photo_url: data?.photo_url || '',
      }
    } else if (utilisateur.role === 'entreprise') {
      const { data } = await supabase.from('entreprise').select('*').eq('id_utilisateur', user.id).single()
      extra = {
        nom_societe: data?.nom_societe || '',
        secteur_activite: data?.secteur_activite || '',
        site_web: data?.site_web || '',
        description: data?.description || '',
        statut_validation: data?.statut_validation || 'en_attente',
      }
    } else if (utilisateur.role === 'administration') {
      const { data } = await supabase.from('administration').select('*').eq('id_utilisateur', user.id).single()
      extra = {
        departement: data?.departement || '',
        fonction: data?.fonction || '',
        niveau_acces: data?.niveau_acces || '',
      }
    }

    setProfile({ ...utilisateur, ...extra })
    setLoading(false)
  }

  // Tente de recréer la ligne utilisateur si elle manque
  const repairProfile = async () => {
    const meta = user.user_metadata || {}
    const { error } = await supabase.from('utilisateur').insert({
      id_utilisateur: user.id,
      nom: meta.nom || user.email.split('@')[0],
      prenom: meta.prenom || '',
      email: user.email,
      role: meta.role || 'etudiant',
      mot_de_passe: 'MANAGED_BY_SUPABASE_AUTH',
    })
    if (!error) await fetchProfile()
  }

  // ── Sauvegarder ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setSaveStatus(null)

    if (isDemo) {
      setProfile(formData)
      setSaveStatus('success')
      setIsEditing(false)
      setSaving(false)
      return
    }

    try {
      // 1. Table utilisateur
      const { error: userError } = await supabase
        .from('utilisateur')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone || null,
          adresse: formData.adresse || null,
        })
        .eq('id_utilisateur', user.id)
      if (userError) throw new Error(userError.message)

      // 2. Table spécifique au rôle
      if (profile.role === 'etudiant') {
        const { error } = await supabase.from('etudiant').upsert({
          id_utilisateur: user.id,
          filiere: formData.filiere || null,
          niveau: formData.niveau || null,
          date_naissance: formData.date_naissance || null,
          cv_url: formData.cv_url || null,
        }, { onConflict: 'id_utilisateur' })
        if (error) throw new Error(error.message)

      } else if (profile.role === 'entreprise') {
        const { error } = await supabase.from('entreprise').update({
          secteur_activite: formData.secteur_activite || null,
          site_web: formData.site_web || null,
          description: formData.description || null,
        }).eq('id_utilisateur', user.id)
        if (error) throw new Error(error.message)

      } else if (profile.role === 'administration') {
        const { error } = await supabase.from('administration').update({
          departement: formData.departement || null,
          fonction: formData.fonction || null,
        }).eq('id_utilisateur', user.id)
        if (error) throw new Error(error.message)
      }

      setProfile(formData)
      setSaveStatus('success')
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleCancel = () => { setFormData(profile); setIsEditing(false); setSaveStatus(null) }

  const renderRoleFields = () => {
    if (profile.role === 'etudiant') return (
      <>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Filière</label>
          <input type="text" name="filiere" value={formData.filiere || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            placeholder="Ex: Informatique" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Niveau d'études</label>
          <input type="text" name="niveau" value={formData.niveau || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            placeholder="Ex: Licence 3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Date de naissance</label>
          <input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Lien CV</label>
          <input type="url" name="cv_url" value={formData.cv_url || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            placeholder="https://drive.google.com/…" />
        </div>
      </>
    )

    if (profile.role === 'entreprise') return (
      <>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nom de la société</label>
          <input type="text" name="nom_societe" value={formData.nom_societe || ''} onChange={handleChange}
            disabled className="input-soft bg-muted cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Secteur d'activité</label>
          <input type="text" name="secteur_activite" value={formData.secteur_activite || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Site web</label>
          <input type="url" name="site_web" value={formData.site_web || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            placeholder="https://monentreprise.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Statut validation</label>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            formData.statut_validation === 'validee' ? 'bg-green-100 text-green-700' :
            formData.statut_validation === 'rejetee' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {formData.statut_validation === 'validee' ? '✅ Validée' :
             formData.statut_validation === 'rejetee' ? '❌ Rejetée' : '⏳ En attente'}
          </span>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange}
            disabled={!isEditing} rows={3}
            className="input-soft disabled:bg-muted disabled:cursor-not-allowed resize-none" />
        </div>
      </>
    )

    if (profile.role === 'administration') return (
      <>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Département</label>
          <input type="text" name="departement" value={formData.departement || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Fonction</label>
          <input type="text" name="fonction" value={formData.fonction || ''} onChange={handleChange}
            disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Niveau d'accès</label>
          <span className="input-soft bg-muted block">{formData.niveau_acces || '—'}</span>
        </div>
      </>
    )
  }

  if (loading) return (
    <div className="card-soft text-center py-12">
      <p className="text-muted-foreground">Chargement du profil…</p>
    </div>
  )

  if (!profile) return (
    <div className="card-soft text-center py-12">
      <p className="text-muted-foreground mb-2">Profil non trouvé</p>
      <p className="text-xs text-muted-foreground">Connecté en tant que : {user?.email}</p>
      <button onClick={repairProfile} className="btn-secondary mt-4 text-sm">
        Réparer le profil
      </button>
    </div>
  )

  const initials = `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase() || '?'
  const displayName = [profile.prenom, profile.nom].filter(Boolean).join(' ') || profile.email

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Mon Profil</h2>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
        {isDemo && <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">Compte de démonstration</p>}
      </div>

      {saveStatus === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ Profil mis à jour avec succès</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ Erreur lors de la sauvegarde. Vérifiez la console.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <div className="lg:col-span-1 card-soft text-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mx-auto">
            {initials}
          </div>
          <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <span className="inline-block text-xs bg-muted px-3 py-1 rounded-full capitalize">
            {profile.role === 'administration' ? '⚙️ Administration' :
             profile.role === 'entreprise' ? '🏢 Entreprise' : '👤 Étudiant'}
          </span>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Informations personnelles</h3>
            <div className="flex gap-2">
              {isEditing && <button onClick={handleCancel} className="btn-secondary text-sm">Annuler</button>}
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Enregistrement…' : isEditing ? 'Enregistrer' : 'Modifier'}
              </button>
            </div>
          </div>

          <div className="card-soft space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nom</label>
                <input type="text" name="nom" value={formData.nom || ''} onChange={handleChange}
                  disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Prénom</label>
                <input type="text" name="prenom" value={formData.prenom || ''} onChange={handleChange}
                  disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input type="email" value={profile.email} disabled
                className="input-soft bg-muted cursor-not-allowed" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                <input type="tel" name="telephone" value={formData.telephone || ''} onChange={handleChange}
                  disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
                  placeholder="+33 6 00 00 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Adresse</label>
                <input type="text" name="adresse" value={formData.adresse || ''} onChange={handleChange}
                  disabled={!isEditing} className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
              </div>
            </div>

            {/* Champs spécifiques au rôle */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Informations {profile.role}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderRoleFields()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
