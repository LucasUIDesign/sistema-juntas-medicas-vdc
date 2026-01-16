import { JuntaMedica, JuntaFilters, PaginatedResult, Paciente } from '../types';
import { DictamenMedicoData } from '../components/juntas/DictamenMedicoWizard';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Error en la solicitud');
  }
  return response.json();
};

export interface CreateJuntaDTO {
  pacienteId: string;
  observaciones?: string;
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

      return handleResponse(response);
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
    return {
      id: result.id,
      nombre: `${result.nombre} ${result.apellido}`.trim(),
      documento: result.numeroDocumento,
      empresa: '',
    };
  },
};
