import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { JuntaMedica, CATEGORIAS_DOCUMENTO } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
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
  ChevronDownIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface JuntaDetailModalProps {
  junta: JuntaMedica;
  onClose: () => void;
  onUpdate?: (junta: JuntaMedica) => void;
}

const JuntaDetailModal = ({ junta, onClose, onUpdate }: JuntaDetailModalProps) => {
  const { user } = useAuth();
  const isDirectorMedico = user?.role === 'DIRECTOR_MEDICO';
  
  const [showDictamen, setShowDictamen] = useState(isDirectorMedico);
  const [detallesEvaluacion, setDetallesEvaluacion] = useState(junta.detallesDirector || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAprobar = async () => {
    if (!detallesEvaluacion.trim()) {
      toast.warning('Por favor ingresa los detalles de la evaluación');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updated = await juntasService.updateJunta(junta.id, {
        estado: 'APROBADA',
        aprobacion: true,
        detallesDirector: detallesEvaluacion,
      });
      toast.success('Junta aprobada exitosamente');
      onUpdate?.(updated);
      onClose();
    } catch (error) {
      toast.error('Error al aprobar la junta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    if (!detallesEvaluacion.trim()) {
      toast.warning('Por favor ingresa los detalles de la evaluación');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const updated = await juntasService.updateJunta(junta.id, {
        estado: 'RECHAZADA',
        aprobacion: false,
        detallesDirector: detallesEvaluacion,
      });
      toast.success('Junta rechazada');
      onUpdate?.(updated);
      onClose();
    } catch (error) {
      toast.error('Error al rechazar la junta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS_DOCUMENTO.find(c => c.value === categoria);
    return cat?.label || categoria;
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
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
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

          <div className="p-6 space-y-6">
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

            {/* Dictamen Médico - Solo visible para Director Médico */}
            {junta.dictamen && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowDictamen(!showDictamen)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-vdc-primary" />
                    Dictamen Médico Completo
                    {junta.dictamen.isCompleto && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        Completo
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showDictamen ? 'rotate-180' : ''}`} />
                </button>
                
                {showDictamen && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Datos del paciente del dictamen */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Nombre del Paciente</p>
                        <p className="font-medium">{junta.dictamen.nombrePaciente || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">DNI</p>
                        <p className="font-medium">{junta.dictamen.dni || '-'}</p>
                      </div>
                    </div>

                    {/* Diagnóstico */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Diagnóstico Principal</p>
                      <p className="text-gray-900">{junta.dictamen.diagnosticoPrincipal || 'No especificado'}</p>
                    </div>

                    {/* Aptitud Laboral */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Aptitud Laboral</p>
                      <p className={`font-medium ${
                        junta.dictamen.aptitudLaboral === 'APTO' ? 'text-green-600' :
                        junta.dictamen.aptitudLaboral === 'NO_APTO' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {junta.dictamen.aptitudLaboral === 'APTO' ? 'APTO' :
                         junta.dictamen.aptitudLaboral === 'NO_APTO' ? 'NO APTO' :
                         junta.dictamen.aptitudLaboral === 'APTO_CON_RESTRICCIONES' ? 'APTO CON RESTRICCIONES' :
                         junta.dictamen.aptitudLaboral || 'No especificado'}
                      </p>
                    </div>

                    {/* Fecha del dictamen */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Fecha del Dictamen</p>
                      <p className="text-gray-900">
                        {junta.dictamen.fechaDictamen 
                          ? format(new Date(junta.dictamen.fechaDictamen), "dd/MM/yyyy", { locale: es })
                          : 'No especificada'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documentos Adjuntos */}
            {junta.adjuntos && junta.adjuntos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Documentos Adjuntos</p>
                <div className="space-y-2">
                  {junta.adjuntos.map((adjunto) => (
                    <div
                      key={adjunto.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{adjunto.nombre}</p>
                        <p className="text-xs text-gray-500">{getCategoriaLabel(adjunto.categoria)}</p>
                      </div>
                      <button className="text-vdc-primary hover:text-vdc-primary/80 text-sm">
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles del Director - Solo para Director Médico */}
            {isDirectorMedico && junta.estado === 'PENDIENTE' && (
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Evaluación del Director Médico</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalles de la Evaluación *
                  </label>
                  <textarea
                    value={detallesEvaluacion}
                    onChange={(e) => setDetallesEvaluacion(e.target.value)}
                    rows={4}
                    placeholder="Ingrese sus observaciones y detalles de la evaluación..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este campo es obligatorio para aprobar o rechazar la junta.
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAprobar}
                    disabled={isSubmitting || !detallesEvaluacion.trim()}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Aprobar Junta
                  </button>
                  <button
                    onClick={handleRechazar}
                    disabled={isSubmitting || !detallesEvaluacion.trim()}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Rechazar Junta
                  </button>
                </div>
              </div>
            )}

            {/* Mostrar detalles del director si ya fue evaluada */}
            {junta.detallesDirector && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Evaluación del Director Médico:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{junta.detallesDirector}</p>
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
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
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

export default JuntaDetailModal;
