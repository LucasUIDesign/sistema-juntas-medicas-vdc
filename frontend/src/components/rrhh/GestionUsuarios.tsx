import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  UsersIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Validation schema
const createUserSchema = Yup.object({
  nombre: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .required('El nombre es requerido'),
  apellido: Yup.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .required('El apellido es requerido'),
  username: Yup.string()
    .min(4, 'El nombre de usuario debe tener mínimo 4 caracteres')
    .required('Nombre de usuario requerido'),
  email: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  password: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es requerida'),
  role: Yup.string()
    .required('El rol es requerido'),
});

const editCredentialsSchema = Yup.object({
  username: Yup.string()
    .min(4, 'El nombre de usuario debe tener mínimo 4 caracteres')
    .required('Nombre de usuario requerido'),
  password: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .optional(),
});

const ROLES = [
  { value: 'MEDICO_EVALUADOR', label: 'Médico Evaluador' },
  { value: 'DIRECTOR_MEDICO', label: 'Director Médico' },
  { value: 'GERENCIAL', label: 'Gerencial' },
  { value: 'RRHH', label: 'RRHH' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  username?: string;
  role: string;
  activo: boolean;
}

const GestionUsuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);

  // Load users on component mount
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
      // console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (values: any, { resetForm }: any) => {
    try {
      const token = localStorage.getItem('vdc_token');
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: values.nombre,
          apellido: values.apellido,
          username: values.username,
          email: values.email,
          role: values.role,
          password: values.password,
        }),
      });

      if (response.ok) {
        toast.success('Usuario creado exitosamente. Puede iniciar sesión con sus credenciales.', {
          icon: '✅',
        });
        resetForm();
        setShowForm(false);
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.details?.email || error.details?.password || error.message || 'Error al crear el usuario', { icon: '❌' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el usuario', { icon: '❌' });
    }
  };

  const handleEditCredentials = async (values: any, { setSubmitting }: any) => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('vdc_token');
      const updateData: any = {
        username: values.username,
      };

      // Solo incluir contraseña si se proporcionó una nueva
      if (values.password && values.password.trim() !== '') {
        updateData.password = values.password;
      }

      const response = await fetch(`${API_URL}/users/${selectedUser.id}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Credenciales actualizadas correctamente', { icon: '✅' });
        setShowEditModal(false);
        setSelectedUser(null);
        setShowPasswordInModal(false);
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar las credenciales', { icon: '❌' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar las credenciales', { icon: '❌' });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setShowPasswordInModal(false);
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      MEDICO_EVALUADOR: 'bg-blue-100 text-blue-800',
      DIRECTOR_MEDICO: 'bg-purple-100 text-purple-800',
      GERENCIAL: 'bg-yellow-100 text-yellow-800',
      RRHH: 'bg-green-100 text-green-800',
      ADMINISTRATIVO: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      MEDICO_EVALUADOR: 'Médico Evaluador',
      DIRECTOR_MEDICO: 'Director Médico',
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
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </motion.button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-card shadow-card p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>

          <Formik
            initialValues={{
              nombre: '',
              apellido: '',
              username: '',
              email: '',
              password: '',
              role: '',
            }}
            validationSchema={createUserSchema}
            onSubmit={handleCreateUser}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <Field
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan"
                      className={`w-full px-3 py-2 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                        errors.nombre && touched.nombre
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    <ErrorMessage name="nombre">
                      {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                    </ErrorMessage>
                  </div>

                  {/* Apellido */}
                  <div>
                    <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <Field
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Pérez"
                      className={`w-full px-3 py-2 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                        errors.apellido && touched.apellido
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    <ErrorMessage name="apellido">
                      {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                    </ErrorMessage>
                  </div>
                </div>

                {/* Nombre de Usuario */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <Field
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="off"
                    placeholder="juan_perez"
                    className={`w-full px-3 py-2 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                      errors.username && touched.username
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <ErrorMessage name="username">
                    {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                  </ErrorMessage>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder="juan.perez@ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                      errors.email && touched.email
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <ErrorMessage name="email">
                    {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                  </ErrorMessage>
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full px-3 py-2 pr-10 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                        errors.password && touched.password
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
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
                    {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                  </ErrorMessage>
                </div>

                {/* Rol */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <Field
                    id="role"
                    name="role"
                    as="select"
                    className={`w-full px-3 py-2 border rounded-card text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                      errors.role && touched.role
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona un rol</option>
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="role">
                    {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                  </ErrorMessage>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors disabled:opacity-70 font-medium"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-card hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </motion.div>
      )}

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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-vdc-primary hover:text-vdc-primary/80 hover:bg-vdc-primary/10 rounded-lg transition-colors"
                        title="Editar credenciales"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                        Editar
                      </button>
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
            {isLoading ? 'Cargando usuarios...' : 'No hay usuarios registrados aún'}
          </p>
        </div>
      )}

      {/* Edit Credentials Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                setShowPasswordInModal(false);
              }}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Editar Credenciales
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setShowPasswordInModal(false);
                    }}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Usuario:</span> {selectedUser.nombre} {selectedUser.apellido}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Email:</span> {selectedUser.email}
                  </p>
                </div>

                <Formik
                  initialValues={{
                    username: selectedUser.username || '',
                    password: '',
                  }}
                  validationSchema={editCredentialsSchema}
                  onSubmit={handleEditCredentials}
                >
                  {({ errors, touched, isSubmitting }) => (
                    <Form className="space-y-4">
                      {/* Nombre de Usuario */}
                      <div>
                        <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de Usuario
                        </label>
                        <Field
                          id="edit-username"
                          name="username"
                          type="text"
                          placeholder="Nombre de usuario"
                          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                            errors.username && touched.username
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        <ErrorMessage name="username">
                          {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                        </ErrorMessage>
                      </div>

                      {/* Nueva Contraseña */}
                      <div>
                        <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Nueva Contraseña
                        </label>
                        <div className="relative">
                          <Field
                            id="edit-password"
                            name="password"
                            type={showPasswordInModal ? 'text' : 'password'}
                            placeholder="Dejar vacío para no cambiar"
                            className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                              errors.password && touched.password
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label={showPasswordInModal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPasswordInModal ? (
                              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <EyeIcon className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                        <ErrorMessage name="password">
                          {(msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>}
                        </ErrorMessage>
                        <p className="mt-1 text-xs text-gray-500">
                          Dejar vacío si no desea cambiar la contraseña
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors disabled:opacity-70 font-medium"
                        >
                          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(false);
                            setSelectedUser(null);
                            setShowPasswordInModal(false);
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default GestionUsuarios;
