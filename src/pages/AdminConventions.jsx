import { useState } from 'react'
import conventionsData from '../data/conventions.json'

export default function AdminConventions() {
  const [conventions, setConventions] = useState(conventionsData.conventions)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedConvention, setSelectedConvention] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const filteredConventions = filterStatus === 'all'
    ? conventions
    : conventions.filter(c => c.status === filterStatus)

  const handleValidate = (convId) => {
    setConventions(conventions.map(c =>
      c.id === convId ? { ...c, status: 'validee', validatedAt: new Date().toISOString().split('T')[0] } : c
    ))
  }

  const handleReject = (convId) => {
    if (!rejectionReason) return
    
    setConventions(conventions.map(c =>
      c.id === convId ? { ...c, status: 'rejetee', rejectionReason, rejectedAt: new Date().toISOString().split('T')[0] } : c
    ))
    
    setRejectionReason('')
    setSelectedConvention(null)
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

  const getStatusLabel = (status) => {
    const labels = {
      en_attente: 'En Attente',
      validee: 'Validée',
      rejetee: 'Rejetée',
      signee: 'Signée'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="card-soft">
        <h2 className="text-2xl font-bold text-foreground">Gestion des Conventions</h2>
        <p className="text-muted-foreground mt-1">Validez et gérez les conventions de stage</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Total</p>
          <p className="text-3xl font-bold text-primary">{conventions.length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">En Attente</p>
          <p className="text-3xl font-bold text-accent">{conventions.filter(c => c.status === 'en_attente').length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Validées</p>
          <p className="text-3xl font-bold text-success">{conventions.filter(c => c.status === 'validee').length}</p>
        </div>
        <div className="card-soft border border-border">
          <p className="text-sm text-muted-foreground mb-2">Rejetées</p>
          <p className="text-3xl font-bold text-primary">{conventions.filter(c => c.status === 'rejetee').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilterStatus('en_attente')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'en_attente'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          En Attente
        </button>
        <button
          onClick={() => setFilterStatus('validee')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'validee'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Validées
        </button>
        <button
          onClick={() => setFilterStatus('rejetee')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'rejetee'
              ? 'bg-primary text-white'
              : 'bg-muted text-foreground hover:bg-border'
          }`}
        >
          Rejetées
        </button>
      </div>

      {/* Conventions List */}
      <div className="space-y-3">
        {filteredConventions.map((convention) => (
          <div key={convention.id} className="card-soft border border-border hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{convention.studentName}</h4>
                <p className="text-sm text-muted-foreground">
                  {convention.company} • {convention.location}
                </p>
              </div>
              <span className={`${getStatusBadge(convention.status)}`}>
                {getStatusLabel(convention.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
              <div>
                <p className="text-muted-foreground">Début</p>
                <p className="font-medium text-foreground">{convention.startDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fin</p>
                <p className="font-medium text-foreground">{convention.endDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Durée</p>
                <p className="font-medium text-foreground">{convention.duration} sem.</p>
              </div>
              <div>
                <p className="text-muted-foreground">Superviseur</p>
                <p className="font-medium text-foreground">{convention.supervisor}</p>
              </div>
            </div>

            {convention.status === 'en_attente' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleValidate(convention.id)}
                  className="flex-1 btn-primary text-sm"
                >
                  Valider
                </button>
                <button
                  onClick={() => setSelectedConvention(convention)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Rejeter
                </button>
              </div>
            )}

            {convention.status === 'rejetee' && convention.rejectionReason && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-900 font-medium mb-1">Raison du Rejet</p>
                <p className="text-sm text-red-800">{convention.rejectionReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {selectedConvention && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Rejeter la convention de {selectedConvention.studentName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raison du rejet
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-soft resize-none"
                  rows="4"
                  placeholder="Expliquez les raisons du rejet..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedConvention(null)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReject(selectedConvention.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Confirmer Rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
