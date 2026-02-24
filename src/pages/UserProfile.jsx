import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserProfile } from '../context/UserProfileContext'

export default function UserProfile() {
  const { user } = useAuth()
  const { getUserProfile, updateUserProfile } = useUserProfile()
  const profile = getUserProfile(user?.email)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile || {})

  if (!profile) {
    return (
      <div className="card-soft text-center py-12">
        <p className="text-muted-foreground">Profil non trouvé pour {user?.email}</p>
      </div>
    )
  }

  const handleSave = () => {
    updateUserProfile(user.email, formData)
    setIsEditing(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const renderRoleSpecificFields = () => {
    if (profile.role === 'etudiant') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Université</label>
            <input
              type="text"
              name="university"
              value={formData.university || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Spécialisation</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
        </>
      )
    }

    if (profile.role === 'entreprise') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Secteur d'Activité</label>
            <input
              type="text"
              name="industry"
              value={formData.industry || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Localisation</label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
        </>
      )
    }

    if (profile.role === 'admin') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">École/Université</label>
            <input
              type="text"
              name="school"
              value={formData.school || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Département</label>
            <input
              type="text"
              name="department"
              value={formData.department || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
            />
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
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="card-soft space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
                {profile.avatar}
              </div>
              <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>

            {/* Rating */}
            {profile.averageRating && (
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

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Informations Personnelles</h3>
            <button
              onClick={() => {
                if (isEditing) handleSave()
                else setIsEditing(true)
              }}
              className={`btn-primary text-sm ${isEditing ? 'bg-success' : ''}`}
            >
              {isEditing ? 'Enregistrer' : 'Modifier'}
            </button>
          </div>

          {/* Common Fields */}
          <div className="space-y-4 card-soft">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nom</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Biographie</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                disabled={!isEditing}
                rows="4"
                className="input-soft disabled:bg-muted disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Role-Specific Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderRoleSpecificFields()}
            </div>

            {/* CV and Social Links */}
            <div className="border-t border-border pt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Curriculum Vitae</label>
              <div className="flex items-center gap-2 mb-3">
                {formData.cvUrl ? (
                  <a
                    href={formData.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Voir mon CV
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">Aucun CV chargé</span>
                )}
              </div>
              {isEditing && (
                <input
                  type="url"
                  name="cvUrl"
                  placeholder="https://votre-lien-cv.com"
                  value={formData.cvUrl || ''}
                  onChange={handleChange}
                  className="input-soft w-full mb-4"
                />
              )}

              {/* GitHub and LinkedIn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">GitHub (optionnel)</label>
                  <input
                    type="url"
                    name="github"
                    placeholder="https://github.com/username"
                    value={formData.github || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">LinkedIn (optionnel)</label>
                  <input
                    type="url"
                    name="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-soft disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      {profile.ratings && profile.ratings.length > 0 && (
        <div className="card-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Avis Reçus</h3>
          <div className="space-y-3">
            {profile.ratings.map((rating) => (
              <div key={rating.id} className="border border-border rounded-lg p-4 hover:bg-muted transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {rating.company || rating.student}
                    </p>
                    <p className="text-xs text-muted-foreground">{rating.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span className="font-bold text-primary">{rating.rating}</span>
                      <span>⭐</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground">{rating.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Section */}
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
