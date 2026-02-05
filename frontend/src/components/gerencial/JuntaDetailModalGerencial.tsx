import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { JuntaMedica, CATEGORIAS_DOCUMENTO, DOCUMENTOS_REQUERIDOS, CategoriaDocumento } from '../../types';
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
    CheckIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    BriefcaseIcon,
    ClipboardDocumentCheckIcon,
    PaperClipIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface JuntaDetailModalGerencialProps {
    junta: JuntaMedica;
    onClose: () => void;
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
    { id: 'profesionales', label: 'Profesionales' },
    { id: 'documentos', label: 'Documentos' },
];

const JuntaDetailModalGerencial = ({ junta, onClose }: JuntaDetailModalGerencialProps) => {
    const [activeTab, setActiveTab] = useState('identificacion');

    const datos = junta.dictamen;

    const getEstadoBadge = (estado: JuntaMedica['estado']) => {
        const styles: Record<string, string> = {
            PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            APROBADA: 'bg-green-100 text-green-800 border-green-200',
            RECHAZADA: 'bg-red-100 text-red-800 border-red-200',
            BORRADOR: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        const labels: Record<string, string> = {
            PENDIENTE: 'Pendiente de Revisión',
            APROBADA: 'Aprobada',
            RECHAZADA: 'Rechazada',
            BORRADOR: 'Borrador',
        };

        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[estado] || 'bg-gray-100 text-gray-800'}`}>
                {labels[estado] || estado}
            </span>
        );
    };

    const getCategoriaLabel = (categoria: string) => {
        const cat = CATEGORIAS_DOCUMENTO.find(c => c.value === categoria);
        return cat?.label || categoria;
    };

    // Función para descargar documentos
    const handleDownload = async (adjunto: { id: string; nombre: string; url: string; categoria: string }) => {
        try {
            console.log('[DOWNLOAD] Iniciando descarga:', adjunto.nombre);
            toast.info(`Descargando: ${adjunto.nombre}`);

            // Verificar si es un documento mock
            if (adjunto.url.includes('mock-storage')) {
                toast.warning('Este documento no está disponible para descarga');
                return;
            }

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const token = localStorage.getItem('vdc_token');

            // La URL del documento viene sin /api, así que hay que agregarlo
            const downloadUrl = adjunto.url.startsWith('http')
                ? adjunto.url
                : `${API_URL}/api${adjunto.url}`;

            console.log('[DOWNLOAD] URL:', downloadUrl);

            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al descargar el documento');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = adjunto.nombre;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Documento descargado');
        } catch (error) {
            console.error('[DOWNLOAD] Error:', error);
            toast.error('Error al descargar el documento');
        }
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
        if (!datos && !junta.dictamen && activeTab !== 'identificacion' && activeTab !== 'documentos') {
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
                            {(() => {
                                let motivos: string[] = [];
                                if (Array.isArray(datos?.motivoJunta)) {
                                    motivos = datos.motivoJunta;
                                } else if (typeof datos?.motivoJunta === 'string' && datos.motivoJunta.trim()) {
                                    motivos = datos.motivoJunta.split(',').map((m: string) => m.trim()).filter((m: string) => m);
                                }

                                if (motivos.length > 0) {
                                    return (
                                        <ul className="space-y-2">
                                            {motivos.map((motivo: string, index: number) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-900 font-medium">{motivo}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }
                                return <p className="text-gray-500 text-sm italic">No se especificó motivo</p>;
                            })()}
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

                return (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-xl border-2 text-center shadow-sm ${aptitud === 'APTO' ? 'bg-green-50 border-green-200' :
                            aptitud === 'NO_APTO' ? 'bg-red-50 border-red-200' :
                                aptitud === 'APTO_CON_RESTRICCIONES' ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-gray-50 border-gray-200'
                            }`}>
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Conclusión Médica</p>
                            <h2 className={`text-3xl font-black tracking-tight ${aptitud === 'APTO' ? 'text-green-700' :
                                aptitud === 'NO_APTO' ? 'text-red-700' :
                                    aptitud === 'APTO_CON_RESTRICCIONES' ? 'text-yellow-700' :
                                        'text-gray-700'
                                }`}>
                                {aptitud === 'APTO' ? 'APTO' :
                                    aptitud === 'NO_APTO' ? 'NO APTO' :
                                        aptitud === 'APTO_CON_RESTRICCIONES' ? 'APTO CON RESTRICCIONES' :
                                            aptitud === 'NO_APTO_TEMPORARIO' ? 'NO APTO TEMPORARIO' :
                                                aptitud === 'NO_APTO_DEFINITIVO' ? 'NO APTO DEFINITIVO' :
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

            case 'profesionales':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
                            {renderSectionHeader('Médicos Evaluadores', <UserGroupIcon className="h-5 w-5" />)}

                            {(() => {
                                const medicosArray = datos?.medicosEvaluadores;
                                const medicosConDatos = Array.isArray(medicosArray)
                                    ? medicosArray.filter((m: any) =>
                                        (m.nombre && m.nombre.trim()) ||
                                        (m.matricula && m.matricula.trim()) ||
                                        (m.especialidad && m.especialidad.trim())
                                    )
                                    : [];

                                if (medicosConDatos.length > 0) {
                                    return (
                                        <div className="space-y-4">
                                            {medicosConDatos.map((medico: any, index: number) => (
                                                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center mb-3">
                                                        <div className="bg-vdc-primary/10 p-2 rounded-full mr-3">
                                                            <UserCircleIcon className="h-6 w-6 text-vdc-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {index === 0 ? 'Médico Evaluador Principal' : `Médico Evaluador ${index + 1}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                                                        {renderField('Nombre Completo', medico.nombre)}
                                                        {renderField('Matrícula', medico.matricula)}
                                                        {renderField('Especialidad', medico.especialidad)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }

                                const medico1 = datos?.medicoEvaluador1 || junta.dictamen?.medicoEvaluador1;
                                const medico2 = datos?.medicoEvaluador2 || junta.dictamen?.medicoEvaluador2;

                                if (medico1 || medico2) {
                                    return (
                                        <div className="space-y-4">
                                            {medico1 && (
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center mb-3">
                                                        <div className="bg-vdc-primary/10 p-2 rounded-full mr-3">
                                                            <UserCircleIcon className="h-6 w-6 text-vdc-primary" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">Médico Evaluador Principal</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                                                        {renderField('Nombre Completo', medico1)}
                                                        {renderField('Matrícula', datos?.matricula1 || junta.dictamen?.matricula1)}
                                                        {renderField('Especialidad', datos?.especialidad1 || junta.dictamen?.especialidad1)}
                                                    </div>
                                                </div>
                                            )}
                                            {medico2 && (
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center mb-3">
                                                        <div className="bg-vdc-primary/10 p-2 rounded-full mr-3">
                                                            <UserCircleIcon className="h-6 w-6 text-vdc-primary" />
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-900">Médico Evaluador Secundario</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                                                        {renderField('Nombre Completo', medico2)}
                                                        {renderField('Matrícula', datos?.matricula2 || junta.dictamen?.matricula2)}
                                                        {renderField('Especialidad', datos?.especialidad2 || junta.dictamen?.especialidad2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 font-medium">No se registraron médicos evaluadores</p>
                                        <p className="text-xs text-gray-400 mt-1">Esta información no fue completada en el dictamen.</p>
                                    </div>
                                );
                            })()}

                            <div className="mt-6 pt-4 border-t border-gray-200">
                                {renderField('Fecha del Dictamen', datos?.fechaDictamen || junta.dictamen?.fechaDictamen, <CalendarIcon className="h-3 w-3" />)}
                            </div>
                        </div>
                    </div>
                );

            case 'documentos':
                return (
                    <div className="space-y-6">
                        {/* Documentos Requeridos */}
                        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
                            {renderSectionHeader('Documentos Requeridos', <PaperClipIcon className="h-5 w-5" />)}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {DOCUMENTOS_REQUERIDOS.map((docRequerido) => {
                                    const adjunto = (junta.adjuntos || []).find(a => a.categoria === docRequerido);
                                    const label = CATEGORIAS_DOCUMENTO.find(c => c.value === docRequerido)?.label || docRequerido;

                                    return (
                                        <div
                                            key={docRequerido}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${adjunto
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center min-w-0 flex-1">
                                                {adjunto ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-3 flex-shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-medium truncate ${adjunto ? 'text-green-800' : 'text-gray-700'}`}>
                                                        {label}
                                                    </p>
                                                    {adjunto && (
                                                        <p className="text-xs text-green-600 truncate">{adjunto.nombre}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Botón de Descarga */}
                                            {adjunto && (
                                                <div className="ml-3 flex-shrink-0">
                                                    {adjunto.url.includes('mock-storage') ? (
                                                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-500">
                                                            No disponible
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownload(adjunto)}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            title="Descargar documento"
                                                        >
                                                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                                            Descargar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Otros Documentos Adjuntos */}
                        {junta.adjuntos && junta.adjuntos.filter(a => !DOCUMENTOS_REQUERIDOS.includes(a.categoria as CategoriaDocumento)).length > 0 && (
                            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
                                {renderSectionHeader('Otros Documentos Adjuntos', <DocumentTextIcon className="h-5 w-5" />)}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {junta.adjuntos
                                        .filter(a => !DOCUMENTOS_REQUERIDOS.includes(a.categoria as CategoriaDocumento))
                                        .map((adjunto) => (
                                            <div
                                                key={adjunto.id}
                                                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                                            >
                                                <div className="flex items-center overflow-hidden mr-3 flex-1">
                                                    <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0 text-blue-600">
                                                        <DocumentTextIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate" title={adjunto.nombre}>{adjunto.nombre}</p>
                                                        <p className="text-xs text-gray-500 truncate">{getCategoriaLabel(adjunto.categoria)}</p>
                                                    </div>
                                                </div>

                                                {/* Botón de Descarga */}
                                                {adjunto.url.includes('mock-storage') ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-500">
                                                        No disponible
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(adjunto)}
                                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 flex-shrink-0"
                                                        title="Descargar documento"
                                                    >
                                                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                                        Descargar
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Mensaje si no hay documentos */}
                        {(!junta.adjuntos || junta.adjuntos.length === 0) && (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <PaperClipIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">No hay documentos adjuntos</p>
                                <p className="text-xs text-gray-400 mt-1">Esta junta médica no tiene archivos adjuntos.</p>
                            </div>
                        )}

                        {/* Resumen de documentación */}
                        {junta.adjuntos && junta.adjuntos.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Resumen de Documentación</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            {junta.adjuntos.length} documento{junta.adjuntos.length !== 1 ? 's' : ''} adjunto{junta.adjuntos.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-blue-600">
                                            Requeridos: {junta.adjuntos.filter(a => DOCUMENTOS_REQUERIDOS.includes(a.categoria as CategoriaDocumento)).length}/{DOCUMENTOS_REQUERIDOS.length}
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            Otros: {junta.adjuntos.filter(a => !DOCUMENTOS_REQUERIDOS.includes(a.categoria as CategoriaDocumento)).length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 border-b border-gray-200 px-6 py-5 flex items-start justify-between flex-shrink-0">
                        <div className="flex items-start space-x-4">
                            <div className="bg-white/20 p-3 rounded-full hidden sm:block">
                                <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white leading-tight">
                                    {junta.pacienteNombre}
                                </h1>
                                <div className="flex items-center space-x-3 mt-1 text-sm text-white/80">
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
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Body Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50">
                        <div className="p-6 max-w-5xl mx-auto space-y-6">

                            {/* Dictamen Médico Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="border-b border-gray-200 bg-gray-50/80 px-4">
                                    {/* Navegación Tabs */}
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
                                                {tab.id === 'documentos' && junta.adjuntos && junta.adjuntos.length > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                                                        {junta.adjuntos.length}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 min-h-[400px]">
                                    {renderTabContent()}
                                </div>
                            </div>

                            {/* Revisión del Director Médico */}
                            {junta.detallesDirector && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2 text-vdc-primary" />
                                            Revisión del Director Médico
                                        </h3>
                                    </div>

                                    <div className="p-6">
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{junta.detallesDirector}</p>
                                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center text-xs text-gray-500">
                                                <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                                                Auditado el {format(new Date(junta.updatedAt), "d 'de' MMMM, yyyy", { locale: es })}
                                            </div>
                                        </div>
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

export default JuntaDetailModalGerencial;
