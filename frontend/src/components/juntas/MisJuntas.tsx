import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, CATEGORIAS_DOCUMENTO } from '../../types';
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
} from '@heroicons/react/24/outline';

type SortField = 'fecha' | 'pacienteNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const MisJuntas = () => {
  const { user } = useAuth();
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  const [documentosModal, setDocumentosModal] = useState<JuntaMedica | null>(null);
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [, setTick] = useState(0); // Para forzar re-render del contador

  useEffect(() => {
    if (user) {
      loadJuntas();
    }
  }, [user, page, pageSize, sortField, sortOrder]);

  // Actualizar contador cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      // Verificar documentos vencidos
      juntasService.verificarDocumentosVencidos().then(() => {
        if (user) loadJuntas();
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadJuntas = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await juntasService.getJuntasByMedico(user.id, {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder,
      });
      setJuntas(data);
    } catch (error) {
      console.error('Error loading juntas:', error);
    } finally {
      setIsLoading(false);
    }
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
          Mis Juntas Médicas
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Historial de evaluaciones médicas registradas
        </p>
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

// Modal para documentos faltantes
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

  const tiempoRestante = junta.fechaLimiteDocumentos 
    ? formatDistanceToNow(new Date(junta.fechaLimiteDocumentos), { locale: es, addSuffix: true })
    : '';

  const getDocumentoLabel = (categoria: string) => {
    const doc = CATEGORIAS_DOCUMENTO.find(d => d.value === categoria);
    return doc?.label || categoria;
  };

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
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos Faltantes
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Paciente: <span className="font-medium">{junta.pacienteNombre}</span>
          </p>
          <div className="flex items-center text-orange-600 text-sm bg-orange-50 p-2 rounded">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Tiempo restante: {tiempoRestante}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Documentos que faltan entregar:
          </p>
          <ul className="space-y-2">
            {junta.documentosFaltantes?.map((doc) => (
              <li key={doc} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {getDocumentoLabel(doc)}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-gray-500 mb-4 p-2 bg-yellow-50 rounded">
          ⚠️ Si no se entregan los documentos antes del plazo, la junta será rechazada automáticamente.
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              // Aquí iría la lógica para abrir el uploader
              // Por ahora solo cerramos
              onUpload();
            }}
            disabled={uploading}
            className="px-4 py-2 text-sm bg-vdc-primary text-white rounded hover:bg-vdc-primary/90 disabled:opacity-50"
          >
            {uploading ? 'Subiendo...' : 'Subir Documentos'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MisJuntas;
