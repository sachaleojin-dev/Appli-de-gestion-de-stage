import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UserProfileProvider } from './context/UserProfileContext'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UserProfile from './pages/UserProfile'
import StudentConvention from './pages/StudentConvention'
import StudentEvaluations from './pages/StudentEvaluations'
import CompanyCandidates from './pages/CompanyCandidates'
import AdminReports from './pages/AdminReports'
import AdminConventions from './pages/AdminConventions'
import StudentProfileView from './pages/StudentProfileView'
import ApplicationTracking from './pages/ApplicationTracking'
import ProtectedRoute from './components/ProtectedRoute'

function AppContent() {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          role === 'etudiant' ? <StudentDashboard /> :
          role === 'entreprise' ? <CompanyDashboard /> :
          <AdminDashboard />
        } />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/student/:studentId" element={<StudentProfileView />} />
        <Route path="/application/:applicationId" element={role === 'etudiant' ? <ApplicationTracking /> : <Navigate to="/" />} />
        <Route path="/convention" element={role === 'etudiant' ? <StudentConvention /> : <Navigate to="/" />} />
        <Route path="/evaluations" element={role === 'etudiant' ? <StudentEvaluations /> : <Navigate to="/" />} />
        <Route path="/candidates" element={role === 'entreprise' ? <CompanyCandidates /> : <Navigate to="/" />} />
        <Route path="/reports" element={role === 'admin' ? <AdminReports /> : <Navigate to="/" />} />
        <Route path="/conventions" element={role === 'admin' ? <AdminConventions /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProfileProvider>
          <AppContent />
        </UserProfileProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
