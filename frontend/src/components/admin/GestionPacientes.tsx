import { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  numeroDocumento: string;
  correo: string | null;
  telefono: string | null;
  domicilio: string | null;
}

interface PacienteForm {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  correo: string;
  telefono: string;
  domicilio: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const GestionPacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<PacienteForm>({
    nombre: '',
    apellido: '',
    numeroDocumento: '',
    correo: '',
    telefono: '',
    domicilio: '',
  });

  const getToken = () => {
    return localStorage.getItem('vdc_token');
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchPacientes(searchTerm);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const fetchPacientes = async (search = '') => {
    try {
      const token = getToken();
      const url = search
        ? `${API_URL}/pacientes?search=${encodeURIComponent(search)}`
        : `${API_URL}/pacientes`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data);
      }
    } catch (error) {
      console.error('Error fetching pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (paciente?: Paciente) => {
    if (paciente) {
      setEditingPaciente(paciente);
      setFormData({
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        numeroDocumento: paciente.numeroDocumento,
        correo: paciente.correo || '',
        telefono: paciente.telefono || '',
        domicilio: paciente.domicilio || '',
      });
    } else {
      setEditingPaciente(null);
      setFormData({
        nombre: '',
        apellido: '',
        numeroDocumento: '',
        correo: '',
        telefono: '',
        domicilio: '',
      });
    }
    setShowModal(true);
    setMessage(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaciente(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = getToken();
      const url = editingPaciente
        ? `${API_URL}/pacientes/${editingPaciente.id}`
        : `${API_URL}/pacientes`;

      const response = await fetch(url, {
        method: editingPaciente ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingPaciente ? 'Paciente actualizado correctamente' : 'Paciente creado correctamente'
        });
        fetchPacientes(searchTerm);
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        const errorMsg = data.details
          ? Object.values(data.details).join(', ')
          : data.message || 'Error al guardar el paciente';
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/pacientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPacientes(searchTerm);
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting paciente:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Pacientes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra los pacientes registrados en el sistema
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Agregar Paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, apellido o documento..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vdc-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando pacientes...</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-vdc-primary hover:underline"
              >
                Agregar el primer paciente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domicilio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-vdc-primary/10 flex items-center justify-center">
                          <span className="text-vdc-primary font-medium">
                            {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {paciente.apellido}, {paciente.nombre}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{paciente.numeroDocumento}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{paciente.correo || '-'}</div>
                      <div className="text-sm text-gray-500">{paciente.telefono || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {paciente.domicilio || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(paciente)}
                        className="text-vdc-primary hover:text-vdc-primary/80 mr-3"
                        title="Editar"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(paciente.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>

            <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPaciente ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                  )}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domicilio
                  </label>
                  <input
                    type="text"
                    value={formData.domicilio}
                    onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : (editingPaciente ? 'Actualizar' : 'Crear Paciente')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(null)}></div>

            <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPacientes;
