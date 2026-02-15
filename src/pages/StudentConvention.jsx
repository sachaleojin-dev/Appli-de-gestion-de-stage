import { useState } from 'react'
import conventionsData from '../data/conventions.json'

export default function StudentConvention() {
  const [conventions] = useState(conventionsData.conventions.filter(c => c.studentId === 'etudiant1'))
  const convention = conventions[0]

  if (!convention) {
    return (
      <div className="card-soft text-center">
        <p className="text-muted-foreground mb-4">Vous n'avez pas encore de convention de stage</p>
        <button className="btn-primary">Soumettre une Convention</button>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      en_attente: 'badge-pending',
      validee: 'badge-validated',
      rejetee: 'badge-rejected',
      signee: 'badge-accepted'
    }
    return badges[status] || 'badge-pending'
  }

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Ma Convention de Stage</h2>
        <p className="text-muted-foreground mt-1">Consultez les détails de votre convention de stage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="card-soft border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Statut</h3>
          <div className={getStatusBadge(convention.status)}>
            {convention.status === 'en_attente' && 'En Attente'}
            {convention.status === 'validee' && 'Validée'}
            {convention.status === 'rejetee' && 'Rejetée'}
            {convention.status === 'signee' && 'Signée'}
          </div>
        </div>

        {/* Timeline Card */}
        <div className="card-soft border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Dates</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Début:</strong> {convention.startDate}</p>
            <p><strong>Fin:</strong> {convention.endDate}</p>
          </div>
        </div>

        {/* Duration Card */}
        <div className="card-soft border border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Durée</h3>
          <p className="text-2xl font-bold text-primary">{convention.duration}</p>
          <p className="text-xs text-muted-foreground">semaines</p>
        </div>
      </div>

      {/* Details */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Informations Détaillées</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Entreprise</label>
              <p className="text-foreground">{convention.company}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Superviseur</label>
              <p className="text-foreground">{convention.supervisor}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contact Superviseur</label>
              <p className="text-foreground">{convention.supervisorContact}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Lieu du Stage</label>
              <p className="text-foreground">{convention.location}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description du Poste</label>
            <p className="text-foreground bg-muted rounded-lg p-3">{convention.jobDescription}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Objectifs du Stage</label>
            <p className="text-foreground bg-muted rounded-lg p-3">{convention.objectives}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-medium text-foreground">Convention_Stage_2024.pdf</p>
                <p className="text-xs text-muted-foreground">Uploaded on {convention.uploadedDate}</p>
              </div>
            </div>
            <button className="btn-secondary text-sm">Télécharger</button>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="card-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Étudiant</p>
            <div className="h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground">
              {convention.studentSigned ? '✓ Signé' : 'En attente'}
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Entreprise</p>
            <div className="h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground">
              {convention.companySigned ? '✓ Signé' : 'En attente'}
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">Établissement</p>
            <div className="h-20 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground">
              {convention.schoolSigned ? '✓ Signé' : 'En attente'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
