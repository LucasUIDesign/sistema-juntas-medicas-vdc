import { JuntaMedica, CreateJuntaDTO, JuntaFilters, PaginatedResult, Paciente, Medico, Adjunto, DictamenMedicoResumen, JuntaAsignada, CategoriaDocumento, DOCUMENTOS_REQUERIDOS } from '../types';
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
  const juntas: JuntaMedica[] = [];
  const ahora = new Date();
  
  // DEMO: Junta con documentos pendientes - URGENTE (menos de 12 horas)
  const fechaLimiteUrgente = new Date(ahora);
  fechaLimiteUrgente.setHours(fechaLimiteUrgente.getHours() + 4); // 4 horas restantes
  juntas.push({
    id: 'junta-001',
    fecha: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '10:00',
    pacienteId: 'pac-001',
    pacienteNombre: 'Juan Pérez García',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional - Faltan documentos',
    aprobacion: false,
    estado: 'DOCUMENTOS_PENDIENTES',
    documentosFaltantes: ['historia_clinica', 'estudios_complementarios'],
    fechaLimiteDocumentos: fechaLimiteUrgente.toISOString(),
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // DEMO: Junta con documentos pendientes - NORMAL (más de 12 horas)
  const fechaLimiteNormal = new Date(ahora);
  fechaLimiteNormal.setHours(fechaLimiteNormal.getHours() + 48); // 48 horas restantes
  juntas.push({
    id: 'junta-002',
    fecha: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '14:30',
    pacienteId: 'pac-002',
    pacienteNombre: 'María López Rodríguez',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional - Documentos en proceso',
    aprobacion: false,
    estado: 'DOCUMENTOS_PENDIENTES',
    documentosFaltantes: ['certificado_aptitud'],
    fechaLimiteDocumentos: fechaLimiteNormal.toISOString(),
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // DEMO: Junta con documentos pendientes - MUY URGENTE (menos de 1 hora)
  const fechaLimiteMuyUrgente = new Date(ahora);
  fechaLimiteMuyUrgente.setMinutes(fechaLimiteMuyUrgente.getMinutes() + 35); // 35 minutos restantes
  juntas.push({
    id: 'junta-003',
    fecha: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '09:00',
    pacienteId: 'pac-003',
    pacienteNombre: 'Carlos Martínez Silva',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional - URGENTE entregar documentos',
    aprobacion: false,
    estado: 'DOCUMENTOS_PENDIENTES',
    documentosFaltantes: ['historia_clinica', 'estudios_complementarios', 'certificado_aptitud'],
    fechaLimiteDocumentos: fechaLimiteMuyUrgente.toISOString(),
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // Juntas normales con otros estados
  juntas.push({
    id: 'junta-004',
    fecha: new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '11:00',
    pacienteId: 'pac-004',
    pacienteNombre: 'Ana Fernández Torres',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional completada satisfactoriamente.',
    aprobacion: true,
    estado: 'APROBADA',
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  });

  juntas.push({
    id: 'junta-005',
    fecha: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '15:00',
    pacienteId: 'pac-005',
    pacienteNombre: 'Roberto Sánchez Díaz',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional - Pendiente de revisión.',
    aprobacion: false,
    estado: 'PENDIENTE',
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  juntas.push({
    id: 'junta-006',
    fecha: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '08:30',
    pacienteId: 'pac-001',
    pacienteNombre: 'Juan Pérez García',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación rechazada por documentación incompleta.',
    aprobacion: false,
    estado: 'RECHAZADA',
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  });

  juntas.push({
    id: 'junta-007',
    fecha: new Date(ahora.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '16:00',
    pacienteId: 'pac-002',
    pacienteNombre: 'María López Rodríguez',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional aprobada.',
    aprobacion: true,
    estado: 'APROBADA',
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  return juntas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

// Mock juntas asignadas (próximas)
const generateMockJuntasAsignadas = (): JuntaAsignada[] => {
  const hoy = new Date();
  return [
    {
      id: 'asig-001',
      fecha: new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Mañana
      hora: '09:00',
      pacienteNombre: 'Roberto Gómez Fernández',
      pacienteDni: '32.456.789',
      lugar: 'Consultorio 3 - VDC Internacional',
    },
    {
      id: 'asig-002',
      fecha: new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Pasado mañana
      hora: '11:30',
      pacienteNombre: 'Laura Martínez Sosa',
      pacienteDni: '28.123.456',
      lugar: 'Consultorio 1 - VDC Internacional',
    },
    {
      id: 'asig-003',
      fecha: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // En 5 días
      hora: '14:00',
      pacienteNombre: 'Miguel Ángel Torres',
      pacienteDni: '35.789.012',
    },
  ];
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

  /**
   * Get juntas asignadas (próximas)
   */
  async getJuntasAsignadas(): Promise<JuntaAsignada[]> {
    await delay(200);
    return generateMockJuntasAsignadas();
  },

  /**
   * Subir documentos faltantes para una junta
   */
  async subirDocumentosFaltantes(juntaId: string, documentos: { file: File; categoria: CategoriaDocumento }[]): Promise<JuntaMedica> {
    await delay(400);
    
    const index = mockJuntas.findIndex(j => j.id === juntaId);
    if (index === -1) {
      throw new Error('Junta no encontrada');
    }
    
    const junta = mockJuntas[index];
    
    // Agregar documentos
    const nuevosAdjuntos: Adjunto[] = documentos.map((doc, idx) => ({
      id: `adj-${Date.now()}-${idx}`,
      nombre: doc.file.name,
      tipo: doc.file.type,
      url: URL.createObjectURL(doc.file),
      size: doc.file.size,
      categoria: doc.categoria,
      uploadedAt: new Date().toISOString(),
    }));
    
    // Actualizar documentos faltantes
    const categoriasSubidas = documentos.map(d => d.categoria);
    const nuevosFaltantes = junta.documentosFaltantes?.filter(
      cat => !categoriasSubidas.includes(cat)
    );
    
    // Si ya no faltan documentos, cambiar estado a PENDIENTE
    const nuevoEstado = nuevosFaltantes && nuevosFaltantes.length === 0 
      ? 'PENDIENTE' 
      : junta.estado;
    
    mockJuntas[index] = {
      ...junta,
      adjuntos: [...(junta.adjuntos || []), ...nuevosAdjuntos],
      documentosFaltantes: nuevosFaltantes,
      estado: nuevoEstado,
      updatedAt: new Date().toISOString(),
    };
    
    return mockJuntas[index];
  },

  /**
   * Verificar y rechazar juntas con documentos vencidos
   */
  async verificarDocumentosVencidos(): Promise<void> {
    const ahora = new Date();
    
    mockJuntas = mockJuntas.map(junta => {
      if (
        junta.estado === 'DOCUMENTOS_PENDIENTES' &&
        junta.fechaLimiteDocumentos &&
        new Date(junta.fechaLimiteDocumentos) < ahora
      ) {
        return {
          ...junta,
          estado: 'RECHAZADA' as const,
          detalles: junta.detalles + '\n\n[RECHAZADA AUTOMÁTICAMENTE: No se entregaron los documentos requeridos en el plazo de 72 horas]',
          updatedAt: new Date().toISOString(),
        };
      }
      return junta;
    });
  },
};
