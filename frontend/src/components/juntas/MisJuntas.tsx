import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, JuntaFilters, EstadoJunta } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import JuntaDetailModal from './JuntaDetailModal';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

type SortField = 'fecha' | 'pacienteNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const MisJuntas = () => {
  const { user } = useAuth();
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setTick] = useState(0);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [searchPaciente, setSearchPaciente] = useState<string>('');

  const isDirectorMedico = user?.role === 'DIRECTOR_MEDICO';

  useEffect(() => {
    if (user) {
      loadJuntas();
    }
  }, [user, page, pageSize, sortField, sortOrder]);

  // Actualizar cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      if (user) loadJuntas();
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadJuntas = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const filters: JuntaFilters = {
        page,
        pageSize,
      };

      // Aplicar filtros
      if (selectedEstado) filters.estado = selectedEstado as EstadoJunta;

      const data = await juntasService.getJuntas(filters);

      // Map response to expected format
      const mappedData = {
        ...data,
        data: data.data.map((j: any) => ({
          ...j,
          pacienteNombre: j.pacienteNombreCompleto || `${j.pacienteNombre || ''} ${j.pacienteApellido || ''}`.trim(),
          medicoNombre: j.medicoNombreCompleto || `${j.medicoNombre || ''} ${j.medicoApellido || ''}`.trim(),
        })),
      };

      // Filtrar por nombre de paciente si hay búsqueda (client-side)
      if (searchPaciente) {
        const searchLower = searchPaciente.toLowerCase();
        mappedData.data = mappedData.data.filter((j: any) =>
          j.pacienteNombre?.toLowerCase().includes(searchLower) ||
          j.numeroDocumento?.includes(searchPaciente)
        );
        mappedData.total = mappedData.data.length;
      }

      setJuntas(mappedData);
    } catch (error) {
      console.error('Error loading juntas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadJuntas();
  };

  const handleClearFilters = () => {
    setSelectedEstado('');
    setSearchPaciente('');
    setPage(1);
    loadJuntas();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getEstadoBadge = (junta: JuntaMedica) => {
    const styles: Record<string, string> = {
      BORRADOR: 'bg-gray-100 text-gray-800',
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-blue-100 text-blue-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      DOCUMENTOS_PENDIENTES: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      COMPLETADA: 'Completada',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      DOCUMENTOS_PENDIENTES: 'Docs. Pendientes',
    };

    // Si es DOCUMENTOS_PENDIENTES, mostrar contador
    if (junta.estado === 'DOCUMENTOS_PENDIENTES' && junta.fechaLimiteDocumentos) {
      const fechaLimite = new Date(junta.fechaLimiteDocumentos);
      const ahora = new Date();
      const horasRestantes = differenceInHours(fechaLimite, ahora);
      const minutosRestantes = differenceInMinutes(fechaLimite, ahora) % 60;
      
      const tiempoRestante = horasRestantes > 0 
        ? `${horasRestantes}h ${minutosRestantes}m`
        : minutosRestantes > 0 
          ? `${minutosRestantes}m`
          : 'Vencido';
      
      const isUrgente = horasRestantes < 12;
      
      return (
        <div className="flex flex-col items-start gap-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[junta.estado]} flex items-center`}>
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            {labels[junta.estado]}
          </span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${isUrgente ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
            ⏱️ {tiempoRestante}
          </span>
        </div>
      );
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[junta.estado] || 'bg-gray-100 text-gray-800'}`}>
        {labels[junta.estado] || junta.estado}
      </span>
    );
  };

  const getDictamenBadge = (junta: JuntaMedica) => {
    if (!junta.dictamen) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
          Sin dictamen
        </span>
      );
    }
    
    if (junta.dictamen.isCompleto) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
          <ClipboardDocumentListIcon className="h-3 w-3 mr-1" />
          Completo
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center">
        <ClipboardDocumentListIcon className="h-3 w-3 mr-1" />
        Incompleto
      </span>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
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
          {isDirectorMedico ? 'Todas las Juntas Médicas' : 'Mis Juntas Médicas'}
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          {isDirectorMedico 
            ? 'Revisión y aprobación de evaluaciones médicas' 
            : 'Historial de evaluaciones médicas registradas'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-card shadow-card mb-6">
        <div className="p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-vdc-primary hover:text-vdc-primary/80 transition-colors lg:hidden mb-4"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Buscar Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Paciente
                </label>
                <input
                  type="text"
                  value={searchPaciente}
                  onChange={(e) => setSearchPaciente(e.target.value)}
                  placeholder="Nombre o documento..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                >
                  <option value="">Todos</option>
                  <option value="BORRADOR">Borrador</option>
                  <option value="COMPLETADA">Completada</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADA">Aprobada</option>
                  <option value="RECHAZADA">Rechazada</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 text-sm bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors flex items-center"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : juntas && juntas.data.length > 0 ? (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="w-full hidden sm:table" role="grid">
                <thead className="bg-vdc-bg">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('fecha')}
                      aria-sort={sortField === 'fecha' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Fecha <SortIcon field="fecha" />
                    </th>
                    <th
                      scope="col"
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('pacienteNombre')}
                      aria-sort={sortField === 'pacienteNombre' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Paciente <SortIcon field="pacienteNombre" />
                    </th>
                    <th
                      scope="col"
                      className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('estado')}
                      aria-sort={sortField === 'estado' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Estado <SortIcon field="estado" />
                    </th>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Dictamen
                    </th>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {juntas.data.map((junta, index) => (
                    <motion.tr
                      key={junta.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-vdc-row-alt'} hover:bg-blue-50 transition-colors cursor-pointer`}
                      onClick={() => setSelectedJunta(junta)}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(junta.fecha), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {junta.pacienteNombre}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(junta)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        {getDictamenBadge(junta)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJunta(junta);
                          }}
                          className="text-vdc-primary hover:text-vdc-primary/80 transition-colors p-2 rounded-full hover:bg-vdc-primary/10"
                          aria-label={`Ver detalles de junta de ${junta.pacienteNombre}`}
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-200">
                {juntas.data.map((junta, index) => (
                  <motion.div
                    key={junta.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-blue-50 transition-colors"
                    onClick={() => setSelectedJunta(junta)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{junta.pacienteNombre}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(junta.fecha), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJunta(junta);
                          }}
                          className="text-vdc-primary p-2"
                          aria-label="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getEstadoBadge(junta)}
                      {getDictamenBadge(junta)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="px-4 lg:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSize" className="text-sm text-vdc-secondary">
                  Mostrar:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-vdc-secondary">
                  Página {juntas.page} de {juntas.totalPages}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === juntas.totalPages}
                    className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-vdc-secondary">No hay juntas médicas registradas</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJunta && (
          <JuntaDetailModal
            junta={selectedJunta}
            onClose={() => setSelectedJunta(null)}
            onUpdate={(updatedJunta) => {
              if (juntas) {
                setJuntas({
                  ...juntas,
                  data: juntas.data.map(j => j.id === updatedJunta.id ? updatedJunta : j),
                });
              }
              setSelectedJunta(null);
            }}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default MisJuntas;
