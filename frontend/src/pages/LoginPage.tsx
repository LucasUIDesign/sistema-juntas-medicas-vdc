import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  UserIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

// Validation schema
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  password: Yup.string()
    .required('La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect path from location state or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
  };

  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('¡Bienvenido al sistema!', {
        icon: '✅',
      });
      
      // Get the user after login to determine redirect
      const storedUser = localStorage.getItem('vdc_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const dashboardRoute = authService.getDashboardRoute(userData.role);
        navigate(from || dashboardRoute, { replace: true });
      }
    } catch (error) {
      toast.error('Credenciales inválidas. Por favor, verifica tus datos.', {
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Funcionalidad de recuperación de contraseña próximamente.', {
      icon: 'ℹ️',
    });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white rounded-card shadow-card p-card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-title font-bold text-gray-900 mb-2">
              Acceso al Sistema de Gestión de Juntas Médicas
            </h1>
            <p className="text-vdc-secondary text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6" noValidate>
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon 
                        className={`h-5 w-5 ${
                          errors.email && touched.email 
                            ? 'text-vdc-error' 
                            : 'text-vdc-secondary'
                        }`} 
                        aria-hidden="true" 
                      />
                    </div>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                      className={`block w-full pl-10 pr-4 py-3 border rounded-card text-body transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                        errors.email && touched.email
                          ? 'border-vdc-error focus:border-vdc-error'
                          : 'border-gray-300 focus:border-vdc-primary'
                      }`}
                    />
                  </div>
                  <ErrorMessage name="email">
                    {(msg) => (
                      <p id="email-error" className="mt-1 text-sm text-vdc-error" role="alert">
                        {msg}
                      </p>
                    )}
                  </ErrorMessage>
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon 
                        className={`h-5 w-5 ${
                          errors.password && touched.password 
                            ? 'text-vdc-error' 
                            : 'text-vdc-secondary'
                        }`} 
                        aria-hidden="true" 
                      />
                    </div>
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
                      className={`block w-full pl-10 pr-12 py-3 border rounded-card text-body transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                        errors.password && touched.password
                          ? 'border-vdc-error focus:border-vdc-error'
                          : 'border-gray-300 focus:border-vdc-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-vdc-secondary hover:text-vdc-primary transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password">
                    {(msg) => (
                      <p id="password-error" className="mt-1 text-sm text-vdc-error" role="alert">
                        {msg}
                      </p>
                    )}
                  </ErrorMessage>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-vdc-primary hover:text-vdc-primary/80 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={`w-full flex items-center justify-center py-3 px-4 rounded-card text-white font-medium transition-colors ${
                    isSubmitting
                      ? 'bg-vdc-primary/70 cursor-not-allowed'
                      : 'bg-vdc-primary hover:bg-vdc-primary/90'
                  }`}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </motion.button>
              </Form>
            )}
          </Formik>

          {/* Demo Credentials Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-vdc-secondary text-center mb-3">
              Credenciales de demostración:
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex flex-col sm:flex-row sm:justify-between bg-vdc-bg rounded p-2 gap-1">
                <span>Médico Junior:</span>
                <span className="font-mono text-[10px] sm:text-xs break-all">medico.junior@vdc-demo.com</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between bg-vdc-bg rounded p-2 gap-1">
                <span>Médico Senior:</span>
                <span className="font-mono text-[10px] sm:text-xs break-all">medico.senior@vdc-demo.com</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between bg-vdc-bg rounded p-2 gap-1">
                <span>RRHH:</span>
                <span className="font-mono text-[10px] sm:text-xs break-all">rrhh@vdc-demo.com</span>
              </div>
              <p className="text-center text-vdc-secondary mt-2">
                Contraseña: <span className="font-mono">Demo2025!</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
