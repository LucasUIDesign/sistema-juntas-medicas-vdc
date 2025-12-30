import { motion } from 'framer-motion';
import { JuntaMedica } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface JuntaDetailModalProps {
  junta: JuntaMedica;
  onClose: () => void;
  editable?: boolean;
}

const JuntaDetailModal = ({ junta, onClose, editable = false }: JuntaDetailModalProps) => {
  const getEstadoBadge = (estado: JuntaMedica['estado']) => {
    const styles = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APROBADA: 'bg-green-100 text-green-800 border-green-200',
      RECHAZADA: 'bg-red-100 text-red-800 border-red-200',
    };
    
    const labels = {
      PENDIENTE: 'Pendiente',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${styles[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white rounded-card shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              Detalle de Junta Médica
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-vdc-secondary hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-vdc-secondary">Estado:</span>
              {getEstadoBadge(junta.estado)}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <div className="space-y-1">
                <div className="flex items-center text-sm text-vdc-secondary">
                  <CalendarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Fecha de la Junta
                </div>
                <p className="text-gray-900 font-medium">
                  {format(new Date(junta.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>

              {/* Paciente */}
              <div className="space-y-1">
                <div className="flex items-center text-sm text-vdc-secondary">
                  <UserIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Paciente
                </div>
                <p className="text-gray-900 font-medium">{junta.pacienteNombre}</p>
              </div>

              {/* Médico */}
              <div className="space-y-1">
                <div className="flex items-center text-sm text-vdc-secondary">
                  <UserCircleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Médico Responsable
                </div>
                <p className="text-gray-900 font-medium">{junta.medicoNombre}</p>
              </div>

              {/* Aprobación */}
              <div className="space-y-1">
                <div className="flex items-center text-sm text-vdc-secondary">
                  <CheckCircleIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Aprobación
                </div>
                <p className={`font-medium ${junta.aprobacion ? 'text-vdc-success' : 'text-vdc-secondary'}`}>
                  {junta.aprobacion ? 'Aprobada' : 'Pendiente de aprobación'}
                </p>
              </div>
            </div>

            {/* Detalles */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-vdc-secondary">
                <DocumentTextIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Detalles de la Evaluación
              </div>
              <div className="bg-vdc-bg rounded-card p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{junta.detalles}</p>
              </div>
            </div>

            {/* Adjuntos */}
            {junta.adjuntos && junta.adjuntos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center text-sm text-vdc-secondary">
                  Documentos Adjuntos
                </div>
                <div className="space-y-2">
                  {junta.adjuntos.map((adjunto) => (
                    <div
                      key={adjunto.id}
                      className="flex items-center justify-between bg-vdc-bg rounded-card p-3"
                    >
                      <span className="text-sm text-gray-900">{adjunto.nombre}</span>
                      <button className="text-vdc-primary hover:text-vdc-primary/80 text-sm">
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-xs text-vdc-secondary">
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                Creado: {format(new Date(junta.createdAt), 'dd/MM/yyyy HH:mm')}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                Actualizado: {format(new Date(junta.updatedAt), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-vdc-secondary text-white rounded-card hover:bg-vdc-secondary/90 transition-colors"
            >
              Cerrar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default JuntaDetailModal;
