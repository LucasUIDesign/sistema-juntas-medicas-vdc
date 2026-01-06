import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import JuntaForm from '../components/juntas/JuntaForm';
import MisJuntas from '../components/juntas/MisJuntas';
import PerfilMedico from '../components/medico/PerfilMedico';
import ProximasJuntas from '../components/juntas/ProximasJuntas';
import { 
  PlusCircleIcon, 
  ClipboardDocumentListIcon, 
  UserCircleIcon,
  Bars3Icon 
} from '@heroicons/react/24/outline';

const sidebarLinks = [
  {
    name: 'Cargar Nueva Junta',
    href: '/dashboard/medico/nueva-junta',
    icon: <PlusCircleIcon className="h-5 w-5" />,
  },
  {
    name: 'Mis Juntas',
    href: '/dashboard/medico/mis-juntas',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
  {
    name: 'Perfil',
    href: '/dashboard/medico/perfil',
    icon: <UserCircleIcon className="h-5 w-5" />,
  },
];

const DashboardMedico = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Mostrar cards solo en la página de nueva junta
  const showProximasJuntas = location.pathname.includes('nueva-junta');

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <Sidebar
        links={sidebarLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Panel Médico"
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center text-vdc-secondary hover:text-vdc-primary transition-colors"
            aria-label="Abrir menú lateral"
          >
            <Bars3Icon className="h-6 w-6 mr-2" aria-hidden="true" />
            <span className="font-medium">Menú</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          <Breadcrumbs />
          
          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-subtitle font-semibold text-gray-900">
              Bienvenido, {user?.nombre}
            </h1>
            <p className="text-vdc-secondary text-sm mt-1">
              {user?.role === 'MEDICO_SUPERIOR' 
                ? 'Médico Evaluador - Acceso completo a funcionalidades'
                : 'Médico Evaluador - Gestión de juntas médicas'}
            </p>
          </div>

          {/* Layout con cards a la derecha */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Contenido principal */}
            <div className={showProximasJuntas ? 'flex-1 lg:w-2/3' : 'w-full'}>
              <Routes>
                <Route index element={<Navigate to="nueva-junta" replace />} />
                <Route path="nueva-junta" element={<JuntaForm />} />
                <Route path="mis-juntas" element={<MisJuntas />} />
                <Route path="perfil" element={<PerfilMedico />} />
              </Routes>
            </div>

            {/* Cards de próximas juntas - Solo en nueva-junta */}
            {showProximasJuntas && (
              <div className="lg:w-1/3">
                <ProximasJuntas />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMedico;
