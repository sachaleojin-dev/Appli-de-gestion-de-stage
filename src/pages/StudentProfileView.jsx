import { useParams, useNavigate } from 'react-router-dom'
import { useUserProfile } from '../context/UserProfileContext'
import { useAuth } from '../context/AuthContext'

export default function StudentProfileView() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getUserProfile } = useUserProfile()
  
  const profile = getUserProfile(studentId)

  if (!profile) {
    return (
      <div className="card-soft text-center">
        <p className="text-muted-foreground">Profil étudiant non trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Profil Étudiant</h2>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline text-sm"
        >
          Retour
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-1">
          <div className="card-soft space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
                {profile.avatar}
              </div>
              <h3 className="text-xl font-bold text-foreground text-center">{profile.name}</h3>
              <p className="text-sm text-muted-foreground text-center">{profile.email}</p>
              
              {profile.phone && (
                <p className="text-sm text-foreground mt-2">{profile.phone}</p>
              )}
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

            {/* Social Links */}
            {(profile.github || profile.linkedin || profile.cvUrl) && (
              <div className="border-t border-border pt-4 space-y-2">
                {profile.cvUrl && (
                  <a
                    href={profile.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-primary/10 transition text-sm"
                  >
                    <span>📄</span> CV
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-primary/10 transition text-sm"
                  >
                    <span>💻</span> GitHub
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-foreground hover:bg-primary/10 transition text-sm"
                  >
                    <span>💼</span> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="card-soft space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Informations Personnelles</h3>
            
            {profile.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Biographie</p>
                <p className="text-foreground">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {profile.university && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Université</p>
                  <p className="text-foreground font-medium">{profile.university}</p>
                </div>
              )}
              {profile.specialization && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Spécialisation</p>
                  <p className="text-foreground font-medium">{profile.specialization}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-soft border border-border">
              <p className="text-sm text-muted-foreground mb-1">Stages Complétés</p>
              <p className="text-3xl font-bold text-primary">{profile.stagesCompleted || 0}</p>
            </div>
            <div className="card-soft border border-border">
              <p className="text-sm text-muted-foreground mb-1">Rapports Soumis</p>
              <p className="text-3xl font-bold text-accent">{profile.reportsSubmitted || 0}</p>
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
                    <p className="font-medium text-foreground">{rating.company}</p>
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
    </div>
  )
}
