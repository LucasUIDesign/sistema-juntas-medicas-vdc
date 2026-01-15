import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import AsignarTurnos from '../components/admin/AsignarTurnos';
import TodasJuntas from '../components/rrhh/TodasJuntas';
import GestionUsuarios from '../components/rrhh/GestionUsuarios';
import PerfilAdmin from '../components/admin/PerfilAdmin';
import GestionPacientes from '../components/admin/GestionPacientes';
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  UserGroupIcon,
  UserCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const sidebarLinks = [
  {
    name: 'Asignar Turnos',
    href: '/dashboard/admin/asignar-turnos',
    icon: <CalendarDaysIcon className="h-5 w-5" />,
  },
  {
    name: 'Todas las Juntas',
    href: '/dashboard/admin/todas-juntas',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
  {
    name: 'Pacientes',
    href: '/dashboard/admin/pacientes',
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    name: 'Gestionar Usuarios',
    href: '/dashboard/admin/usuarios',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    name: 'Mi Perfil',
    href: '/dashboard/admin/perfil',
    icon: <UserCircleIcon className="h-5 w-5" />,
  },
];

const DashboardAdmin = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <Sidebar
        links={sidebarLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Panel Admin"
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
              Administrador - Control total del sistema
            </p>
          </div>

          {/* Routes */}
          <Routes>
            <Route index element={<Navigate to="asignar-turnos" replace />} />
            <Route path="asignar-turnos" element={<AsignarTurnos />} />
            <Route path="todas-juntas" element={<TodasJuntas />} />
            <Route path="pacientes" element={<GestionPacientes />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
            <Route path="perfil" element={<PerfilAdmin />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
