import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import JuntaForm from '../components/juntas/JuntaForm';
import MisJuntas from '../components/juntas/MisJuntas';
import PerfilMedico from '../components/medico/PerfilMedico';
import ProximasJuntas from '../components/juntas/ProximasJuntas';
import Baremos from '../components/medico/Baremos';
import {
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  BookOpenIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const sidebarLinks = [
  {
    name: 'Cargar Junta',
    href: '/dashboard/medico-evaluador/nueva-junta',
    icon: <PlusCircleIcon className="h-5 w-5" />,
  },
  {
    name: 'Todas Mis Juntas',
    href: '/dashboard/medico-evaluador/mis-juntas',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
  {
    name: 'Baremos',
    href: '/dashboard/medico-evaluador/baremos',
    icon: <BookOpenIcon className="h-5 w-5" />,
  },
  {
    name: 'Perfil',
    href: '/dashboard/medico-evaluador/perfil',
    icon: <UserCircleIcon className="h-5 w-5" />,
  },
];

const DashboardMedicoEvaluador = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const showProximasJuntas = location.pathname.includes('nueva-junta');

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <Sidebar
        links={sidebarLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Panel - Médico Evaluador"
      />

      <div className="flex-1 lg:ml-64">
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

        <div className="p-4 lg:p-8">
          <Breadcrumbs />

          <div className="mb-6">
            <h1 className="text-subtitle font-semibold text-gray-900">
              Bienvenido, {user?.nombre}
            </h1>
            <p className="text-vdc-secondary text-sm mt-1">
              Médico Evaluador - Gestión de juntas médicas
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className={showProximasJuntas ? 'flex-1 lg:w-2/3' : 'w-full'}>
              <Routes>
                <Route index element={<Navigate to="nueva-junta" replace />} />
                <Route path="nueva-junta" element={<JuntaForm />} />
                <Route path="mis-juntas" element={<MisJuntas />} />
                <Route path="baremos" element={<Baremos />} />
                <Route path="perfil" element={<PerfilMedico />} />
              </Routes>
            </div>

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

export default DashboardMedicoEvaluador;
