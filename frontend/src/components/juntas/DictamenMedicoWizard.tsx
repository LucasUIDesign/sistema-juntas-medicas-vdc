import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  UserIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  DocumentMagnifyingGlassIcon,
  BeakerIcon,
  DocumentCheckIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// Tipos para el formulario
export interface DictamenMedicoData {
  // Paso 1: Datos de Identificación
  nombreCompleto: string;
  dni: string;
  fechaNacimiento: string;
  sexo: string;
  estadoCivil: string;
  domicilio: string;
  telefono: string;
  email: string;
  obraSocial: string;
  // Paso 2: Datos Laborales
  establecimiento: string;
  cargo: string;
  nivelEducativo: string;
  modalidad: string;
  situacionRevista: string;
  antiguedad: string;
  cargaHoraria: string;
  legajo: string;
  // Paso 3: Motivo de la Junta
  motivoJunta: string[];
  fechaInicioLicencia: string;
  diagnosticosPrevios: string;
  // Paso 4: Antecedentes Médicos
  patologiasPrevias: string;
  antecedentesQuirurgicos: string;
  alergias: string;
  habitos: string;
  antecedentesFamiliares: string;
  // Paso 5: Antecedentes Laborales
  licenciasAnteriores: string;
  accidentesLaborales: string;
  factoresRiesgo: string;
  // Paso 6: Enfermedad Actual
  sintomasPrincipales: string;
  evolucion: string;
  tratamientosActuales: string;
  interconsultas: string;
  // Paso 7: Examen Físico
  presionArterial: string;
  frecuenciaCardiaca: string;
  frecuenciaRespiratoria: string;
  temperatura: string;
  peso: string;
  talla: string;
  imc: string;
  examenGeneral: string;
  // Paso 8: Estudios Complementarios
  laboratorio: string;
  imagenes: string;
  estudiosFuncionales: string;
  // Paso 9: Diagnóstico
  diagnosticoPrincipal: string;
  codigoCIE10: string;
  naturalezaEnfermedad: string;
  // Paso 10: Evaluación Capacidad Laboral
  capacidadFuncional: string;
  factoresLimitantes: string;
  // Paso 11: Dictamen y Recomendaciones
  aptitudLaboral: string;
  restricciones: string;
  recomendaciones: string;
  tiempoRecuperacion: string;
  // Paso 12: Profesionales
  medicoEvaluador1: string;
  matricula1: string;
  especialidad1: string;
  medicoEvaluador2: string;
  matricula2: string;
  especialidad2: string;
  fechaDictamen: string;
}

// Función para verificar si el dictamen está completo
export const isDictamenCompleto = (data: DictamenMedicoData): boolean => {
  // Solo requerimos los campos mínimos esenciales
  const camposRequeridos: (keyof DictamenMedicoData)[] = [
    'nombreCompleto', 'dni',
  ];

  for (const campo of camposRequeridos) {
    const valor = data[campo];
    if (Array.isArray(valor)) {
      if (valor.length === 0) return false;
    } else if (!valor || valor.trim() === '') {
      return false;
    }
  }

  return true;
};

// Función para contar campos llenos
export const contarCamposLlenos = (data: DictamenMedicoData): { llenos: number; total: number } => {
  const campos = Object.keys(data) as (keyof DictamenMedicoData)[];
  let llenos = 0;
  const vacios: string[] = [];

  for (const campo of campos) {
    const valor = data[campo];
    if (Array.isArray(valor)) {
      if (valor.length > 0) {
        llenos++;
      } else {
        vacios.push(campo);
      }
    } else if (valor && valor.trim() !== '') {
      llenos++;
    } else {
      vacios.push(campo);
    }
  }

  // Debug: mostrar campos vacíos en consola
  if (vacios.length > 0 && vacios.length < 10) {
    console.log('Campos vacíos:', vacios);
  }

  return { llenos, total: campos.length };
};

const initialValues: DictamenMedicoData = {
  nombreCompleto: '', dni: '', fechaNacimiento: '', sexo: '', estadoCivil: '',
  domicilio: '', telefono: '', email: '', obraSocial: '',
  establecimiento: '', cargo: '', nivelEducativo: '', modalidad: '',
  situacionRevista: '', antiguedad: '', cargaHoraria: '', legajo: '',
  motivoJunta: [], fechaInicioLicencia: '', diagnosticosPrevios: '',
  patologiasPrevias: '', antecedentesQuirurgicos: '', alergias: '', habitos: '', antecedentesFamiliares: '',
  licenciasAnteriores: '', accidentesLaborales: '', factoresRiesgo: '',
  sintomasPrincipales: '', evolucion: '', tratamientosActuales: '', interconsultas: '',
  presionArterial: '', frecuenciaCardiaca: '', frecuenciaRespiratoria: '', temperatura: '',
  peso: '', talla: '', imc: '', examenGeneral: '',
  laboratorio: '', imagenes: '', estudiosFuncionales: '',
  diagnosticoPrincipal: '', codigoCIE10: '', naturalezaEnfermedad: '',
  capacidadFuncional: '', factoresLimitantes: '',
  aptitudLaboral: '', restricciones: '', recomendaciones: '', tiempoRecuperacion: '',
  medicoEvaluador1: '', matricula1: '', especialidad1: '',
  medicoEvaluador2: '', matricula2: '', especialidad2: '', fechaDictamen: '',
};

const PASOS = [
  { id: 1, nombre: 'Identificación', icon: UserIcon },
  { id: 2, nombre: 'Datos Laborales', icon: BriefcaseIcon },
  { id: 3, nombre: 'Motivo Junta', icon: ClipboardDocumentListIcon },
  { id: 4, nombre: 'Antec. Médicos', icon: HeartIcon },
  { id: 5, nombre: 'Antec. Laborales', icon: BriefcaseIcon },
  { id: 6, nombre: 'Enfermedad Actual', icon: DocumentMagnifyingGlassIcon },
  { id: 7, nombre: 'Examen Físico', icon: HeartIcon },
  { id: 8, nombre: 'Estudios', icon: BeakerIcon },
  { id: 9, nombre: 'Diagnóstico', icon: DocumentCheckIcon },
  { id: 10, nombre: 'Capacidad Laboral', icon: ClipboardDocumentListIcon },
  { id: 11, nombre: 'Dictamen', icon: DocumentCheckIcon },
  { id: 12, nombre: 'Profesionales', icon: UserGroupIcon },
];

const MOTIVOS_JUNTA = [
  'Licencia por enfermedad prolongada',
  'Reincorporación laboral',
  'Cambio de funciones',
  'Jubilación por invalidez',
  'Accidente de trabajo',
  'Enfermedad profesional',
  'Evaluación periódica',
  'Otro',
];

// Campos por paso para verificar completitud
const CAMPOS_POR_PASO: Record<number, (keyof DictamenMedicoData)[]> = {
  1: ['nombreCompleto', 'dni', 'fechaNacimiento', 'sexo', 'estadoCivil', 'domicilio', 'telefono', 'email', 'obraSocial'],
  2: ['establecimiento', 'cargo', 'nivelEducativo', 'modalidad', 'situacionRevista', 'antiguedad', 'cargaHoraria', 'legajo'],
  3: ['motivoJunta', 'fechaInicioLicencia', 'diagnosticosPrevios'],
  4: ['patologiasPrevias', 'antecedentesQuirurgicos', 'alergias', 'habitos', 'antecedentesFamiliares'],
  5: ['licenciasAnteriores', 'accidentesLaborales', 'factoresRiesgo'],
  6: ['sintomasPrincipales', 'evolucion', 'tratamientosActuales', 'interconsultas'],
  7: ['presionArterial', 'frecuenciaCardiaca', 'frecuenciaRespiratoria', 'temperatura', 'peso', 'talla', 'imc', 'examenGeneral'],
  8: ['laboratorio', 'imagenes', 'estudiosFuncionales'],
  9: ['diagnosticoPrincipal', 'codigoCIE10', 'naturalezaEnfermedad'],
  10: ['capacidadFuncional', 'factoresLimitantes'],
  11: ['aptitudLaboral', 'restricciones', 'recomendaciones', 'tiempoRecuperacion'],
  12: ['medicoEvaluador1', 'matricula1', 'especialidad1', 'medicoEvaluador2', 'matricula2', 'especialidad2', 'fechaDictamen'],
};

const isPasoCompleto = (paso: number, values: DictamenMedicoData): boolean => {
  const campos = CAMPOS_POR_PASO[paso];
  for (const campo of campos) {
    const valor = values[campo];
    if (Array.isArray(valor)) {
      if (valor.length > 0) return true; // Al menos un campo lleno
    } else if (valor && valor.trim() !== '') {
      return true; // Al menos un campo lleno
    }
  }
  return false;
};

const isPasoTodoLleno = (paso: number, values: DictamenMedicoData): boolean => {
  const campos = CAMPOS_POR_PASO[paso];
  for (const campo of campos) {
    const valor = values[campo];
    if (Array.isArray(valor)) {
      if (valor.length === 0) return false;
    } else if (!valor || valor.trim() === '') {
      return false;
    }
  }
  return true;
};

interface DictamenMedicoWizardProps {
  onComplete: (data: DictamenMedicoData, isCompleto: boolean) => void;
  onCancel?: () => void;
  initialData?: DictamenMedicoData;
  hideProfesionales?: boolean;
}

const DictamenMedicoWizard = ({ onComplete, onCancel, initialData, hideProfesionales = false }: DictamenMedicoWizardProps) => {
  const [pasoActual, setPasoActual] = useState(1);

  // Filtrar pasos si hideProfesionales está activo
  const pasosVisibles = hideProfesionales ? PASOS.filter(p => p.id !== 12) : PASOS;
  const totalPasos = pasosVisibles.length;

  const avanzarPaso = () => {
    const maxPaso = hideProfesionales ? 11 : 12;
    if (pasoActual < maxPaso) {
      setPasoActual(pasoActual + 1);
    }
  };

  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };


  const renderPaso = (values: DictamenMedicoData, setFieldValue: (field: string, value: unknown) => void) => {
    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary";
    const inputClassRequired = (value: string | undefined) =>
      `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary ${!value || value.trim() === '' ? 'border-red-400 bg-red-50' : 'border-gray-300'
      }`;
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const labelClassRequired = "block text-sm font-medium text-gray-700 mb-1 after:content-['*'] after:ml-0.5 after:text-red-500";

    switch (pasoActual) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClassRequired}>Nombre Completo</label>
              <Field name="nombreCompleto" className={inputClassRequired(values.nombreCompleto)} placeholder="Apellido y Nombre" />
              {!values.nombreCompleto && <p className="text-xs text-red-500 mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className={labelClassRequired}>DNI</label>
              <Field name="dni" className={inputClassRequired(values.dni)} placeholder="12345678" />
              {!values.dni && <p className="text-xs text-red-500 mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className={labelClass}>Fecha de Nacimiento</label>
              <Field name="fechaNacimiento" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sexo</label>
              <Field as="select" name="sexo" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">Otro</option>
              </Field>
            </div>
            <div>
              <label className={labelClass}>Estado Civil</label>
              <Field as="select" name="estadoCivil" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="divorciado">Divorciado/a</option>
                <option value="viudo">Viudo/a</option>
              </Field>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Domicilio</label>
              <Field name="domicilio" className={inputClass} placeholder="Calle, Número, Ciudad" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <Field name="telefono" className={inputClass} placeholder="+54 11 1234-5678" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <Field name="email" type="email" className={inputClass} placeholder="correo@ejemplo.com" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Obra Social</label>
              <Field name="obraSocial" className={inputClass} placeholder="Nombre de la obra social" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Establecimiento</label>
              <Field name="establecimiento" className={inputClass} placeholder="Nombre del establecimiento educativo" />
            </div>
            <div>
              <label className={labelClass}>Cargo</label>
              <Field name="cargo" className={inputClass} placeholder="Ej: Docente de grado" />
            </div>
            <div>
              <label className={labelClass}>Nivel Educativo</label>
              <Field as="select" name="nivelEducativo" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="inicial">Inicial</option>
                <option value="primario">Primario</option>
                <option value="secundario">Secundario</option>
                <option value="superior">Superior</option>
                <option value="especial">Especial</option>
              </Field>
            </div>
            <div>
              <label className={labelClass}>Modalidad</label>
              <Field as="select" name="modalidad" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="comun">Común</option>
                <option value="especial">Especial</option>
                <option value="adultos">Adultos</option>
                <option value="tecnica">Técnica</option>
              </Field>
            </div>
            <div>
              <label className={labelClass}>Situación de Revista</label>
              <Field as="select" name="situacionRevista" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="titular">Titular</option>
                <option value="interino">Interino</option>
                <option value="suplente">Suplente</option>
                <option value="contratado">Contratado</option>
              </Field>
            </div>
            <div>
              <label className={labelClass}>Antigüedad</label>
              <Field name="antiguedad" className={inputClass} placeholder="Ej: 10 años" />
            </div>
            <div>
              <label className={labelClass}>Carga Horaria</label>
              <Field name="cargaHoraria" className={inputClass} placeholder="Ej: 36 horas semanales" />
            </div>
            <div>
              <label className={labelClass}>Legajo</label>
              <Field name="legajo" className={inputClass} placeholder="Número de legajo" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Motivo de la Junta Médica</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {MOTIVOS_JUNTA.map((motivo) => {
                  const motivosArray = Array.isArray(values.motivoJunta) ? values.motivoJunta : [];
                  const isSelected = motivosArray.includes(motivo);
                  return (
                    <div
                      key={motivo}
                      onClick={() => {
                        const currentMotivos = Array.isArray(values.motivoJunta) ? values.motivoJunta : [];
                        const nuevosMotivos = isSelected
                          ? currentMotivos.filter(m => m !== motivo)
                          : [...currentMotivos, motivo];
                        setFieldValue('motivoJunta', nuevosMotivos);
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${isSelected
                        ? 'bg-vdc-primary/10 border-vdc-primary'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {/* Custom Checkbox Visual */}
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${isSelected
                        ? 'bg-vdc-primary border-vdc-primary'
                        : 'bg-white border-gray-300'
                        }`}>
                        {isSelected && (
                          <CheckIcon className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-vdc-primary' : 'text-gray-700'}`}>{motivo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelClass}>Fecha de Inicio de Licencia</label>
              <Field name="fechaInicioLicencia" type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Diagnósticos Previos</label>
              <Field as="textarea" name="diagnosticosPrevios" rows={3} className={inputClass}
                placeholder="Detalle los diagnósticos previos relacionados con el motivo de la junta" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Patologías Previas</label>
              <Field as="textarea" name="patologiasPrevias" rows={2} className={inputClass}
                placeholder="Diabetes, HTA, cardiopatías, etc." />
            </div>
            <div>
              <label className={labelClass}>Antecedentes Quirúrgicos</label>
              <Field as="textarea" name="antecedentesQuirurgicos" rows={2} className={inputClass}
                placeholder="Cirugías previas, año y tipo" />
            </div>
            <div>
              <label className={labelClass}>Alergias</label>
              <Field name="alergias" className={inputClass} placeholder="Medicamentos, alimentos, otros" />
            </div>
            <div>
              <label className={labelClass}>Hábitos</label>
              <Field as="textarea" name="habitos" rows={2} className={inputClass}
                placeholder="Tabaquismo, alcohol, actividad física, etc." />
            </div>
            <div>
              <label className={labelClass}>Antecedentes Familiares</label>
              <Field as="textarea" name="antecedentesFamiliares" rows={2} className={inputClass}
                placeholder="Enfermedades hereditarias, patologías familiares relevantes" />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Licencias Anteriores</label>
              <Field as="textarea" name="licenciasAnteriores" rows={3} className={inputClass}
                placeholder="Detalle licencias médicas previas, duración y motivo" />
            </div>
            <div>
              <label className={labelClass}>Accidentes Laborales</label>
              <Field as="textarea" name="accidentesLaborales" rows={3} className={inputClass}
                placeholder="Accidentes de trabajo previos, fecha y secuelas" />
            </div>
            <div>
              <label className={labelClass}>Factores de Riesgo Laboral</label>
              <Field as="textarea" name="factoresRiesgo" rows={3} className={inputClass}
                placeholder="Exposición a ruido, sustancias, estrés laboral, etc." />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Síntomas Principales</label>
              <Field as="textarea" name="sintomasPrincipales" rows={3} className={inputClass}
                placeholder="Describa los síntomas principales que presenta el paciente" />
            </div>
            <div>
              <label className={labelClass}>Evolución</label>
              <Field as="textarea" name="evolucion" rows={3} className={inputClass}
                placeholder="Evolución de la enfermedad desde su inicio" />
            </div>
            <div>
              <label className={labelClass}>Tratamientos Actuales</label>
              <Field as="textarea" name="tratamientosActuales" rows={3} className={inputClass}
                placeholder="Medicación actual, terapias, rehabilitación" />
            </div>
            <div>
              <label className={labelClass}>Interconsultas</label>
              <Field as="textarea" name="interconsultas" rows={2} className={inputClass}
                placeholder="Especialistas consultados y sus conclusiones" />
            </div>
          </div>
        );


      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">Signos Vitales</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Presión Arterial</label>
                <Field name="presionArterial" className={inputClass} placeholder="120/80 mmHg" />
              </div>
              <div>
                <label className={labelClass}>Frec. Cardíaca</label>
                <Field name="frecuenciaCardiaca" className={inputClass} placeholder="72 lpm" />
              </div>
              <div>
                <label className={labelClass}>Frec. Respiratoria</label>
                <Field name="frecuenciaRespiratoria" className={inputClass} placeholder="16 rpm" />
              </div>
              <div>
                <label className={labelClass}>Temperatura</label>
                <Field name="temperatura" className={inputClass} placeholder="36.5 °C" />
              </div>
              <div>
                <label className={labelClass}>Peso</label>
                <Field name="peso" className={inputClass} placeholder="70 kg" />
              </div>
              <div>
                <label className={labelClass}>Talla</label>
                <Field name="talla" className={inputClass} placeholder="1.70 m" />
              </div>
              <div>
                <label className={labelClass}>IMC</label>
                <Field name="imc" className={inputClass} placeholder="24.2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Examen General por Sistemas</label>
              <Field as="textarea" name="examenGeneral" rows={5} className={inputClass}
                placeholder="Cardiovascular, Respiratorio, Neurológico, Osteoarticular, etc." />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Laboratorio</label>
              <Field as="textarea" name="laboratorio" rows={3} className={inputClass}
                placeholder="Resultados de análisis de laboratorio relevantes" />
            </div>
            <div>
              <label className={labelClass}>Imágenes</label>
              <Field as="textarea" name="imagenes" rows={3} className={inputClass}
                placeholder="Radiografías, ecografías, TAC, RMN, etc." />
            </div>
            <div>
              <label className={labelClass}>Estudios Funcionales</label>
              <Field as="textarea" name="estudiosFuncionales" rows={3} className={inputClass}
                placeholder="Espirometría, audiometría, electrocardiograma, etc." />
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Diagnóstico Principal</label>
              <Field as="textarea" name="diagnosticoPrincipal" rows={3} className={inputClass}
                placeholder="Diagnóstico principal de la evaluación" />
            </div>
            <div>
              <label className={labelClass}>Código CIE-10</label>
              <Field name="codigoCIE10" className={inputClass} placeholder="Ej: M54.5" />
            </div>
            <div>
              <label className={labelClass}>Naturaleza de la Enfermedad</label>
              <Field as="select" name="naturalezaEnfermedad" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="comun">Enfermedad común</option>
                <option value="profesional">Enfermedad profesional</option>
                <option value="accidente_trabajo">Accidente de trabajo</option>
                <option value="accidente_in_itinere">Accidente in itinere</option>
              </Field>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Capacidad Funcional</label>
              <Field as="textarea" name="capacidadFuncional" rows={4} className={inputClass}
                placeholder="Evaluación de la capacidad funcional del paciente para realizar sus tareas habituales" />
            </div>
            <div>
              <label className={labelClass}>Factores Limitantes</label>
              <Field as="textarea" name="factoresLimitantes" rows={4} className={inputClass}
                placeholder="Factores que limitan la capacidad laboral del paciente" />
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Aptitud Laboral</label>
              <Field as="select" name="aptitudLaboral" className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="apto">Apto</option>
                <option value="apto_con_restricciones">Apto con restricciones</option>
                <option value="no_apto_temporario">No apto temporario</option>
                <option value="no_apto_definitivo">No apto definitivo</option>
              </Field>
            </div>
            <div>
              <label className={labelClass}>Restricciones</label>
              <Field as="textarea" name="restricciones" rows={3} className={inputClass}
                placeholder="Restricciones laborales recomendadas" />
            </div>
            <div>
              <label className={labelClass}>Recomendaciones</label>
              <Field as="textarea" name="recomendaciones" rows={3} className={inputClass}
                placeholder="Recomendaciones médicas y laborales" />
            </div>
            <div>
              <label className={labelClass}>Tiempo Estimado de Recuperación</label>
              <Field name="tiempoRecuperacion" className={inputClass} placeholder="Ej: 30 días, 3 meses, etc." />
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Médico Evaluador Principal</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nombre Completo</label>
                  <Field name="medicoEvaluador1" className={inputClass} placeholder="Dr./Dra. Nombre Apellido" />
                </div>
                <div>
                  <label className={labelClass}>Matrícula</label>
                  <Field name="matricula1" className={inputClass} placeholder="MP 12345" />
                </div>
                <div>
                  <label className={labelClass}>Especialidad</label>
                  <Field name="especialidad1" className={inputClass} placeholder="Medicina Laboral" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Médico Evaluador Secundario (opcional)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Nombre Completo</label>
                  <Field name="medicoEvaluador2" className={inputClass} placeholder="Dr./Dra. Nombre Apellido" />
                </div>
                <div>
                  <label className={labelClass}>Matrícula</label>
                  <Field name="matricula2" className={inputClass} placeholder="MP 12345" />
                </div>
                <div>
                  <label className={labelClass}>Especialidad</label>
                  <Field name="especialidad2" className={inputClass} placeholder="Especialidad" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Fecha del Dictamen</label>
              <Field name="fechaDictamen" type="date" className={inputClass} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header con progreso */}
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-vdc-navy mb-3 sm:mb-4">
          Dictamen Médico - Junta Médica Laboral
        </h3>

        {/* Indicador de pasos */}
        <Formik
          initialValues={initialData || initialValues}
          onSubmit={() => { }}
          enableReinitialize
        >
          {({ values, setFieldValue }) => (
            <>
              {/* Mobile: Indicador simplificado */}
              <div className="sm:hidden mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Paso {pasoActual}/{totalPasos}
                  </span>
                  <span className="text-xs text-gray-500">
                    {PASOS[pasoActual - 1].nombre}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-vdc-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(pasoActual / totalPasos) * 100}%` }}
                  />
                </div>
              </div>

              {/* Desktop: Indicador completo */}
              <div className="hidden sm:flex items-center justify-between overflow-x-auto pb-2">
                {pasosVisibles.map((paso, index) => {
                  const Icon = paso.icon;
                  const isActive = paso.id === pasoActual;
                  const tieneAlgo = isPasoCompleto(paso.id, values);
                  const todoLleno = isPasoTodoLleno(paso.id, values);

                  return (
                    <div key={paso.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setPasoActual(paso.id)}
                        className="flex flex-col items-center min-w-[50px] lg:min-w-[60px] cursor-pointer"
                      >
                        <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-colors ${isActive
                          ? 'bg-vdc-primary text-white'
                          : todoLleno
                            ? 'bg-vdc-success text-white'
                            : tieneAlgo
                              ? 'bg-yellow-400 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                          {todoLleno ? (
                            <CheckIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          ) : tieneAlgo ? (
                            <ExclamationCircleIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          ) : (
                            <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          )}
                        </div>
                        <span className={`text-[10px] lg:text-xs mt-1 text-center ${isActive ? 'text-vdc-primary font-medium' : 'text-gray-500'
                          }`}>
                          {paso.nombre}
                        </span>
                      </button>
                      {index < pasosVisibles.length - 1 && (
                        <div className={`w-3 lg:w-4 h-0.5 mx-0.5 lg:mx-1 ${todoLleno ? 'bg-vdc-success' : tieneAlgo ? 'bg-yellow-400' : 'bg-gray-200'
                          }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Contenido del formulario */}
              <Form>
                <div className="p-4 sm:p-6">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm text-gray-500">
                      Paso {pasoActual} de {totalPasos}: <span className="font-medium text-gray-700">{PASOS[pasoActual - 1].nombre}</span>
                    </span>
                    {/* Indicador de estado */}
                    {isPasoTodoLleno(pasoActual, values) ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full w-fit">
                        Completo
                      </span>
                    ) : isPasoCompleto(pasoActual, values) ? (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full w-fit">
                        Incompleto
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full w-fit">
                        Sin completar
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pasoActual}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderPaso(values, setFieldValue)}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navegación */}
                <div className="border-t border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
                  <div className="flex items-center space-x-4 order-2 sm:order-1">
                    {onCancel && (
                      <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                    )}
                    {/* Estado general - solo mostrar contador de campos */}
                    <div className="text-xs text-gray-500 hidden sm:block">
                      <span className="text-gray-600">
                        {contarCamposLlenos(values).llenos}/{contarCamposLlenos(values).total} campos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={retrocederPaso}
                      disabled={pasoActual === 1}
                      className={`flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pasoActual === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      <ChevronLeftIcon className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {pasoActual < (hideProfesionales ? 11 : 12) ? (
                      <button
                        type="button"
                        onClick={avanzarPaso}
                        className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-vdc-primary text-white rounded-lg text-sm font-medium hover:bg-vdc-primary/90 transition-colors"
                      >
                        <span className="hidden sm:inline">Siguiente</span>
                        <span className="sm:hidden">Sig.</span>
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const { llenos, total } = contarCamposLlenos(values);
                          if (llenos < total) {
                            const vacios: string[] = [];
                            const campos = Object.keys(values) as (keyof DictamenMedicoData)[];
                            for (const campo of campos) {
                              const valor = values[campo];
                              if (Array.isArray(valor)) {
                                if (valor.length === 0) vacios.push(campo);
                              } else if (!valor || valor.trim() === '') {
                                vacios.push(campo);
                              }
                            }
                            console.log('⚠️ CAMPOS VACÍOS AL GUARDAR:', vacios);
                            console.log(`📊 Completado: ${llenos}/${total} campos`);
                          }
                          onComplete(values, isDictamenCompleto(values));
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-vdc-success text-white rounded-lg text-sm font-medium hover:bg-vdc-success/90 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Guardar
                      </button>
                    )}
                  </div>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default DictamenMedicoWizard;
