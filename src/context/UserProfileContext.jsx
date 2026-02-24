import React, { createContext, useContext, useState } from 'react'

const UserProfileContext = createContext()

export function UserProfileProvider({ children }) {
  const [userProfiles, setUserProfiles] = useState({
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
      cvUrl: 'https://example.com/techcorp-profile.pdf',
      github: 'https://github.com/techcorp',
      linkedin: 'https://linkedin.com/company/techcorp',
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
      bio: 'Responsable de la coordination des stages au sein de l\'établissement',
      cvUrl: null,
      github: null,
      linkedin: null
    }
  })

  const getUserProfile = (userId) => {
    return userProfiles[userId]
  }

  const updateUserProfile = (userId, updates) => {
    setUserProfiles(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        ...updates
      }
    }))
  }

  const addRating = (userId, rating) => {
    const user = userProfiles[userId]
    if (!user) return

    const updatedRatings = [...(user.ratings || []), rating]
    const newAverage = updatedRatings.reduce((sum, r) => sum + r.rating, 0) / updatedRatings.length

    updateUserProfile(userId, {
      ratings: updatedRatings,
      averageRating: Number(newAverage.toFixed(2))
    })
  }

  return (
    <UserProfileContext.Provider value={{ userProfiles, getUserProfile, updateUserProfile, addRating }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  return useContext(UserProfileContext)
}
