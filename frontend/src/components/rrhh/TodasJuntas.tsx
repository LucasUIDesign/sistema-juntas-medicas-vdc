import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, Medico, JuntaFilters } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import JuntaDetailModal from '../juntas/JuntaDetailModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

type SortField = 'fecha' | 'pacienteNombre' | 'medicoNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const TodasJuntas = () => {
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  
  // Filters
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [selectedMedicos, setSelectedMedicos] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadMedicos();
    loadJuntas();
  }, []);

  useEffect(() => {
    loadJuntas();
  }, [page, pageSize, sortField, sortOrder]);

  const loadMedicos = async () => {
    try {
      const data = await juntasService.getMedicos();
      setMedicos(data);
    } catch (error) {
      console.error('Error loading medicos:', error);
    }
  };

  const loadJuntas = async () => {
    setIsLoading(true);
    try {
      const filters: JuntaFilters = {
        page,
        pageSize,
        sortBy: sortField,
        sortOrder,
      };
      
      if (fechaInicio) filters.fechaInicio = fechaInicio.toISOString();
      if (fechaFin) filters.fechaFin = fechaFin.toISOString();
      if (selectedMedicos.length === 1) filters.medicoId = selectedMedicos[0];
      
      const data = await juntasService.getJuntas(filters);
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
    setSelectedMedicos([]);
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

  const getEstadoBadge = (estado: JuntaMedica['estado']) => {
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[estado]}`}>
        {labels[estado]}
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-subtitle font-semibold text-gray-900">
          Vista General de Juntas Médicas
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Supervisión y gestión de todas las evaluaciones médicas
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-card shadow-card mb-6 sticky top-32 z-20">
        <div className="p-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-vdc-primary hover:text-vdc-primary/80 transition-colors lg:hidden mb-4"
          >
            <FunnelIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Desde
                </label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={(date) => setFechaInicio(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                  isClearable
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <DatePicker
                  selected={fechaFin}
                  onChange={(date) => setFechaFin(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Seleccionar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                  isClearable
                  minDate={fechaInicio || undefined}
                />
              </div>

              {/* Médicos Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Médico
                </label>
                <select
                  value={selectedMedicos[0] || ''}
                  onChange={(e) => setSelectedMedicos(e.target.value ? [e.target.value] : [])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                >
                  <option value="">Todos los médicos</option>
                  {medicos.map((medico) => (
                    <option key={medico.id} value={medico.id}>
                      {medico.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Buscar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-vdc-secondary text-vdc-secondary rounded-card hover:bg-gray-50 transition-colors"
                >
                  Limpiar
                </motion.button>
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
              <table className="w-full" role="grid">
                <thead className="bg-vdc-bg">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('fecha')}
                    >
                      Fecha <SortIcon field="fecha" />
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('pacienteNombre')}
                    >
                      Paciente <SortIcon field="pacienteNombre" />
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('medicoNombre')}
                    >
                      Médico <SortIcon field="medicoNombre" />
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('estado')}
                    >
                      Estado <SortIcon field="estado" />
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
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-vdc-row-alt'} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(junta.fecha), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedJunta(junta)}
                          className="text-sm text-vdc-primary hover:text-vdc-primary/80 hover:underline transition-colors"
                        >
                          {junta.pacienteNombre}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {junta.medicoNombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <span title={junta.detalles}>
                          {truncateText(junta.detalles, 50)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getEstadoBadge(junta.estado)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                <span className="text-sm text-vdc-secondary">
                  de {juntas.total} registros
                </span>
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
            <p className="text-vdc-secondary">No se encontraron juntas médicas</p>
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
    </motion.div>
  );
};

export default TodasJuntas;
