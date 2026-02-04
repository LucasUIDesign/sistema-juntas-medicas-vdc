# Guía para Desplegar los Cambios

## Cambios Implementados ✅

### 1. Backend - Fix del error de proxy
- **Archivo**: `backend/src/index.ts`
- **Cambio**: Agregado `app.set('trust proxy', 1);` para solucionar el error de express-rate-limit
- **Efecto**: Elimina el error `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`

### 2. Frontend - Búsqueda inteligente de pacientes
- **Archivos modificados**:
  - `frontend/src/components/juntas/DictamenMedicoWizard.tsx`
  - `frontend/src/components/juntas/JuntaForm.tsx`
  - `frontend/src/services/juntasService.ts`
  - `frontend/src/types/index.ts`

- **Funcionalidad**:
  - Campo "Nombre Completo" con búsqueda en tiempo real
  - Autocompletado de datos del paciente (nombre, DNI, email, teléfono, domicilio)
  - NO crea pacientes nuevos (solo busca existentes)
  - Validación: si el paciente no existe, muestra error

## Pasos para Desplegar

### Opción 1: Despliegue Automático (Recomendado)

Si tienes configurado CI/CD con GitHub:

```bash
# 1. Hacer commit de los cambios
git add .
git commit -m "feat: búsqueda inteligente de pacientes y fix proxy error"

# 2. Push a la rama main
git push origin main
```

Render y Vercel detectarán automáticamente los cambios y redesplegarán.

### Opción 2: Despliegue Manual

#### Backend (Render)

```bash
# 1. Ir al directorio del backend
cd sistema-juntas-medicas-vdc/backend

# 2. Instalar dependencias (si es necesario)
npm install

# 3. Compilar TypeScript
npm run build

# 4. Hacer commit y push
git add .
git commit -m "fix: trust proxy configuration"
git push origin main
```

Render redespleará automáticamente.

#### Frontend (Vercel)

```bash
# 1. Ir al directorio del frontend
cd sistema-juntas-medicas-vdc/frontend

# 2. Instalar dependencias (si es necesario)
npm install

# 3. Compilar para producción
npm run build

# 4. Hacer commit y push
git add .
git commit -m "feat: búsqueda inteligente de pacientes en dictamen"
git push origin main
```

Vercel redespleará automáticamente.

### Opción 3: Forzar Redespliegue desde el Dashboard

#### Render (Backend)
1. Ir a https://dashboard.render.com
2. Seleccionar el servicio del backend
3. Click en "Manual Deploy" → "Deploy latest commit"

#### Vercel (Frontend)
1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto
3. Click en "Deployments"
4. Click en "Redeploy" en el último deployment

## Verificar que los Cambios Funcionan

### Backend
1. Ir a: https://sistema-juntas-medicas-vdc.onrender.com/health
2. Debería responder sin errores de proxy

### Frontend
1. Ir a: https://sistema-juntas-medicas-vdc.vercel.app
2. Login como médico evaluador o director médico
3. Ir a "Cargar Nueva Junta Médica"
4. En el campo "Nombre Completo" del dictamen:
   - Escribir al menos 2 caracteres
   - Debería aparecer un dropdown con sugerencias de pacientes
   - Al seleccionar uno, se autocompletan los campos

## Solución de Problemas

### Si no ves los cambios en el frontend:
```bash
# Limpiar caché y recompilar
cd sistema-juntas-medicas-vdc/frontend
rm -rf node_modules/.vite
rm -rf dist
npm run build
```

### Si el backend sigue mostrando el error:
```bash
# Verificar que el cambio esté en el código desplegado
curl https://sistema-juntas-medicas-vdc.onrender.com/health
```

### Si la búsqueda no funciona:
1. Verificar que existan pacientes en la base de datos (crear desde Admin)
2. Abrir la consola del navegador (F12) y verificar errores
3. Verificar que la API responda: `GET /api/pacientes?search=nombre`

## Comandos Útiles

```bash
# Ver logs del backend en Render
render logs --tail

# Ver logs del frontend en Vercel
vercel logs

# Probar localmente antes de desplegar
cd sistema-juntas-medicas-vdc/backend
npm run dev

cd sistema-juntas-medicas-vdc/frontend
npm run dev
```

## Resumen de Cambios Técnicos

### Backend
- ✅ `app.set('trust proxy', 1)` agregado antes de los middlewares
- ✅ Soluciona el error de express-rate-limit con X-Forwarded-For

### Frontend
- ✅ Búsqueda con debounce (300ms)
- ✅ Dropdown animado con sugerencias
- ✅ Autocompletado de campos
- ✅ Validación: solo pacientes existentes
- ✅ NO crea pacientes duplicados
- ✅ Feedback visual (spinner, iconos)

## Contacto

Si tienes problemas con el despliegue, verifica:
1. Variables de entorno en Render y Vercel
2. Logs de error en ambas plataformas
3. Que la base de datos Turso esté accesible
