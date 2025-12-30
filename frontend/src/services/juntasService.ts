import { JuntaMedica, CreateJuntaDTO, JuntaFilters, PaginatedResult, Paciente, Medico, Adjunto, DictamenMedicoResumen } from '../types';
import { DictamenMedicoData, isDictamenCompleto } from '../components/juntas/DictamenMedicoWizard';

// Mock data for development (Requirements 11.4, 11.5)
const MOCK_PACIENTES: Paciente[] = [
  { id: 'pac-001', nombre: 'Juan Pérez García', documento: '8-123-456', empresa: 'Constructora ABC' },
  { id: 'pac-002', nombre: 'María López Rodríguez', documento: '8-234-567', empresa: 'Minera del Norte' },
  { id: 'pac-003', nombre: 'Carlos Martínez Silva', documento: '8-345-678', empresa: 'Petrolera Nacional' },
  { id: 'pac-004', nombre: 'Ana Fernández Torres', documento: '8-456-789', empresa: 'Constructora ABC' },
  { id: 'pac-005', nombre: 'Roberto Sánchez Díaz', documento: '8-567-890', empresa: 'Industrias del Sur' },
];

const MOCK_MEDICOS: Medico[] = [
  { id: 'user-001', nombre: 'Dr. Carlos Mendoza', especialidad: 'Medicina Ocupacional' },
  { id: 'user-002', nombre: 'Dra. María González', especialidad: 'Medicina Ocupacional' },
];

// Generate mock juntas
const generateMockJuntas = (): JuntaMedica[] => {
  const estados: JuntaMedica['estado'][] = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];
  const juntas: JuntaMedica[] = [];
  
  for (let i = 1; i <= 10; i++) {
    const paciente = MOCK_PACIENTES[Math.floor(Math.random() * MOCK_PACIENTES.length)];
    const medico = MOCK_MEDICOS[Math.floor(Math.random() * MOCK_MEDICOS.length)];
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
    
    juntas.push({
      id: `junta-${String(i).padStart(3, '0')}`,
      fecha: fecha.toISOString(),
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombre,
      medicoId: medico.id,
      medicoNombre: medico.nombre,
      detalles: `Evaluación médica ocupacional del trabajador. Se realizaron exámenes de rutina incluyendo audiometría, espirometría y evaluación cardiovascular. Paciente presenta condiciones normales para continuar labores. Recomendaciones: mantener controles periódicos.`,
      aprobacion: Math.random() > 0.3,
      estado: estados[Math.floor(Math.random() * estados.length)],
      adjuntos: [],
      createdAt: fecha.toISOString(),
      updatedAt: fecha.toISOString(),
    });
  }
  
  return juntas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

let mockJuntas = generateMockJuntas();

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface CreateJuntaConDictamenDTO extends CreateJuntaDTO {
  dictamen?: DictamenMedicoData;
}

export const juntasService = {
  /**
   * Get all juntas with optional filters
   */
  async getJuntas(filters?: JuntaFilters): Promise<PaginatedResult<JuntaMedica>> {
    await delay(300);
    
    let filtered = [...mockJuntas];
    
    // Apply filters
    if (filters?.medicoId) {
      filtered = filtered.filter(j => j.medicoId === filters.medicoId);
    }
    
    if (filters?.fechaInicio) {
      const inicio = new Date(filters.fechaInicio);
      filtered = filtered.filter(j => new Date(j.fecha) >= inicio);
    }
    
    if (filters?.fechaFin) {
      const fin = new Date(filters.fechaFin);
      filtered = filtered.filter(j => new Date(j.fecha) <= fin);
    }
    
    if (filters?.estado) {
      filtered = filtered.filter(j => j.estado === filters.estado);
    }
    
    // Apply sorting
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof JuntaMedica];
        const bVal = b[filters.sortBy as keyof JuntaMedica];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return filters.sortOrder === 'desc' 
            ? bVal.localeCompare(aVal) 
            : aVal.localeCompare(bVal);
        }
        return 0;
      });
    }
    
    // Apply pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filtered.slice(start, end);
    
    return {
      data: paginatedData,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  },

  /**
   * Get juntas by médico ID
   */
  async getJuntasByMedico(medicoId: string, filters?: JuntaFilters): Promise<PaginatedResult<JuntaMedica>> {
    return this.getJuntas({ ...filters, medicoId });
  },

  /**
   * Get single junta by ID
   */
  async getJuntaById(id: string): Promise<JuntaMedica | null> {
    await delay(200);
    return mockJuntas.find(j => j.id === id) || null;
  },

  /**
   * Create new junta
   */
  async createJunta(data: CreateJuntaConDictamenDTO, userId: string, userName: string): Promise<JuntaMedica> {
    await delay(400);
    
    const paciente = MOCK_PACIENTES.find(p => p.id === data.pacienteId);
    if (!paciente) {
      throw new Error('Paciente no encontrado');
    }

    // Procesar documentos adjuntos
    const adjuntos: Adjunto[] = [];
    if (data.documentos && data.documentos.length > 0) {
      data.documentos.forEach((doc, idx) => {
        adjuntos.push({
          id: `adj-${Date.now()}-${idx}`,
          nombre: doc.file.name,
          tipo: doc.file.type,
          url: URL.createObjectURL(doc.file),
          size: doc.file.size,
          categoria: doc.categoria,
          uploadedAt: new Date().toISOString(),
        });
      });
    }

    // Procesar dictamen si existe
    let dictamenResumen: DictamenMedicoResumen | undefined;
    if (data.dictamen) {
      dictamenResumen = {
        nombrePaciente: data.dictamen.nombreCompleto,
        dni: data.dictamen.dni,
        diagnosticoPrincipal: data.dictamen.diagnosticoPrincipal,
        aptitudLaboral: data.dictamen.aptitudLaboral,
        fechaDictamen: data.dictamen.fechaDictamen,
        isCompleto: isDictamenCompleto(data.dictamen),
      };
    }
    
    const newJunta: JuntaMedica = {
      id: `junta-${String(mockJuntas.length + 1).padStart(3, '0')}`,
      fecha: data.fecha,
      pacienteId: data.pacienteId,
      pacienteNombre: paciente.nombre,
      medicoId: userId,
      medicoNombre: userName,
      detalles: data.detalles,
      aprobacion: data.aprobacion || false,
      estado: 'PENDIENTE',
      adjuntos: adjuntos,
      dictamen: dictamenResumen,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockJuntas = [newJunta, ...mockJuntas];
    return newJunta;
  },

  /**
   * Update existing junta
   */
  async updateJunta(id: string, data: Partial<JuntaMedica>): Promise<JuntaMedica> {
    await delay(300);
    
    const index = mockJuntas.findIndex(j => j.id === id);
    if (index === -1) {
      throw new Error('Junta no encontrada');
    }
    
    mockJuntas[index] = {
      ...mockJuntas[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return mockJuntas[index];
  },

  /**
   * Get all pacientes for autocomplete
   */
  async getPacientes(search?: string): Promise<Paciente[]> {
    await delay(150);
    
    if (!search) return MOCK_PACIENTES;
    
    const searchLower = search.toLowerCase();
    return MOCK_PACIENTES.filter(p => 
      p.nombre.toLowerCase().includes(searchLower) ||
      p.documento.includes(search)
    );
  },

  /**
   * Get all médicos for autocomplete
   */
  async getMedicos(): Promise<Medico[]> {
    await delay(150);
    return MOCK_MEDICOS;
  },
};
