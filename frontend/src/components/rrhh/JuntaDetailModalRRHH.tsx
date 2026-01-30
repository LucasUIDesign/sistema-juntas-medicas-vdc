import { motion } from 'framer-motion';
import { JuntaMedica } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  IdentificationIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface JuntaDetailModalRRHHProps {
  junta: JuntaMedica;
  onClose: () => void;
  showPdfButton?: boolean;
}

const JuntaDetailModalRRHH = ({ junta, onClose, showPdfButton = true }: JuntaDetailModalRRHHProps) => {
  const exportJuntaToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 20;

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
      if (estado === 'APROBADA') return 'Aprobada por Director Medico';
      if (estado === 'RECHAZADA') return 'Rechazada por Director Medico';
      return 'Pendiente de aprobacion';
    };

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('VDC Internacional', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Ficha de Junta Medica', margin, yPosition);
    yPosition += 6;

    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, margin, yPosition);
    yPosition += 15;

    // Dibujar borde de la ficha
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    const fichaHeight = 120;
    doc.rect(margin, yPosition, contentWidth, fichaHeight);

    // Fondo del header de la ficha
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, yPosition, contentWidth, 12, 'F');

    // Título y estado
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('Junta Medica', margin + 3, yPosition + 8);

    // Estado en el lado derecho
    const estadoTexto = getEstadoTexto(junta.estado);
    const estadoWidth = doc.getTextWidth(estadoTexto);
    doc.setFontSize(10);

    if (junta.estado === 'APROBADA') {
      doc.setTextColor(22, 163, 74);
    } else if (junta.estado === 'RECHAZADA') {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(234, 179, 8);
    }
    doc.text(estadoTexto, pageWidth - margin - estadoWidth - 3, yPosition + 8);

    // Contenido de la ficha
    let yFicha = yPosition + 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Fecha de la Junta
    doc.setTextColor(100, 100, 100);
    doc.text('Fecha de la Junta:', margin + 3, yFicha);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(format(new Date(junta.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es }), margin + 45, yFicha);
    yFicha += 10;

    // Paciente
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Paciente:', margin + 3, yFicha);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(junta.pacienteNombre, margin + 45, yFicha);
    yFicha += 10;

    // DNI
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('DNI:', margin + 3, yFicha);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(junta.pacienteDni || junta.dictamen?.dni || '-', margin + 45, yFicha);
    yFicha += 10;

    // Médico Evaluador
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Medico Evaluador:', margin + 3, yFicha);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(junta.medicoNombre, margin + 45, yFicha);
    yFicha += 10;

    // Aprobación
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Aprobacion:', margin + 3, yFicha);

    const aprobacionTexto = getAprobacionTexto(junta.estado);
    if (junta.estado === 'APROBADA') {
      doc.setTextColor(22, 163, 74);
    } else if (junta.estado === 'RECHAZADA') {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(100, 100, 100);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(aprobacionTexto, margin + 45, yFicha);
    yFicha += 12;

    // Detalles
    if (junta.detalles && junta.detalles.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Detalles:', margin + 3, yFicha);
      yFicha += 5;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);

      const detallesLines = doc.splitTextToSize(junta.detalles, contentWidth - 10);
      doc.text(detallesLines.slice(0, 4), margin + 3, yFicha);
    }

    // Médicos Evaluadores (si existen)
    const medicosArray = junta.dictamen?.medicosEvaluadores;
    // Filtrar médicos que tengan al menos un campo lleno
    const medicosConDatos = Array.isArray(medicosArray) 
      ? medicosArray.filter((m: any) => 
          (m.nombre && m.nombre.trim()) || 
          (m.matricula && m.matricula.trim()) || 
          (m.especialidad && m.especialidad.trim())
        )
      : [];
    
    if (medicosConDatos.length > 0) {
      // Agregar nueva página si es necesario
      if (yFicha > 200) {
        doc.addPage();
        yFicha = 20;
      } else {
        yFicha += 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('Medicos Evaluadores', margin, yFicha);
      yFicha += 8;

      medicosConDatos.forEach((medico: any, index: number) => {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'bold');
        doc.text(index === 0 ? 'Medico Principal:' : `Medico ${index + 1}:`, margin + 3, yFicha);
        yFicha += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`Nombre: ${medico.nombre || '-'}`, margin + 5, yFicha);
        yFicha += 5;
        doc.text(`Matricula: ${medico.matricula || '-'}`, margin + 5, yFicha);
        yFicha += 5;
        doc.text(`Especialidad: ${medico.especialidad || '-'}`, margin + 5, yFicha);
        yFicha += 8;
      });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('VDC Internacional - Sistema de Gestion de Juntas Medicas', margin, pageHeight - 10);

    // Guardar PDF
    const pacienteNombreLimpio = junta.pacienteNombre.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `junta-medica-${pacienteNombreLimpio}-${format(new Date(junta.fecha), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  const getEstadoBadge = (estado: JuntaMedica['estado']) => {
    const styles: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APROBADA: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADA: 'bg-red-100 text-red-800 border-red-200',
      DOCUMENTOS_PENDIENTES: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      DOCUMENTOS_PENDIENTES: 'Docs. Pendientes',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalle de Junta Médica
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Estado */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Estado:</span>
              {getEstadoBadge(junta.estado)}
            </div>

            {/* Info básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Fecha de la Junta
                </div>
                <p className="text-gray-900 font-medium">
                  {format(new Date(junta.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Paciente
                </div>
                <p className="text-gray-900 font-medium">{junta.pacienteNombre}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <IdentificationIcon className="h-4 w-4 mr-2" />
                  DNI
                </div>
                <p className="text-gray-900 font-medium">
                  {junta.pacienteDni || junta.dictamen?.dni || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <UserCircleIcon className="h-4 w-4 mr-2" />
                  Médico Evaluador
                </div>
                <p className="text-gray-900 font-medium">{junta.medicoNombre}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Aprobación
                </div>
                <p className={`font-medium ${junta.aprobacion ? 'text-green-600' : 'text-gray-500'}`}>
                  {junta.estado === 'APROBADA' ? 'Aprobada' : junta.estado === 'RECHAZADA' ? 'Rechazada' : 'Pendiente'}
                </p>
              </div>
            </div>

            {/* Detalles */}
            {junta.detalles && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Detalles de la Junta</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{junta.detalles}</p>
                </div>
              </div>
            )}

            {/* Detalles del Director si existe */}
            {junta.detallesDirector && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Evaluación del Director Médico</p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{junta.detallesDirector}</p>
                </div>
              </div>
            )}

            {/* Médicos Evaluadores */}
            {(() => {
              // Intentar obtener médicos del nuevo formato (array)
              const medicosArray = junta.dictamen?.medicosEvaluadores;
              
              // Filtrar médicos que tengan al menos un campo lleno
              const medicosConDatos = Array.isArray(medicosArray) 
                ? medicosArray.filter((m: any) => 
                    (m.nombre && m.nombre.trim()) || 
                    (m.matricula && m.matricula.trim()) || 
                    (m.especialidad && m.especialidad.trim())
                  )
                : [];
              
              // Si existe el array y tiene médicos con datos
              if (medicosConDatos.length > 0) {
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Médicos Evaluadores
                    </p>
                    <div className="space-y-3">
                      {medicosConDatos.map((medico: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            {index === 0 ? 'Médico Principal' : `Médico ${index + 1}`}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Nombre:</span>
                              <p className="text-sm font-medium text-gray-900">{medico.nombre || '-'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Matrícula:</span>
                              <p className="text-sm font-medium text-gray-900">{medico.matricula || '-'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Especialidad:</span>
                              <p className="text-sm font-medium text-gray-900">{medico.especialidad || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Fallback: intentar formato antiguo (campos individuales)
              const medico1 = junta.dictamen?.medicoEvaluador1;
              const medico2 = junta.dictamen?.medicoEvaluador2;
              
              if (medico1 || medico2) {
                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Médicos Evaluadores
                    </p>
                    <div className="space-y-3">
                      {medico1 && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Médico Principal</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Nombre:</span>
                              <p className="text-sm font-medium text-gray-900">{medico1}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Matrícula:</span>
                              <p className="text-sm font-medium text-gray-900">{junta.dictamen?.matricula1 || '-'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Especialidad:</span>
                              <p className="text-sm font-medium text-gray-900">{junta.dictamen?.especialidad1 || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {medico2 && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Médico Secundario</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Nombre:</span>
                              <p className="text-sm font-medium text-gray-900">{medico2}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Matrícula:</span>
                              <p className="text-sm font-medium text-gray-900">{junta.dictamen?.matricula2 || '-'}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Especialidad:</span>
                              <p className="text-sm font-medium text-gray-900">{junta.dictamen?.especialidad2 || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                Creado: {format(new Date(junta.createdAt), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                Actualizado: {format(new Date(junta.updatedAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`bg-white border-t border-gray-200 px-6 py-4 flex ${showPdfButton ? 'justify-between' : 'justify-end'} flex-shrink-0`}>
            {showPdfButton && (
              <button
                onClick={exportJuntaToPDF}
                className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Descargar PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default JuntaDetailModalRRHH;
