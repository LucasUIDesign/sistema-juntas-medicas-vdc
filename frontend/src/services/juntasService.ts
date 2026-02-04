import { JuntaMedica, JuntaFilters, PaginatedResult, Paciente } from '../types';
import { DictamenMedicoData } from '../components/juntas/DictamenMedicoWizard';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('vdc_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    console.error('API Error Response:', errorData);

    // Check for validation errors object (backend usa 'details')
    if (errorData.details) {
      const messages = Object.entries(errorData.details)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      throw new Error(messages || 'Error de validación');
    }

    // Check for validation errors object (legacy, usa 'errors')
    if (errorData.errors) {
      const messages = Object.entries(errorData.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join(', ');
      throw new Error(messages || 'Error de validación');
    }

    // Check for single error field
    if (errorData.error) {
      throw new Error(errorData.error);
    }

    // Check for message field
    if (errorData.message) {
      throw new Error(errorData.message);
    }

    throw new Error('Error en la solicitud');
  }
  return response.json();
};

export interface CreateJuntaDTO {
  pacienteId: string;
  observaciones?: string;
  hora?: string;
}

export interface SaveDictamenDTO {
  dictamen: DictamenMedicoData;
  finalizar?: boolean;
}

export const juntasService = {
  /**
   * Get all juntas with optional filters
   */
  async getJuntas(filters?: JuntaFilters): Promise<PaginatedResult<JuntaMedica>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.medicoId) params.append('medicoId', filters.medicoId);
    if (filters?.estado) params.append('estado', filters.estado);

    const response = await fetch(`${API_URL}/juntas?${params}`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Get juntas by médico ID
   */
  async getJuntasByMedico(medicoId: string, filters?: JuntaFilters): Promise<PaginatedResult<JuntaMedica>> {
    return this.getJuntas({ ...filters, medicoId });
  },

  /**
   * Get single junta by ID with full details
   */
  async getJuntaById(id: string): Promise<JuntaMedica | null> {
    try {
      const response = await fetch(`${API_URL}/juntas/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      const data = await handleResponse(response);
      
      // Map 'documentos' from backend to 'adjuntos' in frontend
      if (data.documentos) {
        data.adjuntos = data.documentos.map((doc: any) => ({
          id: doc.id,
          nombre: doc.nombre,
          tipo: doc.tipo,
          url: doc.url,
          size: doc.size || 0,
          categoria: doc.categoria,
          uploadedAt: doc.createdAt,
        }));
        delete data.documentos;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching junta:', error);
      return null;
    }
  },

  /**
   * Create new junta
   */
  async createJunta(data: CreateJuntaDTO): Promise<JuntaMedica> {
    const response = await fetch(`${API_URL}/juntas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Create new junta for a specific medico (admin assigning shifts)
   */
  async createJuntaParaMedico(data: { pacienteId: string; medicoId: string; hora: string; fecha: string; lugar?: string; observaciones?: string }): Promise<JuntaMedica> {
    const response = await fetch(`${API_URL}/juntas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Update existing junta
   */
  async updateJunta(id: string, data: Partial<JuntaMedica>): Promise<JuntaMedica> {
    const response = await fetch(`${API_URL}/juntas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Save dictamen for a junta
   */
  async saveDictamen(juntaId: string, data: SaveDictamenDTO): Promise<{ message: string; juntaId: string }> {
    const response = await fetch(`${API_URL}/juntas/${juntaId}/dictamen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  /**
   * Get dictamen for a junta
   */
  async getDictamen(juntaId: string): Promise<{ dictamen: DictamenMedicoData | null; createdAt?: string; updatedAt?: string }> {
    const response = await fetch(`${API_URL}/juntas/${juntaId}/dictamen`, {
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  /**
   * Delete a junta (ADMIN/RRHH only)
   */
  async deleteJunta(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/juntas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar la junta');
    }
  },

  /**
   * Get all pacientes for autocomplete
   */
  async getPacientes(search?: string): Promise<Paciente[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${API_URL}/pacientes${params}`, {
      headers: getAuthHeaders(),
    });

    const data = await handleResponse(response);
    return data.map((p: any) => ({
      id: p.id,
      nombre: `${p.nombre} ${p.apellido}`.trim(),
      documento: p.numeroDocumento,
      empresa: '', // Not in DB yet
      correo: p.correo || '',
      telefono: p.telefono || '',
      domicilio: p.domicilio || '',
    }));
  },

  /**
   * Create new paciente
   */
  async createPaciente(data: { nombre: string; apellido: string; numeroDocumento: string; correo?: string; telefono?: string; domicilio?: string }): Promise<Paciente> {
    const response = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleResponse(response);
    // Backend returns { message, paciente: {...} }
    const pacienteData = result.paciente || result;
    return {
      id: pacienteData.id,
      nombre: `${pacienteData.nombre} ${pacienteData.apellido}`.trim(),
      documento: pacienteData.numeroDocumento,
      empresa: '',
    };
  },

  /**
   * Search pacientes by name or document
   */
  async searchPacientes(query: string): Promise<Paciente[]> {
    return this.getPacientes(query);
  },

  /**
   * Get all medicos for filters
   */
  async getMedicos(): Promise<{ id: string; nombre: string }[]> {
    try {
      const response = await fetch(`${API_URL}/medicos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Error fetching medicos');
        return [];
      }

      const data = await response.json();
      return data.map((m: any) => ({
        id: m.id,
        nombre: `${m.nombre || ''} ${m.apellido || ''}`.trim() || m.email,
      }));
    } catch (error) {
      console.error('Error fetching medicos:', error);
      return [];
    }
  },

  /**
   * Get juntas asignadas (turnos) for the current user
   */
  async getJuntasAsignadas(): Promise<any[]> {
    try {
      // Obtener turnos asignados al médico actual
      const response = await fetch(`${API_URL}/turnos`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        console.error('Error fetching turnos asignados');
        return [];
      }

      const turnos = await response.json();
      
      // Transformar al formato esperado por ProximasJuntas
      return turnos.map((turno: any) => ({
        id: turno.id,
        fecha: turno.fecha,
        hora: turno.hora,
        pacienteNombre: turno.pacienteNombre,
        pacienteDni: turno.pacienteDni,
        lugar: turno.lugar || 'Consultorio VDC',
        profesionales: [], // Por ahora vacío, se puede agregar después
      }));
    } catch (error) {
      console.error('Error fetching turnos asignados:', error);
      return [];
    }
  },

  /**
   * Upload document for a junta
   */
  async uploadDocumento(juntaId: string, file: File, categoria: string): Promise<any> {
    try {
      // Convertir archivo a Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extraer solo la parte Base64 (sin el prefijo data:...)
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API_URL}/juntas/${juntaId}/documentos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: file.name,
          tipo: file.type,
          contenido: base64,
          categoria,
          size: file.size,
        }),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Error uploading documento:', error);
      throw error;
    }
  },
};

