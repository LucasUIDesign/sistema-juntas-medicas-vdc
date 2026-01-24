import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import TodasJuntas from '../components/rrhh/TodasJuntas';
import GestionPacientes from '../components/admin/GestionPacientes';
import VerUsuarios from '../components/gerencial/VerUsuarios';
import PerfilAdmin from '../components/admin/PerfilAdmin';
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  UsersIcon,
  UserCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const sidebarLinks = [
  {
    name: 'Todas las Juntas',
    href: '/dashboard/gerencial/juntas',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
  {
    name: 'Pacientes',
    href: '/dashboard/gerencial/pacientes',
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    name: 'Usuarios',
    href: '/dashboard/gerencial/usuarios',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    name: 'Mi Perfil',
    href: '/dashboard/gerencial/perfil',
    icon: <UserCircleIcon className="h-5 w-5" />,
  },
];

const DashboardGerencial = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <Sidebar
        links={sidebarLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Panel - Gerencial"
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
              Bienvenido, Gerencial
            </h1>
            <p className="text-vdc-secondary text-sm mt-1">
              Panel de control y reportes
            </p>
          </div>

          <div className="w-full">
            <Routes>
              <Route index element={<Navigate to="juntas" replace />} />
              <Route path="juntas" element={<TodasJuntas />} />
              <Route path="pacientes" element={<GestionPacientes />} />
              <Route path="usuarios" element={<VerUsuarios />} />
              <Route path="perfil" element={<PerfilAdmin />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGerencial;
