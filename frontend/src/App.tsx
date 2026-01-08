import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import DashboardMedico from './pages/DashboardMedico';
import DashboardRRHH from './pages/DashboardRRHH';
import DashboardAdmin from './pages/DashboardAdmin';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { authService } from './services/authService';

function App() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vdc-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Determine home redirect based on auth state
  const getHomeRedirect = () => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={authService.getDashboardRoute(user.role)} replace />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-vdc-bg">
      <Header />
      
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={authService.getDashboardRoute(user!.role)} replace />
              ) : (
                <LoginPage />
              )
            } 
          />

          {/* Protected routes - Médicos */}
          <Route
            path="/dashboard/medico/*"
            element={
              <ProtectedRoute allowedRoles={['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO']}>
                <DashboardMedico />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - RRHH, Gerencial */}
          <Route
            path="/dashboard/rrhh/*"
            element={
              <ProtectedRoute allowedRoles={['RRHH', 'GERENCIAL']}>
                <DashboardRRHH />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Admin */}
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          {/* Home redirect */}
          <Route path="/" element={getHomeRedirect()} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
