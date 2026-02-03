# 🧹 Limpiar Base de Datos

Este documento explica cómo limpiar completamente la base de datos y dejarla lista para empezar de cero.

---

## 📋 ¿Qué hace el script de limpieza?

El script `clean-database.ts` realiza las siguientes acciones:

1. ✅ Elimina **todos los documentos adjuntos**
2. ✅ Elimina **todos los dictámenes**
3. ✅ Elimina **todas las juntas médicas**
4. ✅ Elimina **todos los pacientes**
5. ✅ Elimina **todos los usuarios**
6. ✅ Crea un **usuario administrador** por defecto

---

## 🚀 Cómo ejecutar la limpieza

### Opción 1: Desde la carpeta backend

```bash
cd backend
npx tsx scripts/clean-database.ts
```

### Opción 2: Desde la raíz del proyecto

```bash
cd sistema-juntas-medicas-vdc/backend
npx tsx scripts/clean-database.ts
```

---

## 🔑 Credenciales del Administrador

Después de ejecutar el script, tendrás un único usuario administrador:

- **Username**: `admin`
- **Password**: `Admin2025!`
- **Rol**: `ADMIN`

---

## ✅ Verificar la limpieza

Para verificar que la base de datos quedó limpia correctamente:

```bash
cd backend
npx tsx scripts/verify-clean.ts
```

Este script mostrará:
- Cantidad de usuarios (debe ser 1)
- Cantidad de pacientes (debe ser 0)
- Cantidad de juntas (debe ser 0)
- Cantidad de dictámenes (debe ser 0)
- Cantidad de documentos (debe ser 0)

---

## 📊 Ejemplo de salida

```
🧹 Iniciando limpieza de base de datos...

📄 Eliminando documentos adjuntos...
   ✅ 41 documentos eliminados

📋 Eliminando dictámenes...
   ✅ 16 dictámenes eliminados

🏥 Eliminando juntas médicas...
   ✅ 27 juntas eliminadas

👤 Eliminando pacientes...
   ✅ 19 pacientes eliminados

👥 Eliminando usuarios...
   ✅ 9 usuarios eliminados

👨‍💼 Creando usuario administrador...
   ✅ Usuario admin creado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LIMPIEZA COMPLETADA

📊 Resumen:
   • Documentos eliminados: 41
   • Dictámenes eliminados: 16
   • Juntas eliminadas: 27
   • Pacientes eliminados: 19
   • Usuarios eliminados: 9
   • Usuario admin creado: 1

🔑 Credenciales del administrador:
   Username: admin
   Password: Admin2025!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Advertencias

### 🔴 IMPORTANTE: Esta acción es IRREVERSIBLE

- ❌ **NO se puede deshacer** la eliminación de datos
- ❌ **Todos los datos se perderán** permanentemente
- ❌ **No hay backup automático**

### 🟡 Recomendaciones

1. **Hacer backup manual** antes de limpiar (si necesitas los datos)
2. **Ejecutar solo en desarrollo** o cuando estés seguro
3. **Verificar** que estás conectado a la base de datos correcta
4. **Confirmar** que quieres eliminar todos los datos

---

## 🔄 Workflow después de limpiar

Después de limpiar la base de datos, puedes:

### 1. Iniciar sesión como Admin
```
URL: http://localhost:5173
Username: admin
Password: Admin2025!
```

### 2. Crear usuarios necesarios
Desde el panel de admin, crea:
- Médicos evaluadores
- Director médico
- Personal de RRHH
- Otros usuarios según necesites

### 3. Empezar a usar el sistema
- Asignar turnos
- Crear juntas médicas
- Completar dictámenes
- Aprobar/rechazar juntas

---

## 📝 Scripts disponibles

| Script | Descripción | Comando |
|--------|-------------|---------|
| `clean-database.ts` | Limpia toda la BD y crea admin | `npx tsx scripts/clean-database.ts` |
| `verify-clean.ts` | Verifica que la BD esté limpia | `npx tsx scripts/verify-clean.ts` |
| `seed.ts` | Crea solo el usuario admin | `npx prisma db seed` |

---

## 🛠️ Troubleshooting

### Error: "Cannot connect to database"
- Verifica que las variables de entorno estén configuradas
- Revisa `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` en `.env`

### Error: "Permission denied"
- Verifica que tengas permisos de escritura en la base de datos
- Confirma que el token de autenticación sea válido

### La limpieza no elimina todo
- Ejecuta el script de verificación: `npx tsx scripts/verify-clean.ts`
- Si hay datos residuales, ejecuta el script de limpieza nuevamente

---

## 📅 Última limpieza realizada

**Fecha**: 30 de Enero de 2026

**Resumen**:
- Documentos eliminados: 41
- Dictámenes eliminados: 16
- Juntas eliminadas: 27
- Pacientes eliminados: 19
- Usuarios eliminados: 9
- Usuario admin creado: 1

---

## 🔗 Enlaces útiles

- [Documentación de Turso](https://docs.turso.tech/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Estados de Juntas Médicas](./ESTADOS_JUNTAS_MEDICAS.md)

---

**Última actualización**: 30 de Enero de 2026
