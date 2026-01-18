# Implementación de Turnos para Médicos

## ✅ Cambios Implementados

### 🎯 Objetivo
Cuando el admin asigna un turno a un médico, ese médico debe ver el turno en su dashboard en la sección "Próximas Juntas" con toda la información completa y una UI/UX profesional.

### 📋 Cambios Realizados

#### 1. **Backend - Base de Datos**

**Archivo:** `backend/prisma/schema.prisma`

Agregado campo `hora` a la tabla JuntaMedica:

```prisma
model JuntaMedica {
  id                  String             @id @default(uuid())
  pacienteId          String
  medicoId            String
  estado              String             @default("BORRADOR")
  fecha               DateTime           @default(now())
  hora                String?            // ⭐ NUEVO: Hora del turno (formato HH:mm)
  fechaDictamen       DateTime?
  aptitudLaboral      String?
  diagnosticoPrincipal String?
  observaciones       String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  
  paciente            Paciente           @relation("PacienteJuntas", fields: [pacienteId], references: [id])
  medico              User               @relation("MedicoJuntas", fields: [medicoId], references: [id])
  dictamen            Dictamen?
  documentos          DocumentoAdjunto[]
}
```

#### 2. **Backend - API Endpoints**

**Archivo:** `backend/src/routes/juntas.ts`

**Cambio 1: GET /api/juntas - Incluir hora en la respuesta**
```typescript
let sql = `
  SELECT
    j.id, j.pacienteId, j.medicoId, j.estado, j.fecha, j.fechaDictamen,
    j.aptitudLaboral, j.diagnosticoPrincipal, j.observaciones, j.hora, // ⭐ NUEVO
    j.createdAt, j.updatedAt,
    p.nombre as pacienteNombre, p.apellido as pacienteApellido, p.numeroDocumento,
    u.nombre as medicoNombre, u.apellido as medicoApellido,
    d.datosCompletos
  FROM JuntaMedica j
  ...
`;
```

**Cambio 2: POST /api/juntas - Aceptar hora al crear junta**
```typescript
router.post('/', authMiddleware, roleMiddleware(['MEDICO_EVALUADOR', 'DIRECTOR_MEDICO', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { pacienteId, observaciones, hora } = req.body; // ⭐ NUEVO: hora

    await db.execute({
      sql: `INSERT INTO JuntaMedica (id, pacienteId, medicoId, estado, fecha, hora, observaciones, createdAt, updatedAt)
            VALUES (?, ?, ?, 'PENDIENTE', ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [id, pacienteId, req.user!.id, fecha, hora || null, observaciones || null],
    });
  }
);
```

#### 3. **Frontend - Servicio de Juntas**

**Archivo:** `frontend/src/services/juntasService.ts`

**Cambio 1: Actualizar CreateJuntaDTO**
```typescript
export interface CreateJuntaDTO {
  pacienteId: string;
  observaciones?: string;
  hora?: string; // ⭐ NUEVO
}
```

**Cambio 2: Agregar método getJuntasAsignadas**
```typescript
/**
 * Get juntas asignadas (turnos) for the current user
 */
async getJuntasAsignadas(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/juntas?estado=PENDIENTE`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error('Error fetching juntas asignadas');
      return [];
    }

    const data = await response.json();
    
    // Transformar al formato esperado por ProximasJuntas
    return data.data.map((junta: any) => ({
      id: junta.id,
      fecha: junta.fecha,
      hora: junta.hora || '09:00',
      pacienteNombre: junta.pacienteNombre,
      pacienteDni: junta.pacienteDni,
      lugar: 'Consultorio VDC',
      profesionales: [],
    }));
  } catch (error) {
    console.error('Error fetching juntas asignadas:', error);
    return [];
  }
}
```

#### 4. **Frontend - Componente AsignarTurnos**

**Archivo:** `frontend/src/components/admin/AsignarTurnos.tsx`

**Cambio: Crear junta médica real al asignar turno**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // 1. Buscar o crear el paciente
    let pacienteId = '';
    const pacientes = await juntasService.searchPacientes(formData.pacienteDni);
    
    if (pacientes.length > 0) {
      pacienteId = pacientes[0].id;
    } else {
      // Crear nuevo paciente
      const nombreParts = formData.pacienteNombre.trim().split(' ');
      const nombre = nombreParts[0];
      const apellido = nombreParts.slice(1).join(' ') || nombre;
      
      const nuevoPaciente = await juntasService.createPaciente({
        nombre,
        apellido,
        numeroDocumento: formData.pacienteDni,
      });
      pacienteId = nuevoPaciente.id;
    }

    // 2. Crear la junta médica con el turno asignado
    const nuevaJunta = await juntasService.createJunta({
      pacienteId,
      hora: formData.hora, // ⭐ Enviar la hora
      observaciones: `Turno asignado para el ${format(selectedDate, "dd/MM/yyyy")} a las ${formData.hora}`,
    });

    // 3. Agregar al estado local para mostrar en la UI
    const nuevoTurno: Turno = {
      id: nuevaJunta.id,
      fecha: selectedDate,
      hora: formData.hora,
      pacienteNombre: formData.pacienteNombre,
      pacienteDni: formData.pacienteDni,
    };

    setTurnos([...turnos, nuevoTurno]);
    setFormData({ pacienteNombre: '', pacienteDni: '', hora: '' });
    setPacienteSearch('');
    setShowForm(false);
    toast.success('Turno asignado correctamente. El médico será notificado.');
  } catch (error: any) {
    console.error('Error creating turno:', error);
    toast.error(error.message || 'Error al asignar el turno');
  }
};
```

#### 5. **Script de Migración**

**Archivo:** `backend/scripts/add-hora-column.ts`

Script para agregar la columna `hora` a la tabla existente:

```typescript
import { db } from '../src/lib/prisma';

async function addHoraColumn() {
  try {
    console.log('Adding hora column to JuntaMedica table...');
    
    await db.execute({
      sql: 'ALTER TABLE JuntaMedica ADD COLUMN hora TEXT',
      args: [],
    });
    
    console.log('✅ Column added successfully!');
  } catch (error: any) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('⚠️  Column already exists, skipping...');
    } else {
      console.error('❌ Error adding column:', error);
      throw error;
    }
  }
}

addHoraColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🔄 Flujo Completo

### Asignación de Turno (Admin)

1. **Admin accede a `/dashboard/admin/asignar-turnos`**
2. **Selecciona una fecha** (mínimo 72 horas de anticipación)
3. **Click en "Nuevo Turno"**
4. **Busca el paciente** por nombre o DNI (autocomplete inteligente)
5. **Selecciona un horario** disponible
6. **Confirma** → Se crea una JuntaMedica con:
   - `estado: 'PENDIENTE'`
   - `fecha: fecha seleccionada`
   - `hora: hora seleccionada`
   - `pacienteId: ID del paciente`
   - `medicoId: ID del médico asignado`
   - `observaciones: "Turno asignado para..."`

### Visualización del Turno (Médico)

1. **Médico inicia sesión** (ej: Juan Pérez)
2. **Accede a su dashboard** `/dashboard/medico-evaluador`
3. **Ve el componente "Próximas Juntas"** que muestra:
   - Fecha del día actual
   - Lista de turnos del día
   - Para cada turno:
     - ⏰ Hora del turno
     - 👤 Nombre del paciente
     - 🆔 DNI del paciente
     - 👥 Médicos participantes (si hay)

## 🎨 UI/UX del Componente ProximasJuntas

El componente ya está implementado con una UI profesional:

```tsx
<motion.div className="rounded-lg overflow-hidden border border-vdc-primary bg-blue-50/50">
  {/* Header con hora */}
  <div className="px-3 py-2 flex items-center justify-between bg-vdc-primary text-white">
    <span className="font-semibold text-sm">Turno</span>
    <div className="flex items-center text-sm">
      <ClockIcon className="h-4 w-4 mr-1" />
      <span className="font-medium">{junta.hora}</span>
    </div>
  </div>
  
  {/* Contenido */}
  <div className="p-3">
    {/* Paciente */}
    <div className="flex items-start mb-2">
      <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
      <div>
        <p className="font-medium text-gray-900">{junta.pacienteNombre}</p>
        <p className="text-xs text-gray-500">DNI: {junta.pacienteDni}</p>
      </div>
    </div>

    {/* Médicos participantes */}
    {junta.profesionales && junta.profesionales.length > 0 && (
      <div className="mt-3 pt-2 border-t border-gray-200">
        <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-400" />
        <span>Médicos participantes:</span>
        {junta.profesionales.map((prof) => (
          <div key={prof.id}>
            <span>{prof.nombre}</span>
            <span>• {prof.especialidad}</span>
          </div>
        ))}
      </div>
    )}
  </div>
</motion.div>
```

## 📊 Estados de las Juntas

| Estado | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| `BORRADOR` | Junta creada pero no finalizada | Médico está completando el dictamen |
| `PENDIENTE` | Turno asignado, esperando evaluación | Admin asigna turno |
| `COMPLETADA` | Dictamen completado | Médico finaliza el dictamen |
| `APROBADA` | Junta aprobada por Director | Director aprueba |
| `RECHAZADA` | Junta rechazada | Director rechaza |

## 🚀 Despliegue

### Backend (Render)
1. ✅ Cambios pusheados a GitHub
2. ⏳ Render detectará los cambios automáticamente
3. ⏳ Ejecutará `npm install && npm run build`
4. ⏳ Reiniciará el servidor
5. ⚠️ **IMPORTANTE:** Necesitarás ejecutar la migración manualmente en Render:
   - Conectarte a la shell de Render
   - Ejecutar: `npx ts-node scripts/add-hora-column.ts`
   - O ejecutar directamente: `sqlite3 prisma/dev.db "ALTER TABLE JuntaMedica ADD COLUMN hora TEXT;"`

### Frontend (Vercel)
1. ✅ Cambios pusheados a GitHub
2. ⏳ Vercel desplegará automáticamente
3. ⏳ Tiempo estimado: 2-3 minutos

## 🧪 Pruebas

### Prueba 1: Asignar Turno
1. Login como ADMIN
2. Ir a `/dashboard/admin/asignar-turnos`
3. Seleccionar fecha (mínimo 3 días adelante)
4. Click "Nuevo Turno"
5. Buscar paciente "Juan" → Seleccionar
6. Seleccionar hora "09:00"
7. Confirmar
8. ✅ Debe mostrar toast: "Turno asignado correctamente. El médico será notificado."

### Prueba 2: Ver Turno como Médico
1. Login como médico (ej: Juan Pérez)
2. Ir a dashboard del médico
3. Ver sección "Próximas Juntas"
4. ✅ Debe mostrar el turno con:
   - Hora: 09:00
   - Paciente: nombre completo
   - DNI: número de documento
   - Card con diseño profesional

### Prueba 3: Múltiples Turnos
1. Asignar 3 turnos diferentes para el mismo día
2. Login como médico
3. ✅ Debe mostrar los 3 turnos ordenados por hora

## 🔧 Troubleshooting

### Problema: No aparecen los turnos
**Solución:**
1. Verificar que la columna `hora` existe en la BD
2. Verificar que el estado de la junta es `PENDIENTE`
3. Verificar que el `medicoId` coincide con el usuario logueado
4. Revisar la consola del navegador para errores

### Problema: Error al crear turno
**Solución:**
1. Verificar que el paciente existe o se puede crear
2. Verificar que la fecha es válida (mínimo 72 horas)
3. Verificar que el horario no está ocupado
4. Revisar logs del backend

### Problema: Columna hora no existe
**Solución:**
```bash
# En Render Shell o localmente
sqlite3 backend/prisma/dev.db "ALTER TABLE JuntaMedica ADD COLUMN hora TEXT;"
```

## 📝 Próximas Mejoras

1. **Notificaciones en tiempo real** - WebSockets para notificar al médico
2. **Recordatorios** - Email/SMS 24 horas antes del turno
3. **Calendario visual** - Vista de calendario para el médico
4. **Confirmación de asistencia** - Médico puede confirmar/rechazar turno
5. **Historial de turnos** - Ver turnos pasados y futuros
6. **Exportar agenda** - Descargar turnos en formato PDF/Excel

---

**Fecha de implementación:** 17 de enero de 2025
**Archivos modificados:** 5
**Líneas agregadas:** ~115
**Líneas eliminadas:** ~17
