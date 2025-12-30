import { User, AuthResponse, UserRole } from '../types';

// Mock users for development (Requirements 11.1, 11.2, 11.3)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'medico.junior@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-001',
      email: 'medico.junior@vdc-demo.com',
      nombre: 'Dr. Carlos Mendoza',
      role: 'MEDICO_INFERIOR' as UserRole
    }
  },
  'medico.senior@vdc-demo.com': {
    password: 'Demo2025!',
    user: {
      id: 'user-002',
      email: 'medico.senior@vdc-demo.com',
      nombre: 'Dra. María González',
      role: 'MEDICO_SUPERIOR' as UserRole
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
  /**
   * Login with email and password
   * Uses mock authentication for development
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Simulate network delay
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

  /**
   * Verify if token is valid
   */
  async verifyToken(token: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return verifyMockToken(token);
  },

  /**
   * Refresh token
   */
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

  /**
   * Initiate password reset flow
   */
  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedEmail = email.toLowerCase().trim();
    if (!MOCK_USERS[normalizedEmail]) {
      // Don't reveal if email exists or not
      return;
    }
    
    console.log(`Password reset email would be sent to: ${email}`);
  },

  /**
   * Get dashboard route based on user role
   */
  getDashboardRoute(role: UserRole): string {
    switch (role) {
      case 'MEDICO_INFERIOR':
      case 'MEDICO_SUPERIOR':
        return '/dashboard/medico';
      case 'RRHH':
        return '/dashboard/rrhh';
      default:
        return '/';
    }
  }
};
