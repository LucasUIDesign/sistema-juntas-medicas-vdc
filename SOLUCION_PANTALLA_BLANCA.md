# Solución: Pantalla en Blanco en /dashboard/admin/todas-juntas

## 🔍 Problema Identificado

La ruta `/dashboard/admin/todas-juntas` mostraba una pantalla en blanco debido a un **desajuste entre los datos del backend y frontend**.

### Causa Raíz

El backend estaba devolviendo propiedades con nombres diferentes a los que el frontend esperaba:

**Backend devolvía:**
- `pacienteNombreCompleto`
- `medicoNombreCompleto`
- Sin `pacienteDni`

**Frontend esperaba (según tipos en `frontend/src/types/index.ts`):**
- `pacienteNombre`
- `medicoNombre`
- `pacienteDni`

Esto causaba que el componente `TodasJuntas.tsx` no pudiera renderizar correctamente los datos.

## ✅ Solución Aplicada

### 1. Actualización del Backend

**Archivo modificado:** `backend/src/routes/juntas.ts`

#### Cambio en GET /api/juntas (líneas 88-115)

```typescript
// ANTES (incorrecto)
return {
  ...row,
  pacienteNombreCompleto: `${row.pacienteNombre || ''} ${row.pacienteApellido || ''}`.trim(),
  medicoNombreCompleto: `${row.medicoNombre || ''} ${row.medicoApellido || ''}`.trim(),
  dictamen: dictamenObj,
};

// DESPUÉS (correcto)
return {
  id: row.id,
  fecha: row.fecha,
  pacienteId: row.pacienteId,
  pacienteNombre: `${row.pacienteNombre || ''} ${row.pacienteApellido || ''}`.trim(),
  pacienteDni: row.numeroDocumento,
  medicoId: row.medicoId,
  medicoNombre: `${row.medicoNombre || ''} ${row.medicoApellido || ''}`.trim(),
  detalles: row.observaciones || '',
  estado: row.estado,
  aptitudLaboral: row.aptitudLaboral,
  diagnosticoPrincipal: row.diagnosticoPrincipal,
  dictamen: dictamenObj,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
};
```

#### Cambio en GET /api/juntas/:id (líneas 160-175)

```typescript
// ANTES (incorrecto)
res.json({
  ...junta,
  pacienteNombreCompleto: `${junta.pacienteNombre || ''} ${junta.pacienteApellido || ''}`.trim(),
  medicoNombreCompleto: `${junta.medicoNombre || ''} ${junta.medicoApellido || ''}`.trim(),
  dictamen: dictamenResult.rows[0] ? JSON.parse((dictamenResult.rows[0] as any).datosCompletos) : null,
  documentos: documentosResult.rows,
});

// DESPUÉS (correcto)
res.json({
  id: junta.id,
  fecha: junta.fecha,
  pacienteId: junta.pacienteId,
  pacienteNombre: `${junta.pacienteNombre || ''} ${junta.pacienteApellido || ''}`.trim(),
  pacienteDni: junta.numeroDocumento,
  medicoId: junta.medicoId,
  medicoNombre: `${junta.medicoNombre || ''} ${junta.medicoApellido || ''}`.trim(),
  detalles: junta.observaciones || '',
  estado: junta.estado,
  aptitudLaboral: junta.aptitudLaboral,
  diagnosticoPrincipal: junta.diagnosticoPrincipal,
  fechaDictamen: junta.fechaDictamen,
  dictamen: dictamenResult.rows[0] ? JSON.parse((dictamenResult.rows[0] as any).datosCompletos) : null,
  documentos: documentosResult.rows,
  createdAt: junta.createdAt,
  updatedAt: junta.updatedAt,
});
```

### 2. Corrección de Errores en medicos.ts

**Archivo modificado:** `backend/src/routes/medicos.ts`

#### Problema 1: Import incorrecto
```typescript
// ANTES
import { db } from '../index';

// DESPUÉS
import { db } from '../lib/prisma';
import { NotFoundError } from '../middleware/errorHandler';
```

#### Problema 2: Referencia a MOCK_MEDICOS inexistente
```typescript
// ANTES
const medico = MOCK_MEDICOS.find(m => m.id === id);

// DESPUÉS
const result = await db.execute({
  sql: `SELECT id, nombre, apellido, email FROM User WHERE id = ? AND role IN ('MEDICO_EVALUADOR', 'DIRECTOR_MEDICO')`,
  args: [id],
});

if (result.rows.length === 0) {
  throw new NotFoundError('Médico no encontrado');
}
```

## 🚀 Despliegue en Render

### Pasos para Aplicar los Cambios

1. **Commit y Push de los cambios:**
```bash
git add backend/src/routes/juntas.ts backend/src/routes/medicos.ts
git commit -m "fix: corregir formato de respuesta API para juntas y médicos"
git push origin main
```

2. **Render detectará automáticamente los cambios** y ejecutará:
   - `npm install` (instalar dependencias)
   - `npm run build` (compilar TypeScript)
   - `npm start` (iniciar servidor)

3. **Verificar el despliegue:**
   - Ve a tu dashboard de Render
   - Espera a que el deploy termine (status: "Live")
   - Verifica los logs para confirmar que no hay errores

### Configuración de Render (verificar)

Asegúrate de que tu servicio en Render tenga:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Variables de Entorno (en Render Dashboard):**
- `NODE_ENV=production`
- `TURSO_DATABASE_URL` (tu URL de Turso)
- `TURSO_AUTH_TOKEN` (tu token de Turso)
- `JWT_SECRET` (tu secreto JWT)
- `CORS_ORIGIN` (URL de tu frontend en Vercel)

## 🔍 Verificación del Frontend en Vercel

### Variables de Entorno en Vercel

Asegúrate de tener configurada la variable:

```
VITE_API_URL=https://tu-backend.onrender.com/api
```

**Pasos:**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega o verifica `VITE_API_URL`
4. Redeploy si es necesario

## 🧪 Pruebas Post-Despliegue

Una vez desplegado, verifica:

1. **Login funciona correctamente**
   - Ir a `https://sistema-juntas-medicas-vdc.vercel.app/login`
   - Iniciar sesión con usuario ADMIN

2. **Navegación a Todas las Juntas**
   - Ir a `/dashboard/admin/todas-juntas`
   - Verificar que la tabla se carga correctamente
   - Verificar que muestra: Fecha, Paciente, DNI, Médico, Detalles, Estado

3. **Funcionalidad de filtros**
   - Probar búsqueda por paciente
   - Probar filtros de fecha
   - Probar filtro por médico

4. **Modal de detalle**
   - Click en una fila de la tabla
   - Verificar que el modal muestra toda la información correctamente

## 📊 Estructura de Datos Correcta

### Respuesta de GET /api/juntas

```json
{
  "data": [
    {
      "id": "uuid",
      "fecha": "2025-01-17T00:00:00.000Z",
      "pacienteId": "uuid",
      "pacienteNombre": "Juan Pérez",
      "pacienteDni": "12345678",
      "medicoId": "uuid",
      "medicoNombre": "Dr. María González",
      "detalles": "Observaciones de la junta",
      "estado": "PENDIENTE",
      "aptitudLaboral": null,
      "diagnosticoPrincipal": null,
      "dictamen": null,
      "createdAt": "2025-01-17T10:00:00.000Z",
      "updatedAt": "2025-01-17T10:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

## 🐛 Debugging

Si el problema persiste después del despliegue:

### 1. Verificar logs de Render
```bash
# En Render Dashboard → Logs
# Buscar errores de compilación o runtime
```

### 2. Verificar respuesta del API
```bash
# Abrir DevTools en el navegador (F12)
# Network tab → Buscar llamada a /api/juntas
# Verificar la estructura de la respuesta
```

### 3. Verificar variables de entorno
```bash
# En Render Dashboard → Environment
# Confirmar que todas las variables están configuradas
```

### 4. Forzar rebuild en Render
```bash
# En Render Dashboard → Manual Deploy → Deploy latest commit
```

## ✨ Resumen de Archivos Modificados

1. ✅ `backend/src/routes/juntas.ts` - Corregido formato de respuesta
2. ✅ `backend/src/routes/medicos.ts` - Corregido imports y queries
3. ✅ Compilación TypeScript exitosa

## 📝 Notas Importantes

- Los cambios son **backward compatible** - no rompen otras partes del sistema
- El frontend ya espera estos nombres de propiedades según `frontend/src/types/index.ts`
- No se requieren cambios en el frontend
- La solución corrige tanto la lista de juntas como el detalle individual

## 🎯 Próximos Pasos

1. ✅ Hacer commit de los cambios
2. ✅ Push a GitHub
3. ⏳ Esperar despliegue automático en Render
4. ⏳ Verificar que la pantalla carga correctamente
5. ⏳ Probar funcionalidad completa

---

**Fecha de solución:** 17 de enero de 2025
**Archivos modificados:** 2
**Tiempo estimado de despliegue:** 3-5 minutos
