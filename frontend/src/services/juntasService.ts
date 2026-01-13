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
  
  // JUNTA 1: Pendiente con dictamen completo - Para que Director pueda aprobar
  juntas.push({
    id: 'junta-001',
    fecha: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '10:00',
    pacienteId: 'pac-001',
    pacienteNombre: 'Juan Pérez García',
    pacienteDni: '32.456.789',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional completa. Paciente presenta buenas condiciones generales.',
    aprobacion: false,
    estado: 'PENDIENTE',
    dictamen: {
      nombrePaciente: 'Juan Pérez García',
      dni: '32.456.789',
      diagnosticoPrincipal: 'Paciente en buen estado de salud general. Sin patologías que limiten su capacidad laboral. Exámenes de laboratorio dentro de parámetros normales.',
      aptitudLaboral: 'APTO',
      fechaDictamen: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isCompleto: true,
      datosCompletos: {
        // Identificación
        fechaNacimiento: '1985-03-15',
        sexo: 'M',
        estadoCivil: 'casado',
        domicilio: 'Av. San Martín 1234, Corrientes',
        telefono: '+54 379 4123456',
        email: 'jperez@email.com',
        obraSocial: 'OSDE',
        // Datos Laborales
        establecimiento: 'Escuela Técnica N° 1',
        cargo: 'Docente de Matemáticas',
        nivelEducativo: 'secundario',
        modalidad: 'tecnica',
        situacionRevista: 'titular',
        antiguedad: '12 años',
        cargaHoraria: '36 horas semanales',
        legajo: 'LEG-2012-0456',
        // Motivo Junta
        motivoJunta: ['Reincorporación laboral', 'Evaluación periódica'],
        fechaInicioLicencia: '2025-10-01',
        diagnosticosPrevios: 'Lumbalgia mecánica tratada con fisioterapia',
        // Antecedentes Médicos
        patologiasPrevias: 'Ninguna de relevancia',
        antecedentesQuirurgicos: 'Apendicectomía (2010)',
        alergias: 'Sin alergias conocidas',
        habitos: 'No fumador, actividad física regular',
        antecedentesFamiliares: 'Padre con HTA controlada',
        // Antecedentes Laborales
        licenciasAnteriores: 'Licencia por lumbalgia (Oct-Nov 2025)',
        accidentesLaborales: 'Sin antecedentes',
        factoresRiesgo: 'Posición de pie prolongada',
        // Enfermedad Actual
        sintomasPrincipales: 'Dolor lumbar que ha mejorado significativamente con tratamiento',
        evolucion: 'Favorable, con remisión casi completa de síntomas',
        tratamientosActuales: 'Ejercicios de fortalecimiento lumbar',
        interconsultas: 'Traumatología: alta médica',
        // Examen Físico
        presionArterial: '120/80 mmHg',
        frecuenciaCardiaca: '72 lpm',
        frecuenciaRespiratoria: '16 rpm',
        temperatura: '36.5 °C',
        peso: '78 kg',
        talla: '1.75 m',
        imc: '25.5',
        examenGeneral: 'Paciente en buen estado general. Columna sin dolor a la palpación. Movilidad conservada.',
        // Estudios
        laboratorio: 'Hemograma normal, VSG 8mm/h, PCR negativa',
        imagenes: 'RX columna lumbar: sin alteraciones significativas',
        estudiosFuncionales: 'Electrocardiograma normal',
        // Diagnóstico
        codigoCIE10: 'M54.5',
        naturalezaEnfermedad: 'comun',
        // Capacidad Laboral
        capacidadFuncional: 'Capacidad funcional conservada para tareas habituales',
        factoresLimitantes: 'Evitar cargas mayores a 15kg',
        // Dictamen
        restricciones: 'Evitar levantar objetos pesados por 30 días más',
        recomendaciones: 'Continuar con ejercicios de fortalecimiento. Control en 3 meses.',
        tiempoRecuperacion: 'Recuperación completa',
        // Profesionales
        medicoEvaluador1: 'Dr. Carlos Mendoza',
        matricula1: 'MP 12345',
        especialidad1: 'Medicina Laboral',
      },
    },
    adjuntos: [
      { id: 'adj-001', nombre: 'Examen_Psicologico.pdf', tipo: 'application/pdf', url: '#', size: 245000, categoria: 'EXAMEN_PSICOLOGICO', uploadedAt: ahora.toISOString() },
      { id: 'adj-002', nombre: 'Resultados_Bioquimicos.pdf', tipo: 'application/pdf', url: '#', size: 180000, categoria: 'RESULTADOS_BIOQUIMICOS', uploadedAt: ahora.toISOString() },
    ],
    createdAt: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // JUNTA 2: Pendiente con dictamen - Apto con restricciones
  juntas.push({
    id: 'junta-002',
    fecha: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '14:30',
    pacienteId: 'pac-002',
    pacienteNombre: 'María López Rodríguez',
    pacienteDni: '28.123.456',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional. Paciente con antecedentes de lumbalgia.',
    aprobacion: false,
    estado: 'PENDIENTE',
    dictamen: {
      nombrePaciente: 'María López Rodríguez',
      dni: '28.123.456',
      diagnosticoPrincipal: 'Lumbalgia crónica leve. Se recomienda evitar cargas mayores a 10kg y posiciones prolongadas de pie.',
      aptitudLaboral: 'APTO_CON_RESTRICCIONES',
      fechaDictamen: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isCompleto: true,
    },
    adjuntos: [
      { id: 'adj-003', nombre: 'Certificado_Aptitud.pdf', tipo: 'application/pdf', url: '#', size: 120000, categoria: 'CERTIFICADO_APTITUD_EX3', uploadedAt: ahora.toISOString() },
    ],
    createdAt: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // JUNTA 3: Pendiente - No apto
  juntas.push({
    id: 'junta-003',
    fecha: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '09:00',
    pacienteId: 'pac-003',
    pacienteNombre: 'Carlos Martínez Silva',
    pacienteDni: '35.789.012',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional. Paciente presenta condiciones que requieren tratamiento.',
    aprobacion: false,
    estado: 'PENDIENTE',
    dictamen: {
      nombrePaciente: 'Carlos Martínez Silva',
      dni: '35.789.012',
      diagnosticoPrincipal: 'Hipertensión arterial no controlada. Valores de presión arterial 160/100 mmHg. Requiere ajuste de medicación antes de retomar actividades laborales.',
      aptitudLaboral: 'NO_APTO',
      fechaDictamen: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isCompleto: true,
    },
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // JUNTA 4: Documentos pendientes - URGENTE
  const fechaLimiteUrgente = new Date(ahora);
  fechaLimiteUrgente.setHours(fechaLimiteUrgente.getHours() + 4);
  juntas.push({
    id: 'junta-004',
    fecha: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '11:00',
    pacienteId: 'pac-004',
    pacienteNombre: 'Ana Fernández Torres',
    pacienteDni: '30.456.123',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional - Faltan documentos',
    aprobacion: false,
    estado: 'DOCUMENTOS_PENDIENTES',
    documentosFaltantes: ['EXAMEN_PSICOLOGICO', 'RESULTADOS_BIOQUIMICOS'],
    fechaLimiteDocumentos: fechaLimiteUrgente.toISOString(),
    dictamen: {
      nombrePaciente: 'Ana Fernández Torres',
      dni: '30.456.123',
      diagnosticoPrincipal: 'Pendiente de completar estudios complementarios.',
      aptitudLaboral: '',
      fechaDictamen: '',
      isCompleto: false,
    },
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
  });

  // JUNTA 5: Aprobada por Director
  juntas.push({
    id: 'junta-005',
    fecha: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '15:00',
    pacienteId: 'pac-005',
    pacienteNombre: 'Roberto Sánchez Díaz',
    pacienteDni: '29.876.543',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional completada.',
    detallesDirector: 'Revisado y aprobado. El paciente cumple con todos los requisitos médicos para el puesto de trabajo solicitado.',
    aprobacion: true,
    estado: 'APROBADA',
    dictamen: {
      nombrePaciente: 'Roberto Sánchez Díaz',
      dni: '29.876.543',
      diagnosticoPrincipal: 'Paciente sano. Sin antecedentes patológicos relevantes.',
      aptitudLaboral: 'APTO',
      fechaDictamen: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      isCompleto: true,
    },
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // JUNTA 6: Rechazada
  juntas.push({
    id: 'junta-006',
    fecha: new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '08:30',
    pacienteId: 'pac-001',
    pacienteNombre: 'Juan Pérez García',
    pacienteDni: '32.456.789',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Evaluación médica ocupacional.',
    detallesDirector: 'Rechazado. La documentación presentada está incompleta y los estudios tienen más de 6 meses de antigüedad.',
    aprobacion: false,
    estado: 'RECHAZADA',
    dictamen: {
      nombrePaciente: 'Juan Pérez García',
      dni: '32.456.789',
      diagnosticoPrincipal: 'Documentación desactualizada.',
      aptitudLaboral: '',
      fechaDictamen: new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      isCompleto: false,
    },
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // JUNTA 7: Documentos pendientes - Normal
  const fechaLimiteNormal = new Date(ahora);
  fechaLimiteNormal.setHours(fechaLimiteNormal.getHours() + 48);
  juntas.push({
    id: 'junta-007',
    fecha: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    hora: '16:00',
    pacienteId: 'pac-002',
    pacienteNombre: 'María López Rodríguez',
    pacienteDni: '28.123.456',
    medicoId: 'user-001',
    medicoNombre: 'Dr. Carlos Mendoza',
    detalles: 'Segunda evaluación - Documentos en proceso',
    aprobacion: false,
    estado: 'DOCUMENTOS_PENDIENTES',
    documentosFaltantes: ['CERTIFICADO_APTITUD_EX3'],
    fechaLimiteDocumentos: fechaLimiteNormal.toISOString(),
    adjuntos: [],
    createdAt: new Date(ahora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: ahora.toISOString(),
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
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(j => 
        j.pacienteNombre.toLowerCase().includes(searchLower) ||
        j.dictamen?.dni?.includes(filters.search!) ||
        j.pacienteDni?.includes(filters.search!)
      );
    }
    
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
