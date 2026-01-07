import { motion } from 'framer-motion';
import { JuntaMedica } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface JuntaDetailModalRRHHProps {
  junta: JuntaMedica;
  onClose: () => void;
}

const JuntaDetailModalRRHH = ({ junta, onClose }: JuntaDetailModalRRHHProps) => {
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
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end flex-shrink-0">
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
