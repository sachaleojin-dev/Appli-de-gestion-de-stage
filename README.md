# Gestion de Stage

Application React + Vite pour la gestion des stages avec des dashboards spécifiques par rôle (Étudiant, Entreprise, Admin).

## Caractéristiques

- 🎓 **Tableau de bord Étudiant**: Parcourir les offres, postuler, suivre les candidatures
- 🏢 **Tableau de bord Entreprise**: Publier des offres, gérer les candidatures, évaluer les étudiants
- 🏫 **Tableau de bord Admin**: Valider les conventions, noter les rapports, voir les statistiques
- 📱 **Design Responsive**: Mobile-first, optimisé pour tous les appareils
- 🎨 **Palette Pastel**: Couleurs douces et modernes
- 💾 **Données Mockées**: Toutes les données en JSON local

## Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   ├── OfferCard.jsx
│   ├── ApplicationsList.jsx
│   ├── ReportUpload.jsx
│   ├── OfferManagement.jsx
│   ├── ApplicationsReview.jsx
│   ├── EvaluationForm.jsx
│   ├── ConventionsList.jsx
│   ├── ReportsList.jsx
│   └── Statistics.jsx
├── pages/              # Pages principales
│   ├── StudentDashboard.jsx
│   ├── CompanyDashboard.jsx
│   └── AdminDashboard.jsx
├── layouts/           # Mises en page
│   └── Layout.jsx
├── data/              # Données mockées JSON
│   ├── users.json
│   ├── offres.json
│   ├── candidatures.json
│   ├── conventions.json
│   ├── rapports.json
│   └── evaluations.json
├── App.jsx
├── main.jsx
└── index.css
```

## Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Lancer le serveur de développement**
```bash
npm run dev
```

3. **Accéder à l'application**
Ouvrez votre navigateur et allez à `http://localhost:3000`

## Utilisation

### Sélectionner un Rôle
Utilisez le sélecteur dans la sidebar pour basculer entre les rôles:
- **Étudiant** (🎓): Consultez les offres et gérez vos candidatures
- **Entreprise** (🏢): Publiez des offres et recrutez
- **Admin** (🏫): Validez les conventions et gérez les rapports

### Étudiant
- Consultez les offres de stage disponibles
- Postulez en cliquant sur "Postuler"
- Suivez l'état de vos candidatures
- Uploadez votre rapport de stage

### Entreprise
- Visualisez vos offres de stage publiées
- Créez une nouvelle offre via le formulaire
- Acceptez ou refusez les candidatures
- Évaluez les étudiants avec une note et des commentaires

### Admin
- Validez les conventions de stage
- Notez les rapports soumis (0-20)
- Consultez les statistiques globales
- Visualisez les meilleures évaluations

## Développement

### Structure des Données

Les données sont stockées dans `/src/data/*.json`:
- `users.json`: Utilisateurs par rôle
- `offres.json`: Offres de stage disponibles
- `candidatures.json`: Candidatures des étudiants
- `conventions.json`: Conventions signées
- `rapports.json`: Rapports de stage
- `evaluations.json`: Évaluations des étudiants

### État Local
L'application gère l'état avec React hooks (`useState`). Les modifications restent en mémoire et réinitialisent au rechargement de la page.

### Styles
L'application utilise TailwindCSS avec une palette de couleurs pastel:
- Primaire: `#e8a8b0` (Powder Blush)
- Secondaire: `#d4c5bb` (Almond Silk)
- Accent: `#f5c5a8` (Peach Glow)
- Succès: `#a8d4c5` (Soft Blush)
- Arrière-plan: `#faf8f6`

## Construction pour la Production

```bash
npm build
```

Cela crée un dossier `dist/` prêt pour le déploiement.

## Technologies Utilisées

- **React 18** - Bibliothèque UI
- **Vite** - Outil de build rapide
- **React Router** - Navigation
- **TailwindCSS** - Styles CSS
- **JavaScript/JSX** - Langage de programmation

## Prochaines Étapes pour la Production

1. **Connecter un Backend API**
   - Remplacer les données mockées par des appels API
   - Implémenter l'authentification

2. **Ajouter une Base de Données**
   - Utiliser Supabase, Firebase, ou autre solution
   - Ajouter la persistance des données

3. **Ajouter l'Authentification**
   - Implémenter la connexion/inscription
   - Ajouter les protections d'accès par rôle

4. **Tests et Déploiement**
   - Écrire des tests unitaires
   - Déployer sur Vercel ou autre plateforme
