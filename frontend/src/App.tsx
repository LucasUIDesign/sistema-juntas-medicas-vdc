import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LoginPage from './pages/LoginPage';
import DashboardMedico from './pages/DashboardMedico';
import DashboardMedicoEvaluador from './pages/DashboardMedicoEvaluador';
import DashboardDirectorMedico from './pages/DashboardDirectorMedico';
import DashboardRRHH from './pages/DashboardRRHH';
import DashboardGerencial from './pages/DashboardGerencial';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardAdministrativo from './pages/DashboardAdministrativo';
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

          {/* Protected routes - Médico Evaluador */}
          <Route
            path="/dashboard/medico-evaluador/*"
            element={
              <ProtectedRoute allowedRoles={['MEDICO_EVALUADOR']}>
                <DashboardMedicoEvaluador />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Director Médico */}
          <Route
            path="/dashboard/director-medico/*"
            element={
              <ProtectedRoute allowedRoles={['DIRECTOR_MEDICO']}>
                <DashboardDirectorMedico />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Médico (legacy) */}
          <Route
            path="/dashboard/medico/*"
            element={
              <ProtectedRoute allowedRoles={['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO']}>
                <DashboardMedico />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - RRHH */}
          <Route
            path="/dashboard/rrhh/*"
            element={
              <ProtectedRoute allowedRoles={['RRHH']}>
                <DashboardRRHH />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Gerencial */}
          <Route
            path="/dashboard/gerencial/*"
            element={
              <ProtectedRoute allowedRoles={['GERENCIAL']}>
                <DashboardGerencial />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Administrativo */}
          <Route
            path="/dashboard/administrativo/*"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRATIVO']}>
                <DashboardAdministrativo />
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
