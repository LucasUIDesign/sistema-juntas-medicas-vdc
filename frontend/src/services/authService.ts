import { AuthResponse, UserRole } from '../types';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Verify JWT token format and expiration
const verifyToken = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return exp > Date.now();
  } catch {
    return false;
  }
};

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de conexión con el servidor');
    }
  },

  async verifyToken(token: string): Promise<boolean> {
    return verifyToken(token);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token de refresco inválido');
      }

      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al refrescar el token');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      // Don't reveal if email exists or not
      // console.log('Password reset requested for:', email);
    }
  },

  getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'MEDICO_EVALUADOR':
        return '/dashboard/medico-evaluador';
      case 'DIRECTOR_MEDICO':
        return '/dashboard/director-medico';
      case 'RRHH':
        return '/dashboard/rrhh';
      case 'GERENCIAL':
        return '/dashboard/gerencial';
      case 'ADMIN':
        return '/dashboard/admin';
      case 'ADMINISTRATIVO':
        return '/dashboard/administrativo';
      default:
        return '/';
    }
  }
};
