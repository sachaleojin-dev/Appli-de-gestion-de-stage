import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const ROLE_CONFIG = {
  etudiant: {
    label: 'Étudiant',
    icon: '👤',
    color: 'border-blue-200 bg-blue-50 text-blue-700',
    description: 'Rechercher des offres de stage et postuler',
    fields: [
      { name: 'filiere', label: "Filière", placeholder: 'ex: Informatique, Génie Civil…', type: 'text', required: false },
      { name: 'niveau', label: "Niveau d'études", placeholder: 'ex: Licence 3, Master 1…', type: 'text', required: false },
      { name: 'date_naissance', label: 'Date de naissance', type: 'date', required: false },
    ]
  },
  entreprise: {
    label: 'Entreprise',
    icon: '🏢',
    color: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Publier des offres et gérer les candidatures',
    fields: [
      { name: 'nom_societe', label: 'Nom de la société', placeholder: 'ex: TechCorp SA', type: 'text', required: true },
      { name: 'secteur_activite', label: "Secteur d'activité", placeholder: 'ex: Informatique, BTP…', type: 'text', required: false },
      { name: 'site_web', label: 'Site web', placeholder: 'https://monentreprise.com', type: 'url', required: false },
      { name: 'description', label: 'Description', placeholder: 'Décrivez votre entreprise…', type: 'textarea', required: false },
    ]
  },
  administration: {
    label: 'Administration',
    icon: '⚙️',
    color: 'border-purple-200 bg-purple-50 text-purple-700',
    description: 'Gérer la plateforme et valider les comptes',
    fields: [
      { name: 'departement', label: 'Département', placeholder: 'ex: Scolarité, Direction…', type: 'text', required: false },
      { name: 'fonction', label: 'Fonction', placeholder: 'ex: Responsable pédagogique…', type: 'text', required: false },
      { name: 'niveau_acces', label: "Niveau d'accès", type: 'select', options: ['lecture', 'ecriture', 'admin'], required: false },
    ]
  }
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '', confirmPassword: '',
    telephone: '', adresse: '',
    filiere: '', niveau: '', date_naissance: '',
    nom_societe: '', secteur_activite: '', site_web: '', description: '',
    departement: '', fonction: '', niveau_acces: 'lecture',
  })

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setStep(2)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: selectedRole, nom: form.nom, prenom: form.prenom } }
      })
      if (authError) throw new Error(authError.message)
const authUserId = authData.user?.id
if (!authUserId) throw new Error('Erreur lors de la création du compte.')

// 2. Insérer dans la table utilisateur
      const { data: utilisateur, error: userError } = await supabase
        .from('utilisateur')
        .insert({
          id_utilisateur: authUserId,
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          telephone: form.telephone || null,
          adresse: form.adresse || null,
          role: selectedRole,
          mot_de_passe: 'MANAGED_BY_SUPABASE_AUTH',
        })
        .select('id_utilisateur')
        .single()
      if (userError) throw new Error(userError.message)

      const id_utilisateur = utilisateur.id_utilisateur

      // 3. Insérer dans la table spécifique au rôle
      if (selectedRole === 'etudiant') {
        const { error: err } = await supabase.from('etudiant').insert({
          id_utilisateur,
          filiere: form.filiere || null,
          niveau: form.niveau || null,
          date_naissance: form.date_naissance || null,
        })
        if (err) throw new Error(err.message)
      } else if (selectedRole === 'entreprise') {
        const { error: err } = await supabase.from('entreprise').insert({
          id_utilisateur,
          nom_societe: form.nom_societe,
          secteur_activite: form.secteur_activite || null,
          site_web: form.site_web || null,
          description: form.description || null,
          statut_validation: 'en_attente',
        })
        if (err) throw new Error(err.message)
      } else if (selectedRole === 'administration') {
        const { error: err } = await supabase.from('administration').insert({
          id_utilisateur,
          departement: form.departement || null,
          fonction: form.fonction || null,
          niveau_acces: form.niveau_acces || 'lecture',
        })
        if (err) throw new Error(err.message)
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null

  // ── Page succès ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Compte créé !</h2>
          <p className="text-muted-foreground mb-1">
            Un email de confirmation a été envoyé à <strong>{form.email}</strong>.
          </p>
          {selectedRole === 'entreprise' && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mt-3">
              Votre compte est <strong>en attente de validation</strong> par l'administration.
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 mb-6">
            Vérifiez votre boîte mail puis connectez-vous.
          </p>
          <Link to="/login">
            <button className="btn-primary w-full">Aller à la connexion</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft py-8">
      <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Gestion de Stage</h1>
          <p className="text-muted-foreground">Créer un nouveau compte</p>
        </div>

        {/* Tabs — Inscription active, Connexion cliquable */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <Link
            to="/login"
            className="flex-1 py-2 text-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Connexion
          </Link>
          <span className="flex-1 py-2 text-center rounded-md bg-white shadow-sm text-sm font-semibold text-foreground cursor-default">
            Inscription
          </span>
        </div>

        {/* ── ÉTAPE 1 : Choix du rôle ── */}
        {step === 1 && (
          <div>
            <p className="text-sm font-medium text-foreground text-center mb-5">
              Qui êtes-vous ?
            </p>
            <div className="space-y-3">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleRoleSelect(key)}
                  className="btn-secondary w-full text-left flex items-center gap-4 py-4"
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* ── ÉTAPE 2 : Formulaire ── */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => { setStep(1); setError('') }}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                ← Changer de rôle
              </button>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${roleConfig.color}`}>
                {roleConfig.icon} {roleConfig.label}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Infos personnelles */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Informations personnelles
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Nom *</label>
                    <input name="nom" type="text" value={form.nom} onChange={handleChange}
                      placeholder="Dupont" className="input-soft" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Prénom *</label>
                    <input name="prenom" type="text" value={form.prenom} onChange={handleChange}
                      placeholder="Jean" className="input-soft" required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Téléphone</label>
                  <input name="telephone" type="tel" value={form.telephone} onChange={handleChange}
                    placeholder="+33 6 00 00 00 00" className="input-soft" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Adresse</label>
                  <input name="adresse" type="text" value={form.adresse} onChange={handleChange}
                    placeholder="12 rue de la Paix, Paris" className="input-soft" />
                </div>
              </div>

              {/* Champs spécifiques au rôle */}
              {roleConfig.fields.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Informations {roleConfig.label.toLowerCase()}
                  </p>
                  <div className="space-y-3">
                    {roleConfig.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {field.label}{field.required && ' *'}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea name={field.name} value={form[field.name]} onChange={handleChange}
                            placeholder={field.placeholder} rows={3} required={field.required}
                            className="input-soft resize-none" />
                        ) : field.type === 'select' ? (
                          <select name={field.name} value={form[field.name]} onChange={handleChange}
                            required={field.required} className="input-soft">
                            {field.options.map(opt => (
                              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                          </select>
                        ) : (
                          <input name={field.name} type={field.type} value={form[field.name]}
                            onChange={handleChange} placeholder={field.placeholder}
                            required={field.required} className="input-soft" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Identifiants */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Identifiants de connexion
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Adresse email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="nom@example.com" className="input-soft" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Mot de passe *</label>
                    <input name="password" type="password" value={form.password} onChange={handleChange}
                      placeholder="Min. 6 caractères" className="input-soft" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Confirmer le mot de passe *</label>
                    <input name="confirmPassword" type="password" value={form.confirmPassword}
                      onChange={handleChange} placeholder="••••••••" className="input-soft" required />
                  </div>
                </div>
              </div>

              {selectedRole === 'entreprise' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  ⚠️ Les comptes entreprise sont soumis à validation par l'administration avant activation.
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Création du compte…' : 'Créer mon compte'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
