// User types
export type UserRole = 'MEDICO_EVALUADOR' | 'DIRECTOR_MEDICO' | 'RRHH' | 'GERENCIAL' | 'ADMINISTRATIVO' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nombre: string;
}

// Junta Médica types
export type EstadoJunta = 'BORRADOR' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

// Documentos requeridos para una junta
export const DOCUMENTOS_REQUERIDOS: CategoriaDocumento[] = [
  'EXAMEN_PSICOLOGICO',
  'EXAMEN_PSICOLOGICO_PENITENCIARIA',
  'RESULTADOS_BIOQUIMICOS',
  'DD_JJ_EX1',
  'RESULTADO_MEDICO_EX2',
  'CERTIFICADO_APTITUD_EX3',
  'ESTUDIOS',
  'REQUERIMIENTO',
  'CONSTANCIA',
  'DEVOLUCION',
];

// Categorías de documentos médicos
export type CategoriaDocumento =
  | 'EXAMEN_PSICOLOGICO'
  | 'EXAMEN_PSICOLOGICO_PENITENCIARIA'
  | 'RESULTADOS_BIOQUIMICOS'
  | 'DD_JJ_EX1'
  | 'RESULTADO_MEDICO_EX2'
  | 'CERTIFICADO_APTITUD_EX3'
  | 'ESTUDIOS'
  | 'REQUERIMIENTO'
  | 'CONSTANCIA'
  | 'DEVOLUCION';

export const CATEGORIAS_DOCUMENTO: { value: CategoriaDocumento; label: string }[] = [
  { value: 'EXAMEN_PSICOLOGICO', label: 'Examen Psicológico' },
  { value: 'EXAMEN_PSICOLOGICO_PENITENCIARIA', label: 'Examen Psicológico Penitenciaria' },
  { value: 'RESULTADOS_BIOQUIMICOS', label: 'Resultados Bioquímicos' },
  { value: 'DD_JJ_EX1', label: 'DD JJ (Ex1)' },
  { value: 'RESULTADO_MEDICO_EX2', label: 'Resultado Médico (Ex2)' },
  { value: 'CERTIFICADO_APTITUD_EX3', label: 'Certificado Aptitud (Ex3)' },
  { value: 'ESTUDIOS', label: 'Subir Estudios' },
  { value: 'REQUERIMIENTO', label: 'Requerimiento' },
  { value: 'CONSTANCIA', label: 'Constancia' },
  { value: 'DEVOLUCION', label: 'Devolución' },
];

export interface Adjunto {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  size: number;
  categoria: CategoriaDocumento;
  uploadedAt: string;
}

export interface JuntaMedica {
  id: string;
  fecha: string;
  hora?: string; // Hora de la junta asignada
  pacienteId: string;
  pacienteNombre: string;
  pacienteDni?: string; // DNI del paciente
  numeroDocumento?: string; // Alias para pacienteDni
  medicoId: string;
  medicoNombre: string;
  detalles: string;
  detallesDirector?: string; // Detalles de evaluación del Director Médico
  aprobacion?: boolean;
  adjuntos?: Adjunto[];
  documentosCount?: number; // Conteo de documentos adjuntos (usado en lista)
  dictamen?: DictamenMedicoResumen;
  diagnosticoPrincipal?: string; // Diagnóstico principal (también en dictamen)
  aptitudLaboral?: string; // Aptitud laboral (también en dictamen)
  estado: EstadoJunta;
  documentosFaltantes?: CategoriaDocumento[]; // Documentos que faltan entregar
  fechaLimiteDocumentos?: string; // Fecha límite para entregar documentos (72hs)
  createdAt: string;
  updatedAt: string;
}

// Profesional médico participante
export interface ProfesionalParticipante {
  id: string;
  nombre: string;
  especialidad: string;
}

// Junta asignada (próxima a realizar)
export interface JuntaAsignada {
  id: string;
  fecha: string;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  lugar?: string;
  profesionales?: ProfesionalParticipante[];
}

// Resumen del dictamen para mostrar en historial
export interface DictamenMedicoResumen {
  // Datos básicos
  nombrePaciente: string;
  dni: string;
  diagnosticoPrincipal: string;
  aptitudLaboral: string;
  fechaDictamen: string;
  isCompleto: boolean;

  // Paso 1: Identificación
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  domicilio?: string;
  telefono?: string;
  email?: string;
  obraSocial?: string;
  // Paso 2: Datos Laborales
  establecimiento?: string;
  cargo?: string;
  nivelEducativo?: string;
  modalidad?: string;
  situacionRevista?: string;
  antiguedad?: string;
  cargaHoraria?: string;
  legajo?: string;
  // Paso 3: Motivo Junta
  motivoJunta?: string[] | string;
  fechaInicioLicencia?: string;
  diagnosticosPrevios?: string;
  // Paso 4: Antecedentes Médicos
  patologiasPrevias?: string;
  antecedentesQuirurgicos?: string;
  alergias?: string;
  habitos?: string;
  antecedentesFamiliares?: string;
  // Paso 5: Antecedentes Laborales
  licenciasAnteriores?: string;
  accidentesLaborales?: string;
  factoresRiesgo?: string;
  // Paso 6: Enfermedad Actual
  sintomasPrincipales?: string;
  evolucion?: string;
  tratamientosActuales?: string;
  interconsultas?: string;
  // Paso 7: Examen Físico
  presionArterial?: string;
  frecuenciaCardiaca?: string;
  frecuenciaRespiratoria?: string;
  temperatura?: string;
  peso?: string;
  talla?: string;
  imc?: string;
  examenGeneral?: string;
  // Paso 8: Estudios
  laboratorio?: string;
  imagenes?: string;
  estudiosFuncionales?: string;
  // Paso 9: Diagnóstico
  codigoCIE10?: string;
  naturalezaEnfermedad?: string;
  // Paso 10: Capacidad Laboral
  capacidadFuncional?: string;
  factoresLimitantes?: string;
  // Paso 11: Dictamen
  restricciones?: string;
  recomendaciones?: string;
  tiempoRecuperacion?: string;
  // Paso 12: Profesionales
  medicoEvaluador1?: string;
  matricula1?: string;
  especialidad1?: string;
  medicoEvaluador2?: string;
  matricula2?: string;
  especialidad2?: string;
}

export interface DocumentoParaSubir {
  file: File;
  categoria: CategoriaDocumento;
  preview?: string;
}

export interface CreateJuntaDTO {
  fecha: string;
  pacienteId: string;
  detalles: string;
  aprobacion?: boolean;
  documentos?: DocumentoParaSubir[];
}

export interface UpdateJuntaDTO {
  fecha?: string;
  pacienteId?: string;
  detalles?: string;
  detallesDirector?: string;
  aprobacion?: boolean;
  estado?: EstadoJunta;
}

// Paciente types
export interface Paciente {
  id: string;
  nombre: string;
  documento: string;
  empresa: string;
}

// Médico types
export interface Medico {
  id: string;
  nombre: string;
  especialidad: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

// API types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JuntaFilters {
  search?: string;
  fechaInicio?: string;
  fechaFin?: string;
  medicoId?: string;
  estado?: EstadoJunta;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  PERMISSION = 'PERMISSION'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: Record<string, string>;
}
