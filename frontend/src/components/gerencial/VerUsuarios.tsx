import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersIcon } from '@heroicons/react/24/outline';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  activo: boolean;
}

const VerUsuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('vdc_token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      MEDICO_EVALUADOR: 'bg-blue-100 text-blue-800',
      DIRECTOR_MEDICO: 'bg-purple-100 text-purple-800',
      GERENCIAL: 'bg-yellow-100 text-yellow-800',
      RRHH: 'bg-green-100 text-green-800',
      ADMINISTRATIVO: 'bg-gray-100 text-gray-800',
      ADMIN: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      MEDICO_EVALUADOR: 'Medico Evaluador',
      DIRECTOR_MEDICO: 'Director Medico',
      GERENCIAL: 'Gerencial',
      RRHH: 'RRHH',
      ADMINISTRATIVO: 'Administrativo',
      ADMIN: 'Admin',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
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
      <div className="mb-6">
        <h2 className="text-subtitle font-semibold text-vdc-primary">
          Usuarios del Sistema
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Lista de usuarios registrados en el sistema
        </p>
      </div>

      {/* Users Table */}
      {!isLoading && users.length > 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => (
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
                        <span className="text-sm font-medium text-gray-900">
                          {user.nombre} {user.apellido}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card p-8 text-center">
          <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500">
            {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados'}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default VerUsuarios;
