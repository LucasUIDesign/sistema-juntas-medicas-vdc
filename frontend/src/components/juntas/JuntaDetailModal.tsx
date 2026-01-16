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

// Pestañas del dictamen
const TABS_DICTAMEN = [
  { id: 'identificacion', label: 'Identificación' },
  { id: 'laboral', label: 'Datos Laborales' },
  { id: 'motivo', label: 'Motivo Junta' },
  { id: 'antecedentes', label: 'Antecedentes' },
  { id: 'enfermedad', label: 'Enfermedad Actual' },
  { id: 'examen', label: 'Examen Físico' },
  { id: 'estudios', label: 'Estudios' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'dictamen', label: 'Dictamen' },
];

const JuntaDetailModal = ({ junta, onClose, onUpdate }: JuntaDetailModalProps) => {
  const { user } = useAuth();
  const isDirectorMedico = user?.role === 'DIRECTOR_MEDICO';

  const [showDictamen, setShowDictamen] = useState(isDirectorMedico);
  const [activeTab, setActiveTab] = useState('identificacion');
  const [detallesEvaluacion, setDetallesEvaluacion] = useState(junta.detallesDirector || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datos = junta.dictamen?.datosCompletos;

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

  const renderField = (label: string, value: string | string[] | undefined) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return (
        <div className="py-2">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm text-gray-400 italic">No especificado</p>
        </div>
      );
    }

    return (
      <div className="py-2">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">
          {Array.isArray(value) ? value.join(', ') : value}
        </p>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!datos && !junta.dictamen) {
      return (
        <div className="text-center py-8 text-gray-500">
          No hay datos del dictamen disponibles
        </div>
      );
    }

    switch (activeTab) {
      case 'identificacion':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
            <div className="space-y-1">
              {renderField('Nombre Completo', junta.dictamen?.nombrePaciente)}
              {renderField('DNI', junta.dictamen?.dni)}
              {renderField('Fecha de Nacimiento', datos?.fechaNacimiento)}
              {renderField('Sexo', datos?.sexo === 'M' ? 'Masculino' : datos?.sexo === 'F' ? 'Femenino' : datos?.sexo)}
              {renderField('Estado Civil', datos?.estadoCivil)}
            </div>
            <div className="space-y-1 pt-2 md:pt-0">
              {renderField('Domicilio', datos?.domicilio)}
              {renderField('Teléfono', datos?.telefono)}
              {renderField('Email', datos?.email)}
              {renderField('Obra Social', datos?.obraSocial)}
            </div>
          </div>
        );

      case 'laboral':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="space-y-1">
              {renderField('Establecimiento', datos?.establecimiento)}
              {renderField('Cargo', datos?.cargo)}
              {renderField('Nivel Educativo', datos?.nivelEducativo)}
              {renderField('Modalidad', datos?.modalidad)}
            </div>
            <div className="space-y-1">
              {renderField('Situación de Revista', datos?.situacionRevista)}
              {renderField('Antigüedad', datos?.antiguedad)}
              {renderField('Carga Horaria', datos?.cargaHoraria)}
              {renderField('Legajo', datos?.legajo)}
            </div>
          </div>
        );

      case 'motivo':
        return (
          <div className="space-y-1">
            {renderField('Motivo de la Junta', datos?.motivoJunta)}
            {renderField('Fecha Inicio Licencia', datos?.fechaInicioLicencia)}
            {renderField('Diagnósticos Previos', datos?.diagnosticosPrevios)}
          </div>
        );

      case 'antecedentes':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Antecedentes Médicos</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {renderField('Patologías Previas', datos?.patologiasPrevias)}
                {renderField('Antecedentes Quirúrgicos', datos?.antecedentesQuirurgicos)}
                {renderField('Alergias', datos?.alergias)}
                {renderField('Hábitos', datos?.habitos)}
                {renderField('Antecedentes Familiares', datos?.antecedentesFamiliares)}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Antecedentes Laborales</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {renderField('Licencias Anteriores', datos?.licenciasAnteriores)}
                {renderField('Accidentes Laborales', datos?.accidentesLaborales)}
                {renderField('Factores de Riesgo', datos?.factoresRiesgo)}
              </div>
            </div>
          </div>
        );

      case 'enfermedad':
        return (
          <div className="space-y-1">
            {renderField('Síntomas Principales', datos?.sintomasPrincipales)}
            {renderField('Evolución', datos?.evolucion)}
            {renderField('Tratamientos Actuales', datos?.tratamientosActuales)}
            {renderField('Interconsultas', datos?.interconsultas)}
          </div>
        );

      case 'examen':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Signos Vitales</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Presión Arterial</p>
                  <p className="text-sm font-medium text-gray-900">{datos?.presionArterial || '-'}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Frec. Cardíaca</p>
                  <p className="text-sm font-medium text-gray-900">{datos?.frecuenciaCardiaca || '-'}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Frec. Respiratoria</p>
                  <p className="text-sm font-medium text-gray-900">{datos?.frecuenciaRespiratoria || '-'}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Temperatura</p>
                  <p className="text-sm font-medium text-gray-900">{datos?.temperatura || '-'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Peso</p>
                <p className="text-sm font-medium text-gray-900">{datos?.peso || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Talla</p>
                <p className="text-sm font-medium text-gray-900">{datos?.talla || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">IMC</p>
                <p className="text-sm font-medium text-gray-900">{datos?.imc || '-'}</p>
              </div>
            </div>
            {renderField('Examen General', datos?.examenGeneral)}
          </div>
        );

      case 'estudios':
        return (
          <div className="space-y-1">
            {renderField('Laboratorio', datos?.laboratorio)}
            {renderField('Imágenes', datos?.imagenes)}
            {renderField('Estudios Funcionales', datos?.estudiosFuncionales)}
          </div>
        );

      case 'diagnostico':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Diagnóstico Principal</p>
              <p className="text-gray-900">{junta.dictamen?.diagnosticoPrincipal || 'No especificado'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Código CIE-10', datos?.codigoCIE10)}
              {renderField('Naturaleza de la Enfermedad', datos?.naturalezaEnfermedad)}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Capacidad Laboral</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {renderField('Capacidad Funcional', datos?.capacidadFuncional)}
                {renderField('Factores Limitantes', datos?.factoresLimitantes)}
              </div>
            </div>
          </div>
        );

      case 'dictamen':
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${junta.dictamen?.aptitudLaboral === 'APTO' ? 'bg-green-50 border-green-300' :
              junta.dictamen?.aptitudLaboral === 'NO_APTO' ? 'bg-red-50 border-red-300' :
                'bg-yellow-50 border-yellow-300'
              }`}>
              <p className="text-xs text-gray-600 mb-1">Aptitud Laboral</p>
              <p className={`text-lg font-bold ${junta.dictamen?.aptitudLaboral === 'APTO' ? 'text-green-700' :
                junta.dictamen?.aptitudLaboral === 'NO_APTO' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                {junta.dictamen?.aptitudLaboral === 'APTO' ? 'APTO' :
                  junta.dictamen?.aptitudLaboral === 'NO_APTO' ? 'NO APTO' :
                    junta.dictamen?.aptitudLaboral === 'APTO_CON_RESTRICCIONES' ? 'APTO CON RESTRICCIONES' :
                      junta.dictamen?.aptitudLaboral || 'No especificado'}
              </p>
            </div>
            {renderField('Restricciones', datos?.restricciones)}
            {renderField('Recomendaciones', datos?.recomendaciones)}
            {renderField('Tiempo de Recuperación', datos?.tiempoRecuperacion)}
            {renderField('Fecha del Dictamen', junta.dictamen?.fechaDictamen ? format(new Date(junta.dictamen.fechaDictamen), 'dd/MM/yyyy') : undefined)}
          </div>
        );

      default:
        return null;
    }
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
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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

          {/* Content - Scrollable */}
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

            {/* Dictamen Médico con Pestañas */}
            {junta.dictamen && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowDictamen(!showDictamen)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-vdc-primary" />
                    Dictamen Médico
                  </span>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showDictamen ? 'rotate-180' : ''}`} />
                </button>

                {showDictamen && (
                  <div className="bg-white">
                    {/* Tabs */}
                    <div className="border-b border-gray-200 overflow-x-auto">
                      <div className="flex min-w-max">
                        {TABS_DICTAMEN.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                              ? 'border-vdc-primary text-vdc-primary bg-blue-50'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                      {renderTabContent()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documentos Adjuntos */}
            {junta.adjuntos && junta.adjuntos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Documentos Adjuntos</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

export default JuntaDetailModal;
