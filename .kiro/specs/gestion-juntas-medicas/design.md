# Design Document: Sistema de Gestión de Juntas Médicas

## Overview

Sistema web full-stack para VDC Internacional que permite gestionar juntas médicas ocupacionales. La arquitectura sigue un patrón cliente-servidor con React en frontend, Node.js/Express en backend, y servicios AWS para autenticación (Cognito), almacenamiento (S3) y base de datos (DynamoDB).

### Stack Tecnológico

**Frontend:**
- React 18 con TypeScript
- React Router v6 para navegación
- Formik + Yup para formularios y validación
- React Query para estado del servidor
- Framer Motion para animaciones
- React-Toastify para notificaciones
- Material-UI components (Autocomplete, DatePicker)
- TanStack Table (React-Table) para tablas
- Tailwind CSS para estilos

**Backend:**
- Node.js 18+ con Express
- TypeScript
- AWS SDK v3
- JWT para tokens
- Express-validator para validación
- Helmet para seguridad

**AWS Services:**
- Cognito: Autenticación y gestión de usuarios
- DynamoDB: Base de datos NoSQL
- S3: Almacenamiento de archivos adjuntos
- Lambda (opcional): Funciones serverless

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  Login   │  │ Dashboard│  │ Dashboard│  │    Components    ││
│  │  Page    │  │  Medico  │  │   RRHH   │  │ (Header,Sidebar) ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘│
│       │             │             │                  │          │
│  ┌────┴─────────────┴─────────────┴──────────────────┴────┐    │
│  │              Auth Context + React Query                │    │
│  └────────────────────────────┬───────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────┼─────────────────────────────────┐
│                         BACKEND (Express)                       │
│  ┌────────────────────────────┴───────────────────────────┐    │
│  │                    API Gateway                          │    │
│  │         (Auth Middleware, Rate Limiting, CORS)          │    │
│  └────┬──────────────┬──────────────┬─────────────────────┘    │
│       │              │              │                           │
│  ┌────┴────┐   ┌─────┴─────┐  ┌─────┴─────┐                    │
│  │  Auth   │   │  Juntas   │  │  Upload   │                    │
│  │ Routes  │   │  Routes   │  │  Routes   │                    │
│  └────┬────┘   └─────┬─────┘  └─────┬─────┘                    │
│       │              │              │                           │
│  ┌────┴──────────────┴──────────────┴─────────────────────┐    │
│  │                    Services Layer                       │    │
│  └────┬──────────────┬──────────────┬─────────────────────┘    │
└───────┼──────────────┼──────────────┼───────────────────────────┘
        │              │              │
┌───────┼──────────────┼──────────────┼───────────────────────────┐
│       │         AWS SERVICES        │                           │
│  ┌────┴────┐   ┌─────┴─────┐  ┌─────┴─────┐                    │
│  │ Cognito │   │ DynamoDB  │  │    S3     │                    │
│  │  Users  │   │  Juntas   │  │  Files    │                    │
│  └─────────┘   └───────────┘  └───────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

```typescript
// src/types/index.ts
interface User {
  id: string;
  email: string;
  role: 'MEDICO_INFERIOR' | 'MEDICO_SUPERIOR' | 'RRHH';
  nombre: string;
}

interface JuntaMedica {
  id: string;
  fecha: string; // ISO date
  pacienteId: string;
  pacienteNombre: string;
  medicoId: string;
  medicoNombre: string;
  detalles: string;
  aprobacion?: boolean;
  adjuntos?: Adjunto[];
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  createdAt: string;
  updatedAt: string;
}

interface Adjunto {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  size: number;
}

interface Paciente {
  id: string;
  nombre: string;
  documento: string;
  empresa: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}
```

### Component Hierarchy

```
App
├── AuthProvider
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── AuthButton
│   ├── Routes
│   │   ├── LoginPage
│   │   ├── ProtectedRoute
│   │   │   ├── DashboardMedico
│   │   │   │   ├── Sidebar
│   │   │   │   ├── JuntaForm
│   │   │   │   │   ├── DatePickerField
│   │   │   │   │   ├── AutocompleteField
│   │   │   │   │   ├── TextAreaField
│   │   │   │   │   └── FileUpload (Medico Superior)
│   │   │   │   └── JuntasTable
│   │   │   └── DashboardRRHH
│   │   │       ├── Sidebar
│   │   │       ├── FilterToolbar
│   │   │       ├── JuntasTable
│   │   │       └── JuntaDetailModal
│   └── Footer
└── ToastContainer
```

### Backend API Endpoints

```typescript
// Auth Routes
POST   /api/auth/login          // Login con Cognito
POST   /api/auth/logout         // Invalidar sesión
POST   /api/auth/refresh        // Refresh token
POST   /api/auth/forgot-password // Iniciar recuperación

// Juntas Routes (protegidas)
GET    /api/juntas              // Listar juntas (filtros: fecha, medico, estado)
GET    /api/juntas/:id          // Detalle de junta
POST   /api/juntas              // Crear junta
PUT    /api/juntas/:id          // Actualizar junta
DELETE /api/juntas/:id          // Eliminar junta (solo admin)

// Pacientes Routes (protegidas)
GET    /api/pacientes           // Listar pacientes (para autocomplete)
GET    /api/pacientes/:id       // Detalle paciente

// Médicos Routes (protegidas)
GET    /api/medicos             // Listar médicos (para autocomplete)

// Upload Routes (protegidas)
POST   /api/upload/presigned    // Obtener URL presignada para S3
GET    /api/upload/:key         // Obtener URL firmada para descargar
```

### Backend Services

```typescript
// services/cognitoService.ts
interface CognitoService {
  authenticateUser(email: string, password: string): Promise<AuthResult>;
  verifyToken(token: string): Promise<TokenPayload>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  initiatePasswordReset(email: string): Promise<void>;
  getUserRole(userId: string): Promise<UserRole>;
}

// services/juntasService.ts
interface JuntasService {
  create(junta: CreateJuntaDTO, userId: string): Promise<JuntaMedica>;
  findAll(filters: JuntaFilters): Promise<PaginatedResult<JuntaMedica>>;
  findById(id: string): Promise<JuntaMedica | null>;
  findByMedico(medicoId: string, pagination: Pagination): Promise<PaginatedResult<JuntaMedica>>;
  update(id: string, data: UpdateJuntaDTO): Promise<JuntaMedica>;
  delete(id: string): Promise<void>;
}

// services/s3Service.ts
interface S3Service {
  getPresignedUploadUrl(key: string, contentType: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  validateFileType(contentType: string): boolean;
  validateFileSize(size: number): boolean;
}
```

## Data Models

### DynamoDB Tables

```typescript
// Table: JuntasMedicas
{
  PK: string;           // "JUNTA#<uuid>"
  SK: string;           // "METADATA"
  GSI1PK: string;       // "MEDICO#<medicoId>"
  GSI1SK: string;       // "DATE#<isoDate>"
  GSI2PK: string;       // "FECHA#<YYYY-MM-DD>"
  GSI2SK: string;       // "JUNTA#<uuid>"
  
  id: string;
  fecha: string;        // ISO 8601
  pacienteId: string;
  pacienteNombre: string;
  medicoId: string;
  medicoNombre: string;
  detalles: string;     // max 500 chars
  aprobacion: boolean;
  adjuntos: Adjunto[];  // Array de objetos
  estado: string;       // PENDIENTE | APROBADA | RECHAZADA
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Table: Pacientes
{
  PK: string;           // "PACIENTE#<uuid>"
  SK: string;           // "METADATA"
  GSI1PK: string;       // "EMPRESA#<empresaId>"
  
  id: string;
  nombre: string;
  documento: string;
  empresa: string;
  email: string;
  telefono: string;
  createdAt: string;
}

// Table: Users (manejado por Cognito, datos extra en DynamoDB)
{
  PK: string;           // "USER#<cognitoSub>"
  SK: string;           // "METADATA"
  
  id: string;
  email: string;
  nombre: string;
  role: string;         // MEDICO_INFERIOR | MEDICO_SUPERIOR | RRHH
  activo: boolean;
  createdAt: string;
}
```

### Validation Schemas (Yup)

```typescript
// Validación de Junta Médica
const juntaSchema = Yup.object({
  fecha: Yup.date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),
  pacienteId: Yup.string()
    .required('El paciente es requerido'),
  detalles: Yup.string()
    .required('Los detalles son requeridos')
    .max(500, 'Máximo 500 caracteres'),
  aprobacion: Yup.boolean(),
  adjuntos: Yup.array().of(
    Yup.object({
      nombre: Yup.string().required(),
      tipo: Yup.string().oneOf(['application/pdf', 'image/jpeg', 'image/png']),
      size: Yup.number().max(10 * 1024 * 1024, 'Máximo 10MB por archivo')
    })
  )
});

// Validación de Login
const loginSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  password: Yup.string()
    .required('La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres')
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Round-Trip

*For any* valid user credentials, logging in and then logging out should result in an unauthenticated state where protected routes redirect to login.

**Validates: Requirements 1.2, 1.4, 1.5**

### Property 2: Role-Based Dashboard Redirection

*For any* authenticated user, the system should redirect to the correct dashboard based on their role (MEDICO_INFERIOR/MEDICO_SUPERIOR → /dashboard/medico, RRHH → /dashboard/rrhh).

**Validates: Requirements 1.2**

### Property 3: Invalid Credentials Rejection

*For any* invalid credentials (wrong email or password), the system should display a generic error message without revealing which field is incorrect.

**Validates: Requirements 1.3**

### Property 4: Junta CRUD Round-Trip

*For any* valid JuntaMedica object, creating it via POST and then retrieving it via GET should return an equivalent object with all fields preserved.

**Validates: Requirements 8.2, 8.4**

### Property 5: Form Validation Consistency

*For any* form submission with invalid data, the system should display inline errors for each invalid field and prevent submission.

**Validates: Requirements 2.2, 2.3**

### Property 6: File Type Validation

*For any* file upload attempt, files with valid types (PDF, JPG, PNG) and size ≤10MB should be accepted, while invalid files should be rejected with descriptive errors.

**Validates: Requirements 9.1, 9.3**

### Property 7: Médico Junta Isolation

*For any* médico user viewing "Mis Juntas", the table should only contain juntas where medicoId matches the authenticated user's ID.

**Validates: Requirements 3.1**

### Property 8: Table Sorting Consistency

*For any* sortable column in the juntas table, sorting ascending then descending should produce correctly ordered results based on that column's data type.

**Validates: Requirements 3.4**

### Property 9: Pagination Correctness

*For any* dataset of N juntas and page size P, the total number of pages should equal ceil(N/P) and each page should contain at most P items.

**Validates: Requirements 3.5**

### Property 10: Filter Query Accuracy

*For any* combination of filters (date range, médico), the API should return only juntas that match ALL applied filters.

**Validates: Requirements 4.3**

### Property 11: API Authentication Enforcement

*For any* protected API endpoint, requests without a valid JWT token should receive a 401 Unauthorized response.

**Validates: Requirements 8.5**

### Property 12: API Validation Errors

*For any* API request with invalid data, the response should be 400 Bad Request with detailed error messages for each invalid field.

**Validates: Requirements 8.6**

### Property 13: Character Limit Enforcement

*For any* text input in the detalles field, the system should prevent input beyond 500 characters and display a character counter.

**Validates: Requirements 2.9**

### Property 14: S3 URL Generation

*For any* valid file upload, the system should generate a presigned S3 URL that allows upload, and subsequently generate a download URL that retrieves the same file.

**Validates: Requirements 9.2, 9.4**

## Error Handling

### Frontend Error Handling

```typescript
// Error types
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  PERMISSION = 'PERMISSION'
}

// Error handler
const handleApiError = (error: AxiosError): AppError => {
  if (!error.response) {
    return { type: ErrorType.NETWORK, message: 'Error de conexión' };
  }
  
  switch (error.response.status) {
    case 401:
      return { type: ErrorType.AUTHENTICATION, message: 'Sesión expirada' };
    case 403:
      return { type: ErrorType.PERMISSION, message: 'Sin permisos' };
    case 400:
      return { type: ErrorType.VALIDATION, message: error.response.data.message };
    case 404:
      return { type: ErrorType.NOT_FOUND, message: 'Recurso no encontrado' };
    default:
      return { type: ErrorType.SERVER, message: 'Error del servidor' };
  }
};

// Toast notifications
const showError = (error: AppError) => {
  toast.error(error.message, {
    position: 'top-right',
    autoClose: 5000,
    icon: '❌'
  });
};

const showSuccess = (message: string) => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    icon: '✅'
  });
};
```

### Backend Error Handling

```typescript
// Express error middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: err.errors
    });
  }
  
  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'AUTHENTICATION_ERROR',
      message: 'No autorizado'
    });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Recurso no encontrado'
    });
  }
  
  // Generic error (no exponer detalles internos)
  return res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Error interno del servidor'
  });
};
```

## Testing Strategy

### Unit Tests (Jest)

- **Frontend Components**: Test rendering, user interactions, form validation
- **Backend Services**: Test business logic, data transformations
- **Utilities**: Test helper functions, formatters, validators

### Property-Based Tests (fast-check)

- **Authentication flow**: Round-trip login/logout
- **CRUD operations**: Create/Read consistency
- **Validation**: Input validation across random inputs
- **Filtering**: Query accuracy with random filter combinations
- **Pagination**: Correctness across varying dataset sizes

### Integration Tests

- **API endpoints**: Full request/response cycle
- **Database operations**: DynamoDB CRUD
- **S3 operations**: Upload/download flow

### Test Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // frontend
  // testEnvironment: 'node', // backend
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  }
};

// Property test configuration
const fcConfig = {
  numRuns: 100,
  verbose: true
};
```

### Test Data Generators (fast-check)

```typescript
import * as fc from 'fast-check';

// Generador de JuntaMedica válida
const juntaMedicaArb = fc.record({
  fecha: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  pacienteId: fc.uuid(),
  pacienteNombre: fc.string({ minLength: 2, maxLength: 100 }),
  medicoId: fc.uuid(),
  medicoNombre: fc.string({ minLength: 2, maxLength: 100 }),
  detalles: fc.string({ minLength: 1, maxLength: 500 }),
  aprobacion: fc.boolean(),
  estado: fc.constantFrom('PENDIENTE', 'APROBADA', 'RECHAZADA')
});

// Generador de credenciales inválidas
const invalidCredentialsArb = fc.oneof(
  fc.record({ email: fc.string(), password: fc.constant('') }),
  fc.record({ email: fc.constant(''), password: fc.string() }),
  fc.record({ email: fc.string(), password: fc.string() })
);

// Generador de archivos
const validFileArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
  size: fc.integer({ min: 1, max: 10 * 1024 * 1024 })
});

const invalidFileArb = fc.record({
  name: fc.string(),
  type: fc.constantFrom('application/exe', 'text/html', 'application/zip'),
  size: fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 })
});
```
