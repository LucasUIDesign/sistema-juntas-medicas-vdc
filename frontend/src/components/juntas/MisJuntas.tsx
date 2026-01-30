import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, JuntaFilters, EstadoJunta, DOCUMENTOS_REQUERIDOS } from '../../types';
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
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperClipIcon,
  CheckBadgeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

type SortField = 'fecha' | 'pacienteNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const MisJuntas = () => {
  const { user } = useAuth();
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setTick] = useState(0); // Para actualizar tiempos relativos

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [searchPaciente, setSearchPaciente] = useState<string>('');

  const isDirectorMedico = user?.role === 'DIRECTOR_MEDICO';

  // Función para cargar los datos completos de una junta (incluyendo adjuntos)
  const handleSelectJunta = async (junta: JuntaMedica) => {
    setIsLoadingDetail(true);
    try {
      // Recargar los datos completos desde el backend
      const fullJunta = await juntasService.getJuntaById(junta.id);
      if (fullJunta) {
        setSelectedJunta(fullJunta);
      } else {
        setSelectedJunta(junta); // Fallback a los datos que ya tenemos
      }
    } catch (error) {
      console.error('Error loading junta details:', error);
      setSelectedJunta(junta); // Fallback a los datos que ya tenemos
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadJuntas();
    }
  }, [user, page, pageSize, sortField, sortOrder]);

  // Actualizar cada minuto para contadores de tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      // No recargamos toda la data, solo forzamos re-render para actualizar badges de tiempo
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadJuntas = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const filters: JuntaFilters = {
        page,
        pageSize,
      };

      // Si es Director Médico, solo mostrar juntas COMPLETADAS (listas para aprobar/rechazar)
      if (isDirectorMedico) {
        filters.estado = 'COMPLETADA';
      } else if (selectedEstado) {
        filters.estado = selectedEstado as EstadoJunta;
      }

      const data = await juntasService.getJuntas(filters);

      const mappedData = {
        ...data,
        data: data.data.map((j: any) => ({
          ...j,
          pacienteNombre: j.pacienteNombreCompleto || `${j.pacienteNombre || ''} ${j.pacienteApellido || ''}`.trim(),
          medicoNombre: j.medicoNombreCompleto || `${j.medicoNombre || ''} ${j.medicoApellido || ''}`.trim(),
        })),
      };

      // Filtrado local simple para búsqueda por nombre (idealmente backend)
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
    // Verificar si todos los documentos requeridos están cargados
    const documentosCargados = (junta.adjuntos || []).filter(adj => 
      DOCUMENTOS_REQUERIDOS.includes(adj.categoria as any)
    ).length;
    const todosDocumentosCargados = documentosCargados === DOCUMENTOS_REQUERIDOS.length;

    // Si el estado es COMPLETADA pero faltan documentos, mostrar como Incompleta
    const estadoReal = junta.estado === 'COMPLETADA' && !todosDocumentosCargados 
      ? 'INCOMPLETA' 
      : junta.estado;

    const styles: Record<string, string> = {
      BORRADOR: 'bg-gray-100 text-gray-800 border-gray-200',
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      COMPLETADA: 'bg-blue-100 text-blue-800 border-blue-200',
      INCOMPLETA: 'bg-orange-100 text-orange-800 border-orange-200',
      APROBADA: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADA: 'bg-red-100 text-red-800 border-red-200',
      DOCUMENTOS_PENDIENTES: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      COMPLETADA: 'Completada',
      INCOMPLETA: 'Incompleta',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      DOCUMENTOS_PENDIENTES: 'Faltan Docs.',
    };

    // Lógica especial para documentos pendientes con timer
    if (junta.estado === 'DOCUMENTOS_PENDIENTES' && junta.fechaLimiteDocumentos) {
      const fechaLimite = new Date(junta.fechaLimiteDocumentos);
      const ahora = new Date();
      const horasRestantes = differenceInHours(fechaLimite, ahora);
      const minutosRestantes = differenceInMinutes(fechaLimite, ahora) % 60;

      const tiempoRestante = horasRestantes > 0
        ? `${horasRestantes}h`
        : minutosRestantes > 0
          ? `${minutosRestantes}m`
          : 'Vencido';

      const isUrgente = horasRestantes < 12;

      return (
        <div className="flex flex-col items-start gap-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[junta.estado]} flex items-center`}>
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            {labels[junta.estado]}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${isUrgente ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            {tiempoRestante}
          </span>
        </div>
      );
    }

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[estadoReal] || 'bg-gray-100 text-gray-500'}`}>
        {labels[estadoReal] || estadoReal}
      </span>
    );
  };

  // Badge para Aptitud Laboral (Resultado Médico)
  const getDictamenBadge = (junta: JuntaMedica) => {
    if (!junta.dictamen?.aptitudLaboral) {
      return <span className="text-gray-400 text-xs">-</span>;
    }

    const aptitud = junta.dictamen.aptitudLaboral;

    if (aptitud === 'APTO') {
      return (
        <span className="px-2 py-1 text-xs font-bold bg-green-50 text-green-700 border border-green-200 rounded-md whitespace-nowrap">
          APTO
        </span>
      );
    }
    if (aptitud === 'NO_APTO') {
      return (
        <span className="px-2 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-md whitespace-nowrap">
          NO APTO
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md whitespace-nowrap">
        {aptitud.replace(/_/g, ' ')}
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
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {isDirectorMedico ? 'Gestión de Juntas Médicas' : 'Mis Juntas Médicas'}
        </h2>
        <p className="text-gray-500 mt-1">
          {isDirectorMedico
            ? 'Supervisión y auditoría de todas las evaluaciones médicas realizadas.'
            : 'Historial completo de tus evaluaciones y dictámenes generados.'}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 transition-all">
        <div className="p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-vdc-primary transition-colors lg:hidden w-full justify-between"
          >
            <span className="flex items-center"><FunnelIcon className="h-5 w-5 mr-2" /> Filtros</span>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${showFilters ? 'block mt-4' : 'hidden'} lg:block`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Buscar Paciente */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Buscar Paciente
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchPaciente}
                    onChange={(e) => setSearchPaciente(e.target.value)}
                    placeholder="Nombre, apellido o DNI..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary transition-shadow"
                  />
                </div>
              </div>

              {/* Estado - Solo visible para médicos evaluadores */}
              {!isDirectorMedico && (
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Filtrar por Estado
                  </label>
                  <select
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary bg-white"
                  >
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">Pendientes de Revisión</option>
                    <option value="APROBADA">Aprobadas</option>
                    <option value="RECHAZADA">Rechazadas</option>
                    <option value="DOCUMENTOS_PENDIENTES">Faltan Documentos</option>
                    <option value="BORRADOR">Borradores</option>
                  </select>
                </div>
              )}

              {/* Botones */}
              <div className={`${isDirectorMedico ? 'md:col-span-7' : 'md:col-span-3'} flex gap-2`}>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-1"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 text-sm font-medium bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-shadow shadow-sm hover:shadow flex-1"
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 mt-4 text-sm animate-pulse">Cargando juntas médicas...</p>
          </div>
        ) : juntas && juntas.data.length > 0 ? (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full hidden sm:table text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th
                      className="px-6 py-4 cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('fecha')}
                    >
                      Fecha <SortIcon field="fecha" />
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('pacienteNombre')}
                    >
                      Paciente <SortIcon field="pacienteNombre" />
                    </th>
                    <th className="px-6 py-4 text-left">Diagnóstico</th>
                    <th className="px-6 py-4 text-center">Aptitud</th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('estado')}
                    >
                      Aprobación <SortIcon field="estado" />
                    </th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {juntas.data.map((junta, index) => (
                    <motion.tr
                      key={junta.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => handleSelectJunta(junta)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {format(new Date(junta.fecha), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-vdc-primary transition-colors">
                          {junta.pacienteNombre}
                        </div>
                        <div className="text-xs text-gray-400">{junta.numeroDocumento}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 line-clamp-2" title={junta.dictamen?.diagnosticoPrincipal || junta.diagnosticoPrincipal}>
                          {junta.dictamen?.diagnosticoPrincipal || junta.diagnosticoPrincipal || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getDictamenBadge(junta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(junta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectJunta(junta);
                          }}
                          className="text-gray-400 hover:text-vdc-primary transition-colors p-2 rounded-full hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm"
                          title="Ver Detalle Completo"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile List View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {juntas.data.map((junta, index) => (
                  <motion.div
                    key={junta.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleSelectJunta(junta)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{junta.pacienteNombre}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(junta.fecha), 'dd de MMMM, yyyy', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1 italic">
                          {junta.dictamen?.diagnosticoPrincipal || junta.diagnosticoPrincipal || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      {getDictamenBadge(junta)}
                      {getEstadoBadge(junta)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>Filas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-6 focus:ring-vdc-primary focus:border-vdc-primary bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-medium">
                  {page} de {juntas.totalPages}
                </span>
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === juntas.totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50/50">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No se encontraron juntas</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">No hay registros que coincidan con tus filtros de búsqueda.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-vdc-primary hover:text-vdc-primary/80 font-medium text-sm hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJunta && !isLoadingDetail && (
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
              // No cerramos el modal automáticmante si es un update, pero aquí se maneja setSelectedJunta(null) en el modal close
            }}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default MisJuntas;
