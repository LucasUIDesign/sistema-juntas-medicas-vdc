# Sistema de Gestión de Juntas Médicas - VDC Internacional

Sistema web completo para la gestión de juntas médicas ocupacionales, desarrollado para VDC Internacional.

![VDC Internacional](frontend/public/logo-vdc.png)

## 🚀 Características

- **Autenticación segura** con roles (Médico Inferior, Médico Superior, RRHH)
- **Dashboard de Médicos** para cargar y gestionar juntas médicas
- **Dashboard de RRHH** para supervisión total del sistema
- **Diseño responsive** mobile-first con estilos corporativos VDC
- **Animaciones sutiles** con Framer Motion
- **Accesibilidad** WCAG 2.1 AA compliant
- **API RESTful** con Node.js/Express

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn

## 🛠️ Instalación Rápida

### 1. Clonar e instalar dependencias

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configurar variables de entorno

```bash
# Frontend - crear .env
cp frontend/.env.example frontend/.env

# Backend - crear .env
cp backend/.env.example backend/.env
```

### 3. Iniciar servidores de desarrollo

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# Disponible en http://localhost:5173

# Terminal 2 - Backend
cd backend
npm run dev
# API disponible en http://localhost:3001
```

## 🔐 Credenciales de Demostración

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| Médico Junior | medico.junior@vdc-demo.com | Demo2025! | Crear juntas básicas |
| Médico Senior | medico.senior@vdc-demo.com | Demo2025! | Crear juntas + aprobar + adjuntos |
| RRHH | rrhh@vdc-demo.com | Demo2025! | Vista total + edición limitada |


## 📁 Estructura del Proyecto

```
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # Componentes React reutilizables
│   │   │   ├── auth/            # ProtectedRoute
│   │   │   ├── juntas/          # JuntaForm, MisJuntas, JuntaDetailModal
│   │   │   ├── layout/          # Header, Footer, Sidebar, Breadcrumbs
│   │   │   ├── medico/          # PerfilMedico
│   │   │   ├── rrhh/            # TodasJuntas, Reportes, GestionUsuarios
│   │   │   └── ui/              # LoadingSpinner
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # LoginPage, DashboardMedico, DashboardRRHH
│   │   ├── services/            # authService, juntasService
│   │   └── types/               # TypeScript interfaces
│   └── public/                  # Logo VDC, assets
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── middleware/          # auth, errorHandler
│   │   └── routes/              # auth, juntas, pacientes, medicos, upload
│   └── package.json
│
└── .kiro/specs/                 # Especificaciones del proyecto
    └── gestion-juntas-medicas/
        ├── requirements.md      # Requisitos EARS
        ├── design.md            # Diseño técnico
        └── tasks.md             # Plan de implementación
```

## 🎨 Colores Corporativos VDC

| Color | Hex | Uso |
|-------|-----|-----|
| Azul Navy | `#003366` | Header, navegación principal |
| Azul Primario | `#007BFF` | Botones, acciones, links |
| Verde Éxito | `#28A745` | Guardar, confirmaciones |
| Gris Secundario | `#6C757D` | Texto secundario, cancelar |
| Rojo Error | `#FF0000` | Errores, alertas |
| Fondo | `#F5F5F5` | Background general |
| Sidebar | `#E9ECEF` | Fondo sidebar |

## 🔧 Scripts Disponibles

### Frontend

```bash
npm run dev      # Servidor de desarrollo (Vite)
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # ESLint
npm run test     # Vitest
```

### Backend

```bash
npm run dev      # Servidor con nodemon
npm run build    # Compilar TypeScript
npm run start    # Producción
npm run test     # Jest
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token

### Juntas Médicas (requiere autenticación)
- `GET /api/juntas` - Listar juntas (con filtros)
- `GET /api/juntas/:id` - Obtener junta por ID
- `POST /api/juntas` - Crear nueva junta
- `PUT /api/juntas/:id` - Actualizar junta
- `DELETE /api/juntas/:id` - Eliminar junta (solo RRHH)

### Pacientes y Médicos
- `GET /api/pacientes` - Listar pacientes (autocomplete)
- `GET /api/medicos` - Listar médicos (filtros)

### Upload (Médico Superior)
- `POST /api/upload/presigned` - Obtener URL para subir archivo
- `GET /api/upload/:key` - Obtener URL de descarga


## 🚀 Deployment en AWS

### Frontend (AWS Amplify)

1. Conectar repositorio a AWS Amplify Console
2. Configurar build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

3. Configurar variables de entorno en Amplify:
   - `VITE_API_URL`: URL del backend

### Backend (AWS Lambda con API Gateway)

1. Instalar Serverless Framework:
```bash
npm install -g serverless
```

2. Configurar `serverless.yml`:
```yaml
service: vdc-juntas-api
provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    JWT_SECRET: ${ssm:/vdc/jwt-secret}
    COGNITO_USER_POOL_ID: ${ssm:/vdc/cognito-pool-id}
functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

3. Deploy:
```bash
serverless deploy
```

### Base de Datos (DynamoDB)

Tablas requeridas:
- `JuntasMedicas` - Almacena juntas médicas
- `Pacientes` - Catálogo de pacientes
- `Users` - Datos adicionales de usuarios (Cognito maneja auth)

### Almacenamiento (S3)

Bucket para adjuntos:
- Nombre: `vdc-juntas-adjuntos`
- CORS configurado para el dominio del frontend
- Políticas de acceso con presigned URLs

## 🔒 Seguridad

- ✅ HTTPS obligatorio en producción
- ✅ JWT tokens con expiración
- ✅ Validación de inputs en frontend y backend
- ✅ Rate limiting en API
- ✅ CORS restrictivo
- ✅ Helmet para headers de seguridad
- ✅ Sanitización de datos sensibles

## ♿ Accesibilidad

- ✅ ARIA labels en elementos interactivos
- ✅ Navegación por teclado (Tab, Enter, Escape)
- ✅ Contrast ratio > 4.5:1
- ✅ Focus visible con outline azul
- ✅ Soporte para `prefers-reduced-motion`
- ✅ Semantic HTML

## 🧪 Testing

```bash
# Frontend - Vitest + React Testing Library
cd frontend
npm run test

# Backend - Jest
cd backend
npm run test
```

## 📝 Notas de Desarrollo

- El sistema funciona completamente en modo local con datos mock
- No requiere configuración de AWS para desarrollo
- Los datos de demostración se regeneran al reiniciar el servidor
- Para producción, configurar las variables de entorno de AWS

## 📄 Licencia

© 2025 VDC Internacional. Todos los derechos reservados.

---

Desarrollado con ❤️ para VDC Internacional
