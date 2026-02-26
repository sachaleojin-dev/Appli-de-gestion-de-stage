import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../context/UserProfileContext'
import { supabase } from '../lib/supabaseClient'

export default function UserProfile() {
  const { user } = useAuth()
  const { profile, updateUserProfile } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error'

  // Synchronise formData quand le profil est chargé
  useEffect(() => {
    if (profile) setFormData(profile)
  }, [profile])

  if (!profile) {
    return (
      <div className="card-soft text-center py-12">
        <p className="text-muted-foreground">Profil non trouvé pour {user?.email}</p>
      </div>
    )
  }

  const isDemoAccount = ['user@example.com', 'entrepris@example.com', 'admin@example.com'].includes(user?.email)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus(null)

    try {
      if (isDemoAccount) {
        // Compte démo → mise à jour locale uniquement
        updateUserProfile(user.email, formData)
        setSaveStatus('success')
        setIsEditing(false)
        setSaving(false)
        return
      }

      // ── 1. Mise à jour table utilisateur ──────────────────────────────────
      const { error: userError } = await supabase
        .from('utilisateur')
        .update({
          nom: formData.nom || profile.nom,
          prenom: formData.prenom || profile.prenom,
          telephone: formData.phone || null,
          adresse: formData.adresse || null,
        })
        .eq('id_utilisateur', user.id)

      if (userError) throw new Error(userError.message)

      // ── 2. Mise à jour table spécifique au rôle ───────────────────────────
      if (profile.role === 'etudiant') {
        const { error } = await supabase
          .from('etudiant')
          .update({
            filiere: formData.specialization || null,
            niveau: formData.niveau || null,
            date_naissance: formData.date_naissance || null,
            cv_url: formData.cvUrl || null,
          })
          .eq('id_utilisateur', user.id)
        if (error) throw new Error(error.message)

      } else if (profile.role === 'entreprise') {
        const { error } = await supabase
          .from('entreprise')
          .update({
            secteur_activite: formData.industry || null,
            site_web: formData.site_web || null,
            description: formData.description || null,
          })
          .eq('id_utilisateur', user.id)
        if (error) throw new Error(error.message)

      } else if (profile.role === 'administration') {
        const { error } = await supabase
          .from('administration')
          .update({
            departement: formData.departement || null,
            fonction: formData.fonction || null,
          })
          .eq('id_utilisateur', user.id)
        if (error) throw new Error(error.message)
      }

      // ── 3. Met à jour le contexte local ───────────────────────────────────
      updateUserProfile(user.id, formData)
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

  const handleCancel = () => {
    setFormData(profile) // remet les données d'origine
    setIsEditing(false)
    setSaveStatus(null)
  }

  const renderRoleSpecificFields = () => {
    if (profile.role === 'etudiant') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Filière</label>
            <input type="text" name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Niveau</label>
            <input type="text" name="niveau"
              value={formData.niveau || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date de naissance</label>
            <input type="date" name="date_naissance"
              value={formData.date_naissance || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
        </>
      )
    }

    if (profile.role === 'entreprise') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Secteur d'activité</label>
            <input type="text" name="industry"
              value={formData.industry || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Site web</label>
            <input type="url" name="site_web"
              value={formData.site_web || ''}
              onChange={handleChange} disabled={!isEditing}
              placeholder="https://monentreprise.com"
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea name="description"
              value={formData.description || ''}
              onChange={handleChange} disabled={!isEditing} rows={3}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed resize-none" />
          </div>
          {profile.statut_validation && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Statut validation</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                profile.statut_validation === 'validee' ? 'bg-green-100 text-green-700' :
                profile.statut_validation === 'rejetee' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {profile.statut_validation === 'validee' ? '✅ Validée' :
                 profile.statut_validation === 'rejetee' ? '❌ Rejetée' : '⏳ En attente'}
              </span>
            </div>
          )}
        </>
      )
    }

    if (profile.role === 'administration') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Département</label>
            <input type="text" name="departement"
              value={formData.departement || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Fonction</label>
            <input type="text" name="fonction"
              value={formData.fonction || ''}
              onChange={handleChange} disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
          </div>
        </>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Mon Profil</h2>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
        {isDemoAccount && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 mt-2 inline-block">
            Compte de démonstration — les modifications ne sont pas persistées
          </p>
        )}
      </div>

      {/* Feedback sauvegarde */}
      {saveStatus === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✅ Profil mis à jour avec succès</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">❌ Erreur lors de la sauvegarde. Réessayez.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-1">
          <div className="card-soft space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
                {profile.avatar}
              </div>
              <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <span className="mt-2 text-xs bg-muted px-3 py-1 rounded-full capitalize">
                {profile.role}
              </span>
            </div>

            {profile.averageRating > 0 && (
              <div className="border-t border-border pt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Note Moyenne</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-primary">{profile.averageRating}</span>
                    <span className="text-lg">⭐</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({profile.ratings?.length || 0} avis)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Informations Personnelles</h3>
            <div className="flex gap-2">
              {isEditing && (
                <button onClick={handleCancel} className="btn-secondary text-sm">
                  Annuler
                </button>
              )}
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Modifier'}
              </button>
            </div>
          </div>

          <div className="space-y-4 card-soft">
            {/* Nom / Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nom</label>
                <input type="text" name="nom"
                  value={formData.nom || ''}
                  onChange={handleChange} disabled={!isEditing}
                  className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Prénom</label>
                <input type="text" name="prenom"
                  value={formData.prenom || ''}
                  onChange={handleChange} disabled={!isEditing}
                  className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
              <input type="tel" name="phone"
                value={formData.phone || ''}
                onChange={handleChange} disabled={!isEditing}
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Adresse</label>
              <input type="text" name="adresse"
                value={formData.adresse || ''}
                onChange={handleChange} disabled={!isEditing}
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Biographie</label>
              <textarea name="bio"
                value={formData.bio || ''}
                onChange={handleChange} disabled={!isEditing} rows={4}
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed resize-none" />
            </div>

            {/* Champs spécifiques au rôle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderRoleSpecificFields()}
            </div>

            {/* CV et liens sociaux */}
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Curriculum Vitae</label>
              <div className="flex items-center gap-2 mb-3">
                {formData.cvUrl ? (
                  <a href={formData.cvUrl} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm">
                    Voir mon CV
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">Aucun CV chargé</span>
                )}
              </div>
              {isEditing && (
                <input type="url" name="cvUrl"
                  placeholder="https://votre-lien-cv.com"
                  value={formData.cvUrl || ''}
                  onChange={handleChange}
                  className="input-soft w-full mb-4" />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">GitHub</label>
                  <input type="url" name="github"
                    placeholder="https://github.com/username"
                    value={formData.github || ''}
                    onChange={handleChange} disabled={!isEditing}
                    className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">LinkedIn</label>
                  <input type="url" name="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin || ''}
                    onChange={handleChange} disabled={!isEditing}
                    className="input-soft disabled:bg-muted disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avis reçus */}
      {profile.ratings && profile.ratings.length > 0 && (
        <div className="card-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Avis Reçus</h3>
          <div className="space-y-3">
            {profile.ratings.map((rating) => (
              <div key={rating.id} className="border border-border rounded-lg p-4 hover:bg-muted transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{rating.company || rating.student}</p>
                    <p className="text-xs text-muted-foreground">{rating.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-primary">{rating.rating}</span>
                    <span>⭐</span>
                  </div>
                </div>
                <p className="text-sm text-foreground">{rating.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats étudiant */}
      {profile.role === 'etudiant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-soft border border-border">
            <p className="text-sm text-muted-foreground mb-1">Stages Complétés</p>
            <p className="text-3xl font-bold text-primary">{profile.stagesCompleted || 0}</p>
          </div>
          <div className="card-soft border border-border">
            <p className="text-sm text-muted-foreground mb-1">Rapports Soumis</p>
            <p className="text-3xl font-bold text-accent">{profile.reportsSubmitted || 0}</p>
          </div>
        </div>
      )}

      {/* Stats entreprise */}
      {profile.role === 'entreprise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-soft border border-border">
            <p className="text-sm text-muted-foreground mb-1">Offres Publiées</p>
            <p className="text-3xl font-bold text-primary">{profile.offersPublished || 0}</p>
          </div>
          <div className="card-soft border border-border">
            <p className="text-sm text-muted-foreground mb-1">Étudiants Embauchés</p>
            <p className="text-3xl font-bold text-accent">{profile.studentsHired || 0}</p>
          </div>
        </div>
      )}
    </div>
  )
}
