import { User, AuthResponse, UserRole } from '../types';

// Mock users for development
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'evaluador@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-001',
      email: 'evaluador@vdc-demo.com',
      nombre: 'Dr. Carlos Mendoza',
      role: 'MEDICO_EVALUADOR' as UserRole
    }
  },
  'director@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-002',
      email: 'director@vdc-demo.com',
      nombre: 'Dra. María González',
      role: 'DIRECTOR_MEDICO' as UserRole
    }
  },
  'rrhh@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-003',
      email: 'rrhh@vdc-demo.com',
      nombre: 'Ana Rodríguez',
      role: 'RRHH' as UserRole
    }
  },
  'gerencial@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-004',
      email: 'gerencial@vdc-demo.com',
      nombre: 'Roberto Fernández',
      role: 'GERENCIAL' as UserRole
    }
  },
  'admin@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-005',
      email: 'admin@vdc-demo.com',
      nombre: 'Administrador Sistema',
      role: 'ADMIN' as UserRole
    }
  }
};

// Simple JWT-like token generation for mock
const generateMockToken = (user: User): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  return btoa(JSON.stringify(payload));
};

// Verify mock token
const verifyMockToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
};

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedEmail = email.toLowerCase().trim();
    const mockUser = MOCK_USERS[normalizedEmail];

    if (!mockUser || mockUser.password !== password) {
      throw new Error('Credenciales inválidas');
    }

    const token = generateMockToken(mockUser.user);
    
    return {
      user: mockUser.user,
      token,
      refreshToken: generateMockToken(mockUser.user)
    };
  },

  async verifyToken(token: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return verifyMockToken(token);
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!verifyMockToken(refreshToken)) {
      throw new Error('Token de refresco inválido');
    }

    const payload = JSON.parse(atob(refreshToken));
    const email = payload.email;
    const mockUser = Object.values(MOCK_USERS).find(u => u.user.email === email);

    if (!mockUser) {
      throw new Error('Usuario no encontrado');
    }

    const newToken = generateMockToken(mockUser.user);
    
    return {
      user: mockUser.user,
      token: newToken,
      refreshToken: generateMockToken(mockUser.user)
    };
  },

  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedEmail = email.toLowerCase().trim();
    if (!MOCK_USERS[normalizedEmail]) {
      return;
    }
    
    console.log(`Password reset email would be sent to: ${email}`);
  },

  getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'MEDICO_EVALUADOR':
      case 'DIRECTOR_MEDICO':
        return '/dashboard/medico';
      case 'RRHH':
      case 'GERENCIAL':
      case 'ADMIN':
        return '/dashboard/rrhh';
      default:
        return '/';
    }
  }
};
