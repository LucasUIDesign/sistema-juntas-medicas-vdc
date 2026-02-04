import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  IdentificationIcon,
  AcademicCapIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  medicoNombre?: string;
  medicoId?: string;
  lugar?: string;
  observaciones?: string;
  estado: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const TodasTurnosAsignados = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([]);

  const getToken = () => localStorage.getItem('vdc_token');

  useEffect(() => {
    loadTurnos();
  }, []);

  useEffect(() => {
    // Filtrar turnos por búsqueda
    if (searchTerm.trim() === '') {
      setFilteredTurnos(turnos);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = turnos.filter(
        (turno) =>
          turno.pacienteNombre.toLowerCase().includes(search) ||
          turno.pacienteDni.includes(search) ||
          turno.medicoNombre?.toLowerCase().includes(search) ||
          turno.hora.includes(search)
      );
      setFilteredTurnos(filtered);
    }
  }, [searchTerm, turnos]);

  const loadTurnos = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/turnos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Ordenar por fecha descendente (más recientes primero)
        const sortedData = data.sort((a: Turno, b: Turno) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        setTurnos(sortedData);
        setFilteredTurnos(sortedData);
      } else {
        toast.error('Error al cargar los turnos');
      }
    } catch (error) {
      console.error('Error loading turnos:', error);
      toast.error('Error al cargar los turnos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTurno = async (turnoId: string) => {
    if (!confirm('¿Está seguro de eliminar este turno?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/turnos/${turnoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Turno eliminado correctamente');
        await loadTurnos();
      } else {
        toast.error('Error al eliminar el turno');
      }
    } catch (error) {
      console.error('Error deleting turno:', error);
      toast.error('Error al eliminar el turno');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      COMPLETADO: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
      CANCELADO: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
    };

    const badge = badges[estado] || badges.PENDIENTE;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Todas las Juntas Asignadas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Historial completo de turnos asignados a médicos evaluadores
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por paciente, DNI, médico o hora..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Turnos</p>
              <p className="text-2xl font-bold text-gray-900">{turnos.length}</p>
            </div>
            <CalendarDaysIcon className="h-10 w-10 text-vdc-primary opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {turnos.filter((t) => t.estado === 'PENDIENTE').length}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-green-600">
                {turnos.filter((t) => t.estado === 'COMPLETADO').length}
              </p>
            </div>
            <AcademicCapIcon className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vdc-primary mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando turnos...</p>
          </div>
        ) : filteredTurnos.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No se encontraron turnos' : 'No hay turnos asignados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Médico Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lugar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTurnos.map((turno) => (
                  <tr key={turno.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(turno.fecha), "dd/MM/yyyy", { locale: es })}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {turno.hora}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{turno.pacienteNombre}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <IdentificationIcon className="h-4 w-4 mr-1" />
                            {turno.pacienteDni}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{turno.medicoNombre || 'No asignado'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {turno.lugar || 'No especificado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(turno.estado)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTurno(turno.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar turno"
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
    </div>
  );
};

export default TodasTurnosAsignados;
