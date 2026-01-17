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
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  PaperClipIcon,
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

  // Mostrar dictamen expandido por defecto para directores, colapsado para otros para reducir ruido inicial
  const [showDictamen, setShowDictamen] = useState(true);
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
      BORRADOR: 'bg-gray-100 text-gray-800 border-gray-200',
      COMPLETADA: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente de Revisión',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      DOCUMENTOS_PENDIENTES: 'Documentación Pendiente',
      BORRADOR: 'Borrador',
      COMPLETADA: 'Completada'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
        {labels[estado] || estado}
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

  const renderField = (label: string, value: string | string[] | undefined, icon?: React.ReactNode) => {
    return (
      <div className="py-2 group">
        <div className="flex items-center text-xs text-gray-500 mb-0.5">
          {icon && <span className="mr-1.5 text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>}
          {label}
        </div>
        <p className={`text-sm ${!value || (Array.isArray(value) && value.length === 0) ? 'text-gray-400 font-light' : 'text-gray-900 font-medium'}`}>
          {!value || (Array.isArray(value) && value.length === 0)
            ? '-'
            : Array.isArray(value) ? value.join(', ') : value}
        </p>
      </div>
    );
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 mb-3 mt-1">
      <span className="text-vdc-primary">{icon}</span>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
  );

  const renderTabContent = () => {
    if (!datos && !junta.dictamen && activeTab !== 'identificacion') {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No hay datos médicos detallados</p>
          <p className="text-xs text-gray-400 mt-1">Solo se dispone de la información básica del paciente.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'identificacion':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              {renderSectionHeader('Datos Personales', <UserIcon className="h-5 w-5" />)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderField('Nombre Completo', junta.dictamen?.nombrePaciente || junta.pacienteNombre)}
                {renderField('DNI', junta.dictamen?.dni || junta.numeroDocumento)}
                {renderField('Fecha de Nacimiento', datos?.fechaNacimiento, <CalendarIcon className="h-3 w-3" />)}
                {renderField('Sexo', datos?.sexo === 'M' ? 'Masculino' : datos?.sexo === 'F' ? 'Femenino' : datos?.sexo)}
                {renderField('Estado Civil', datos?.estadoCivil)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              {renderSectionHeader('Información de Contacto', <MapPinIcon className="h-5 w-5" />)}
              <div className="grid grid-cols-1 gap-4">
                {renderField('Domicilio', datos?.domicilio, <MapPinIcon className="h-3 w-3" />)}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderField('Teléfono', datos?.telefono, <PhoneIcon className="h-3 w-3" />)}
                  {renderField('Email', datos?.email, <EnvelopeIcon className="h-3 w-3" />)}
                </div>
                {renderField('Obra Social', datos?.obraSocial, <BuildingOfficeIcon className="h-3 w-3" />)}
              </div>
            </div>
          </div>
        );

      case 'laboral':
        return (
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            {renderSectionHeader('Antecedentes Laborales', <BriefcaseIcon className="h-5 w-5" />)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                {renderField('Establecimiento', datos?.establecimiento, <BuildingOfficeIcon className="h-3 w-3" />)}
                {renderField('Situación de Revista', datos?.situacionRevista)}
              </div>
              <div className="space-y-1">
                {renderField('Cargo', datos?.cargo)}
                {renderField('Antigüedad', datos?.antiguedad)}
              </div>
              <div className="space-y-1">
                {renderField('Nivel Educativo', datos?.nivelEducativo)}
                {renderField('Carga Horaria', datos?.cargaHoraria, <ClockIcon className="h-3 w-3" />)}
              </div>
              <div className="space-y-1">
                {renderField('Modalidad', datos?.modalidad)}
                {renderField('Legajo', datos?.legajo)}
              </div>
            </div>
          </div>
        );

      case 'motivo':
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Motivo de la Junta
              </h4>
              <p className="text-gray-900 text-lg font-medium">{datos?.motivoJunta || '-'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              {renderField('Fecha Inicio Licencia', datos?.fechaInicioLicencia, <CalendarIcon className="h-3 w-3" />)}
              {renderField('Diagnósticos Previos', datos?.diagnosticosPrevios)}
            </div>
          </div>
        );

      case 'antecedentes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
              {renderSectionHeader('Antecedentes Médicos', <ClipboardDocumentCheckIcon className="h-5 w-5" />)}
              <div className="space-y-2">
                {renderField('Patologías Previas', datos?.patologiasPrevias)}
                {renderField('Antecedentes Quirúrgicos', datos?.antecedentesQuirurgicos)}
                {renderField('Alergias', datos?.alergias)}
                {renderField('Antecedentes Familiares', datos?.antecedentesFamiliares)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
              {renderSectionHeader('Hábitos y Factores', <CheckCircleIcon className="h-5 w-5" />)}
              <div className="space-y-2">
                {renderField('Hábitos', datos?.habitos)}
                {renderField('Factores de Riesgo', datos?.factoresRiesgo)}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Laborales</h5>
                  {renderField('Licencias Anteriores', datos?.licenciasAnteriores)}
                  {renderField('Accidentes Laborales', datos?.accidentesLaborales)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'enfermedad':
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 bg-gray-50 p-2 rounded">Síntomas Principales</h4>
              <p className="text-gray-700 whitespace-pre-wrap pl-2 border-l-4 border-vdc-primary/30">{datos?.sintomasPrincipales || '-'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('Evolución', datos?.evolucion)}
              {renderField('Tratamientos Actuales', datos?.tratamientosActuales)}
            </div>
            {renderField('Interconsultas', datos?.interconsultas)}
          </div>
        );

      case 'examen':
        return (
          <div className="space-y-6">
            {/* Signos Vitales Card */}
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
              {renderSectionHeader('Signos Vitales y Antropometría', <CheckIcon className="h-5 w-5" />)}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                <div className="text-center p-2 bg-blue-50/50 rounded-lg">
                  <span className="block text-xs text-gray-500">PA</span>
                  <span className="font-semibold text-gray-900">{datos?.presionArterial || '-'}</span>
                </div>
                <div className="text-center p-2 bg-blue-50/50 rounded-lg">
                  <span className="block text-xs text-gray-500">FC</span>
                  <span className="font-semibold text-gray-900">{datos?.frecuenciaCardiaca || '-'}</span>
                </div>
                <div className="text-center p-2 bg-blue-50/50 rounded-lg">
                  <span className="block text-xs text-gray-500">FR</span>
                  <span className="font-semibold text-gray-900">{datos?.frecuenciaRespiratoria || '-'}</span>
                </div>
                <div className="text-center p-2 bg-blue-50/50 rounded-lg">
                  <span className="block text-xs text-gray-500">Temp</span>
                  <span className="font-semibold text-gray-900">{datos?.temperatura || '-'}</span>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="block text-xs text-gray-500">Peso</span>
                  <span className="font-semibold text-gray-900">{datos?.peso || '-'}</span>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="block text-xs text-gray-500">Talla</span>
                  <span className="font-semibold text-gray-900">{datos?.talla || '-'}</span>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="block text-xs text-gray-500">IMC</span>
                  <span className="font-semibold text-gray-900">{datos?.imc || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
              {renderSectionHeader('Examen Físico General', <DocumentTextIcon className="h-5 w-5" />)}
              <div className="prose prose-sm max-w-none text-gray-700">
                {datos?.examenGeneral || '-'}
              </div>
            </div>
          </div>
        );

      case 'estudios':
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
              {renderSectionHeader('Estudios Complementarios', <PaperClipIcon className="h-5 w-5" />)}
              <div className="space-y-4">
                {renderField('Laboratorio', datos?.laboratorio)}
                {renderField('Imágenes', datos?.imagenes)}
                {renderField('Estudios Funcionales', datos?.estudiosFuncionales)}
              </div>
            </div>
          </div>
        );

      case 'diagnostico':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg shadow-sm">
              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Diagnóstico Principal</h4>
              <p className="text-xl font-bold text-gray-900">{junta.dictamen?.diagnosticoPrincipal || 'No especificado'}</p>
              {datos?.codigoCIE10 && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">CIE-10: {datos.codigoCIE10}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                {renderSectionHeader('Detalles Clínicos', <ClipboardDocumentCheckIcon className="h-5 w-5" />)}
                {renderField('Naturaleza de la Enfermedad', datos?.naturalezaEnfermedad)}
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                {renderSectionHeader('Capacidad Laboral', <BriefcaseIcon className="h-5 w-5" />)}
                <div className="space-y-2">
                  {renderField('Capacidad Funcional', datos?.capacidadFuncional)}
                  {renderField('Factores Limitantes', datos?.factoresLimitantes)}
                </div>
              </div>
            </div>
          </div>
        );

      case 'dictamen':
        const aptitud = junta.dictamen?.aptitudLaboral;
        const colorClass = aptitud === 'APTO' ? 'green' : aptitud === 'NO_APTO' ? 'red' : 'yellow';

        return (
          <div className="space-y-6">
            {/* Main Result Banner */}
            <div className={`p-6 rounded-xl border-2 text-center shadow-sm ${aptitud === 'APTO' ? 'bg-green-50 border-green-200' :
              aptitud === 'NO_APTO' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Conclusión Médica</p>
              <h2 className={`text-3xl font-black tracking-tight ${aptitud === 'APTO' ? 'text-green-700' :
                aptitud === 'NO_APTO' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                {aptitud === 'APTO' ? 'APTO' :
                  aptitud === 'NO_APTO' ? 'NO APTO' :
                    aptitud === 'APTO_CON_RESTRICCIONES' ? 'APTO CON RESTRICCIONES' :
                      aptitud || 'PENDIENTE'}
              </h2>
              {junta.dictamen?.fechaDictamen && (
                <p className="text-xs text-gray-500 mt-2">
                  Fecha del Dictamen: {format(new Date(junta.dictamen.fechaDictamen), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                {renderSectionHeader('Indicaciones', <ClipboardDocumentCheckIcon className="h-5 w-5" />)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Restricciones', datos?.restricciones)}
                  {renderField('Recomendaciones', datos?.recomendaciones)}
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                {renderSectionHeader('Pronóstico', <ClockIcon className="h-5 w-5" />)}
                {renderField('Tiempo Estimado de Recuperación', datos?.tiempoRecuperacion)}
              </div>
            </div>
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
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">

          {/* Main Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-start justify-between flex-shrink-0">
            <div className="flex items-start space-x-4">
              <div className="bg-vdc-primary/10 p-3 rounded-full hidden sm:block">
                <UserIcon className="h-8 w-8 text-vdc-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  {junta.pacienteNombre}
                </h1>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {format(new Date(junta.fecha), "d MMM yyyy", { locale: es })}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center">
                    <UserCircleIcon className="h-4 w-4 mr-1" />
                    Dr. {junta.medicoNombre}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  {getEstadoBadge(junta.estado)}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body Content - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            <div className="p-6 max-w-5xl mx-auto space-y-6">

              {/* Dictamen Médico Section - Always valid structure */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50/80 px-4">
                  {/* Navegación Tabs - Scrollable horizontalmente */}
                  <div className="flex overflow-x-auto hide-scrollbar space-x-1 pt-2">
                    {TABS_DICTAMEN.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-t-2 border-l border-r rounded-t-lg transition-all relative top-[1px] ${activeTab === tab.id
                          ? 'border-gray-200 border-b-white bg-white text-vdc-primary z-10'
                          : 'border-transparent bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 min-h-[400px]">
                  {renderTabContent()}
                </div>
              </div>

              {/* Documentos Adjuntos - Grid layout */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PaperClipIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Documentación Adjunta
                </h3>

                {junta.adjuntos && junta.adjuntos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {junta.adjuntos.map((adjunto) => (
                      <div
                        key={adjunto.id}
                        className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-3 hover:bg-blue-50/50 hover:border-blue-100 transition-colors group"
                      >
                        <div className="flex items-center overflow-hidden mr-3">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0 text-blue-600">
                            <DocumentTextIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={adjunto.nombre}>{adjunto.nombre}</p>
                            <p className="text-xs text-gray-500 truncate">{getCategoriaLabel(adjunto.categoria)}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-vdc-primary p-1.5 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100">
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No hay documentos adjuntos en esta junta.</p>
                  </div>
                )}
              </div>

              {/* Area de Director Médico */}
              {(isDirectorMedico || junta.detallesDirector) && (
                <div className={`rounded-xl shadow-sm border border-gray-200 overflow-hidden ${isDirectorMedico && junta.estado === 'PENDIENTE' ? 'bg-blue-50/30' : 'bg-white'}`}>
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2 text-vdc-primary" />
                      Revisión del Director Médico
                    </h3>
                  </div>

                  <div className="p-6">
                    {/* Modo Edicion (Solo Director y Pendiente) */}
                    {isDirectorMedico && junta.estado === 'PENDIENTE' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Dictamen de Auditoría</label>
                          <textarea
                            value={detallesEvaluacion}
                            onChange={(e) => setDetallesEvaluacion(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-vdc-primary focus:border-vdc-primary"
                            placeholder="Escriba aquí sus observaciones finales para aprobar o rechazar esta junta..."
                          />
                        </div>
                        <div className="flex gap-4 pt-2">
                          <button
                            onClick={handleAprobar}
                            disabled={isSubmitting || !detallesEvaluacion.trim()}
                            className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                          >
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Aprobar Junta
                          </button>
                          <button
                            onClick={handleRechazar}
                            disabled={isSubmitting || !detallesEvaluacion.trim()}
                            className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                          >
                            <XCircleIcon className="h-5 w-5 mr-2" />
                            Rechazar Junta
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Modo Visualizacion (Ya evaluado) */}
                    {junta.detallesDirector && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{junta.detallesDirector}</p>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center text-xs text-gray-500">
                          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                          Auditado el {format(new Date(junta.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Footer */}
              <div className="flex justify-between items-center text-xs text-gray-400 pt-4 pb-2">
                <span>ID: {junta.id}</span>
                <div className="flex space-x-4">
                  <span>Creado: {format(new Date(junta.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                  <span>Actualizado: {format(new Date(junta.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default JuntaDetailModal;
