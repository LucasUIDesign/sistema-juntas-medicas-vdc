import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, CATEGORIAS_DOCUMENTO, Medico, JuntaFilters, EstadoJunta } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import JuntaDetailModal from './JuntaDetailModal';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

type SortField = 'fecha' | 'pacienteNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const MisJuntas = () => {
  const { user } = useAuth();
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  const [documentosModal, setDocumentosModal] = useState<JuntaMedica | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setTick] = useState(0);
  
  // Filtros para Director Médico
  const [showFilters, setShowFilters] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [selectedMedico, setSelectedMedico] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [searchPaciente, setSearchPaciente] = useState<string>('');

  const isDirectorMedico = user?.role === 'DIRECTOR_MEDICO';

  useEffect(() => {
    if (user) {
      loadJuntas();
      if (isDirectorMedico) {
        loadMedicos();
      }
    }
  }, [user, page, pageSize, sortField, sortOrder]);

  // Actualizar contador cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      juntasService.verificarDocumentosVencidos().then(() => {
        if (user) loadJuntas();
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadMedicos = async () => {
    try {
      const data = await juntasService.getMedicos();
      setMedicos(data);
    } catch (error) {
      console.error('Error loading medicos:', error);
    }
  };

  const loadJuntas = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const filters: JuntaFilters = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder,
      };

      // Aplicar filtros solo para Director Médico
      if (isDirectorMedico) {
        if (fechaInicio) filters.fechaInicio = fechaInicio.toISOString();
        if (fechaFin) filters.fechaFin = fechaFin.toISOString();
        if (selectedMedico) filters.medicoId = selectedMedico;
        if (selectedEstado) filters.estado = selectedEstado as EstadoJunta;
      }

      const data = isDirectorMedico 
        ? await juntasService.getJuntas(filters)
        : await juntasService.getJuntasByMedico(user.id, filters);
      
      // Filtrar por nombre de paciente si hay búsqueda
      if (searchPaciente && isDirectorMedico) {
        data.data = data.data.filter(j => 
          j.pacienteNombre.toLowerCase().includes(searchPaciente.toLowerCase())
        );
        data.total = data.data.length;
      }
      
      setJuntas(data);
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
    setFechaInicio(null);
    setFechaFin(null);
    setSelectedMedico('');
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
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      DOCUMENTOS_PENDIENTES: 'bg-orange-100 text-orange-800',
    };
    
    const labels = {
      PENDIENTE: 'Pendiente',
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[junta.estado]}`}>
        {labels[junta.estado]}
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

      {/* Filtros - Solo para Director Médico */}
      {isDirectorMedico && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Buscar Paciente */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Paciente
                  </label>
                  <input
                    type="text"
                    value={searchPaciente}
                    onChange={(e) => setSearchPaciente(e.target.value)}
                    placeholder="Nombre del paciente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                  />
                </div>

                {/* Fecha Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Desde
                  </label>
                  <DatePicker
                    selected={fechaInicio}
                    onChange={(date) => setFechaInicio(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                    isClearable
                    locale={es}
                  />
                </div>

                {/* Fecha Hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Hasta
                  </label>
                  <DatePicker
                    selected={fechaFin}
                    onChange={(date) => setFechaFin(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                    isClearable
                    minDate={fechaInicio || undefined}
                    locale={es}
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
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="APROBADA">Aprobada</option>
                    <option value="RECHAZADA">Rechazada</option>
                    <option value="DOCUMENTOS_PENDIENTES">Docs. Pendientes</option>
                  </select>
                </div>

                {/* Médico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médico
                  </label>
                  <select
                    value={selectedMedico}
                    onChange={(e) => setSelectedMedico(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                  >
                    <option value="">Todos</option>
                    {medicos.map((medico) => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones de búsqueda */}
              <div className="flex justify-end space-x-2 mt-4">
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
      )}

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
                        <div className="flex items-center justify-end space-x-1">
                          {junta.estado === 'DOCUMENTOS_PENDIENTES' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocumentosModal(junta);
                              }}
                              className="text-orange-500 hover:text-orange-600 transition-colors p-2 rounded-full hover:bg-orange-50"
                              aria-label={`Subir documentos faltantes para ${junta.pacienteNombre}`}
                              title="Subir documentos faltantes"
                            >
                              <DocumentArrowUpIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          )}
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
                        </div>
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
                      {junta.estado === 'DOCUMENTOS_PENDIENTES' && junta.documentosFaltantes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentosModal(junta);
                          }}
                          className="text-xs text-orange-600 underline"
                        >
                          Ver faltantes ({junta.documentosFaltantes.length})
                        </button>
                      )}
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

      {/* Documentos Faltantes Modal */}
      <AnimatePresence>
        {documentosModal && (
          <DocumentosFaltantesModal
            junta={documentosModal}
            onClose={() => setDocumentosModal(null)}
            onUpload={async () => {
              await loadJuntas();
              setDocumentosModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Modal para documentos faltantes con funcionalidad de carga
const DocumentosFaltantesModal = ({ 
  junta, 
  onClose, 
  onUpload 
}: { 
  junta: JuntaMedica; 
  onClose: () => void; 
  onUpload: () => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<{ [key: string]: File | null }>({});
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const tiempoRestante = junta.fechaLimiteDocumentos 
    ? formatDistanceToNow(new Date(junta.fechaLimiteDocumentos), { locale: es, addSuffix: true })
    : '';

  const getDocumentoLabel = (categoria: string) => {
    const doc = CATEGORIAS_DOCUMENTO.find(d => d.value === categoria);
    return doc?.label || categoria;
  };

  const handleFileChange = (categoria: string, file: File | null) => {
    setArchivosSeleccionados(prev => ({
      ...prev,
      [categoria]: file
    }));
    setMensaje(null);
  };

  const handleSubirDocumentos = async () => {
    const documentosParaSubir = Object.entries(archivosSeleccionados)
      .filter(([_, file]) => file !== null)
      .map(([categoria, file]) => ({
        categoria: categoria as any,
        file: file as File
      }));

    if (documentosParaSubir.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Selecciona al menos un documento para subir' });
      return;
    }

    setUploading(true);
    setMensaje(null);

    try {
      await juntasService.subirDocumentosFaltantes(junta.id, documentosParaSubir);
      setMensaje({ tipo: 'success', texto: '¡Documentos subidos exitosamente!' });
      setTimeout(() => {
        onUpload();
      }, 1500);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al subir los documentos. Intenta nuevamente.' });
    } finally {
      setUploading(false);
    }
  };

  const archivosListos = Object.values(archivosSeleccionados).filter(f => f !== null).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Subir Documentos Faltantes
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Paciente: <span className="font-medium">{junta.pacienteNombre}</span>
          </p>
          <div className="flex items-center text-orange-600 text-sm bg-orange-50 p-2 rounded">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Tiempo restante: <strong>{tiempoRestante}</strong></span>
          </div>
        </div>

        {/* Lista de documentos faltantes con input de archivo */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selecciona los archivos para cada documento faltante:
          </p>
          <div className="space-y-3">
            {junta.documentosFaltantes?.map((doc) => (
              <div key={doc} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${archivosSeleccionados[doc] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {getDocumentoLabel(doc)}
                  </span>
                  {archivosSeleccionados[doc] && (
                    <span className="text-xs text-green-600">✓ Listo</span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileChange(doc, e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-vdc-primary file:text-white hover:file:bg-vdc-primary/90 file:cursor-pointer"
                />
                {archivosSeleccionados[doc] && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    📎 {archivosSeleccionados[doc]?.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`mb-4 p-3 rounded text-sm ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.tipo === 'success' ? '✅' : '❌'} {mensaje.texto}
          </div>
        )}

        <div className="text-xs text-gray-500 mb-4 p-2 bg-yellow-50 rounded">
          ⚠️ Si no se entregan los documentos antes del plazo, la junta será rechazada automáticamente.
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {archivosListos} de {junta.documentosFaltantes?.length || 0} documentos listos
          </span>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubirDocumentos}
              disabled={uploading || archivosListos === 0}
              className="px-4 py-2 text-sm bg-vdc-primary text-white rounded hover:bg-vdc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                  Subir Documentos
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MisJuntas;
