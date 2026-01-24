import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, PaginatedResult, Medico, JuntaFilters } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import JuntaDetailModalRRHH from './JuntaDetailModalRRHH';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

type SortField = 'fecha' | 'pacienteNombre' | 'medicoNombre' | 'estado';
type SortOrder = 'asc' | 'desc';

const TodasJuntas = () => {
  const { user } = useAuth(); // Agregar useAuth para verificar el rol
  const [juntas, setJuntas] = useState<PaginatedResult<JuntaMedica> | null>(null);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJunta, setSelectedJunta] = useState<JuntaMedica | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
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
        estado: 'COMPLETADA', // Solo mostrar juntas completadas (cargadas por médicos)
      };
      
      if (searchTerm) filters.search = searchTerm;
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
    setSearchTerm('');
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
    const styles: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      DOCUMENTOS_PENDIENTES: 'bg-orange-100 text-orange-800',
    };
    
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      DOCUMENTOS_PENDIENTES: 'Docs. Pendientes',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[estado] || styles.PENDIENTE}`}>
        {labels[estado] || estado}
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

  const exportToPDF = () => {
    if (!juntas || juntas.data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 20;
    
    // Función para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Función para obtener el texto del estado
    const getEstadoTexto = (estado: string) => {
      const labels: Record<string, string> = {
        PENDIENTE: 'Pendiente',
        APROBADA: 'Aprobada',
        RECHAZADA: 'Rechazada',
        COMPLETADA: 'Completada',
        DOCUMENTOS_PENDIENTES: 'Docs. Pendientes',
      };
      return labels[estado] || estado;
    };

    // Función para obtener el estado de aprobación
    const getAprobacionTexto = (estado: string) => {
      if (estado === 'APROBADA') return 'Aprobada por Director Médico';
      if (estado === 'RECHAZADA') return 'Rechazada por Director Médico';
      return 'Pendiente de aprobación';
    };
    
    // Título principal
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('VDC Internacional', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Nómina de Juntas Médicas', margin, yPosition);
    yPosition += 6;
    
    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, margin, yPosition);
    yPosition += 4;
    doc.text(`Total de registros: ${juntas.total}`, margin, yPosition);
    yPosition += 10;
    
    // Filtros aplicados
    if (searchTerm || fechaInicio || fechaFin || selectedMedicos.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Filtros aplicados:', margin, yPosition);
      yPosition += 5;
      
      if (searchTerm) {
        doc.text(`• Búsqueda: ${searchTerm}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (fechaInicio) {
        doc.text(`• Desde: ${format(fechaInicio, 'dd/MM/yyyy')}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (fechaFin) {
        doc.text(`• Hasta: ${format(fechaFin, 'dd/MM/yyyy')}`, margin + 2, yPosition);
        yPosition += 4;
      }
      if (selectedMedicos.length > 0) {
        const medicoNombre = medicos.find(m => m.id === selectedMedicos[0])?.nombre || 'Desconocido';
        doc.text(`• Médico: ${medicoNombre}`, margin + 2, yPosition);
        yPosition += 4;
      }
      yPosition += 5;
    }
    
    // Iterar sobre cada junta y crear una ficha
    juntas.data.forEach((junta, index) => {
      // Verificar si necesitamos una nueva página (estimando ~70mm por ficha)
      checkPageBreak(70);
      
      // Dibujar borde de la ficha
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      const fichaHeight = 65;
      doc.rect(margin, yPosition, contentWidth, fichaHeight);
      
      // Fondo del header de la ficha
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPosition, contentWidth, 10, 'F');
      
      // Número de ficha y estado
      doc.setFontSize(10);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text(`Junta Médica #${index + 1}`, margin + 3, yPosition + 6.5);
      
      // Estado en el lado derecho
      const estadoTexto = getEstadoTexto(junta.estado);
      const estadoWidth = doc.getTextWidth(estadoTexto);
      doc.setFontSize(9);
      
      // Color del estado
      if (junta.estado === 'APROBADA') {
        doc.setTextColor(22, 163, 74); // Verde
      } else if (junta.estado === 'RECHAZADA') {
        doc.setTextColor(220, 38, 38); // Rojo
      } else {
        doc.setTextColor(234, 179, 8); // Amarillo
      }
      doc.text(estadoTexto, pageWidth - margin - estadoWidth - 3, yPosition + 6.5);
      
      // Contenido de la ficha
      let yFicha = yPosition + 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Fecha de la Junta
      doc.setTextColor(100, 100, 100);
      doc.text('Fecha de la Junta:', margin + 3, yFicha);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(format(new Date(junta.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es }), margin + 35, yFicha);
      yFicha += 7;
      
      // Paciente
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Paciente:', margin + 3, yFicha);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(junta.pacienteNombre, margin + 35, yFicha);
      yFicha += 7;
      
      // DNI
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('DNI:', margin + 3, yFicha);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(junta.pacienteDni || junta.dictamen?.dni || '-', margin + 35, yFicha);
      yFicha += 7;
      
      // Médico Evaluador
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Médico Evaluador:', margin + 3, yFicha);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(junta.medicoNombre, margin + 35, yFicha);
      yFicha += 7;
      
      // Aprobación
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Aprobación:', margin + 3, yFicha);
      
      const aprobacionTexto = getAprobacionTexto(junta.estado);
      if (junta.estado === 'APROBADA') {
        doc.setTextColor(22, 163, 74);
      } else if (junta.estado === 'RECHAZADA') {
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setTextColor(100, 100, 100);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(aprobacionTexto, margin + 35, yFicha);
      yFicha += 7;
      
      // Detalles (si existen y hay espacio)
      if (junta.detalles && junta.detalles.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Detalles:', margin + 3, yFicha);
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        
        // Truncar detalles si son muy largos
        const detallesMaxLength = 80;
        const detallesTexto = junta.detalles.length > detallesMaxLength 
          ? junta.detalles.substring(0, detallesMaxLength) + '...'
          : junta.detalles;
        
        const detallesLines = doc.splitTextToSize(detallesTexto, contentWidth - 40);
        doc.text(detallesLines.slice(0, 2), margin + 35, yFicha); // Máximo 2 líneas
      }
      
      // Mover posición para la siguiente ficha
      yPosition += fichaHeight + 8;
    });
    
    // Footer en la última página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('VDC Internacional - Sistema de Gestión de Juntas Médicas', margin, pageHeight - 10);
    
    // Guardar PDF
    const fileName = `nomina-juntas-medicas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    doc.save(fileName);
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

      {/* Botón Exportar PDF - Solo para RRHH */}
      {user?.role === 'RRHH' && (
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToPDF}
            disabled={!juntas || juntas.data.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Descargar toda la Nómina en PDF</span>
          </motion.button>
        </div>
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Buscar Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Paciente
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre o DNI..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                />
              </div>

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
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      DNI
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {juntas.data.map((junta, index) => (
                    <motion.tr
                      key={junta.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedJunta(junta)}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-vdc-row-alt'} hover:bg-blue-50 transition-colors cursor-pointer`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(junta.fecha), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {junta.pacienteNombre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {junta.pacienteDni || junta.dictamen?.dni || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {junta.medicoNombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <span title={junta.detalles}>
                          {truncateText(junta.detalles, 50)}
                        </span>
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
          <JuntaDetailModalRRHH
            junta={selectedJunta}
            onClose={() => setSelectedJunta(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TodasJuntas;
