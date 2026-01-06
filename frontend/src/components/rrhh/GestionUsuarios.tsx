import { motion } from 'framer-motion';
import {
  UsersIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const GestionUsuarios = () => {
  // Mock users for display
  const mockUsers = [
    { id: 'user-001', nombre: 'Dr. Carlos Mendoza', email: 'medico.junior@vdc-demo.com', role: 'MEDICO_INFERIOR', activo: true },
    { id: 'user-002', nombre: 'Dra. María González', email: 'medico.senior@vdc-demo.com', role: 'MEDICO_SUPERIOR', activo: true },
    { id: 'user-003', nombre: 'Ana Rodríguez', email: 'rrhh@vdc-demo.com', role: 'RRHH', activo: true },
  ];

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      MEDICO_INFERIOR: 'bg-blue-100 text-blue-800',
      MEDICO_SUPERIOR: 'bg-purple-100 text-purple-800',
      RRHH: 'bg-green-100 text-green-800',
    };
    
    const labels: Record<string, string> = {
      MEDICO_INFERIOR: 'Médico Evaluador',
      MEDICO_SUPERIOR: 'Médico Evaluador',
      RRHH: 'RRHH',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-subtitle font-semibold text-vdc-primary">
            Gestionar Usuarios
          </h2>
          <p className="text-vdc-secondary text-sm mt-1">
            Administración de usuarios del sistema
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors cursor-not-allowed opacity-70"
          disabled
        >
          <UserPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Nuevo Usuario (Próximamente)
        </motion.button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-card p-4 mb-6">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> La gestión completa de usuarios se realiza a través de AWS Cognito. 
              Esta vista muestra los usuarios registrados en el sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-vdc-bg">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Usuario
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-vdc-row-alt'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-vdc-primary/10 rounded-full flex items-center justify-center mr-3">
                        <UsersIcon className="w-4 h-4 text-vdc-primary" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default GestionUsuarios;
