const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export interface UpdateProfileData {
  nombre?: string;
  apellido?: string;
  email?: string;
  dni?: string;
  telefono?: string;
  fotoUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  telefono?: string;
  fotoUrl?: string;
  role: string;
  createdAt: string;
}

export const userService = {
  async getProfile(token: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al obtener perfil');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  },

  async updateProfile(token: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  },

  async changePassword(token: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  },
};
