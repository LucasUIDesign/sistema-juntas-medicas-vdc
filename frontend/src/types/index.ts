// User types
export type UserRole = 'MEDICO_INFERIOR' | 'MEDICO_SUPERIOR' | 'RRHH';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nombre: string;
}

// Junta Médica types
export type EstadoJunta = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

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
  pacienteId: string;
  pacienteNombre: string;
  medicoId: string;
  medicoNombre: string;
  detalles: string;
  aprobacion?: boolean;
  adjuntos?: Adjunto[];
  dictamen?: DictamenMedicoResumen;
  estado: EstadoJunta;
  createdAt: string;
  updatedAt: string;
}

// Resumen del dictamen para mostrar en historial
export interface DictamenMedicoResumen {
  nombrePaciente: string;
  dni: string;
  diagnosticoPrincipal: string;
  aptitudLaboral: string;
  fechaDictamen: string;
  isCompleto: boolean;
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
