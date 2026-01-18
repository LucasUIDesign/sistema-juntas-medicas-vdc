# Configuración de Turso Database

## ⚠️ IMPORTANTE: Credenciales Requeridas

Para que el proyecto funcione correctamente en tu PC, necesitas configurar las credenciales de la base de datos Turso.

## 📝 Pasos para Obtener las Credenciales

### Opción 1: Desde la PC Principal

Si tienes acceso a la PC principal donde ya está configurado:

1. Abre el archivo `backend/.env` en la PC principal
2. Copia los valores de:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. Pégalos en tu archivo `backend/.env` local

### Opción 2: Desde Render Dashboard

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Inicia sesión con la cuenta del proyecto
3. Busca el servicio del backend (VDC Juntas Médicas)
4. Ve a la sección **Environment**
5. Copia los valores de:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

### Opción 3: Desde Turso Dashboard

1. Ve a [Turso Dashboard](https://turso.tech/)
2. Inicia sesión
3. Selecciona tu base de datos
4. En la sección **Connection**, encontrarás:
   - **Database URL**: `libsql://[nombre-db].turso.io`
   - **Auth Token**: Click en "Create Token" o usa uno existente

## 🔧 Configurar en tu .env

Edita el archivo `backend/.env` y reemplaza estos valores:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://tu-database-real.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

## ✅ Verificar la Conexión

Después de configurar, reinicia el servidor backend y verifica:

```bash
# En tu navegador, ve a:
http://localhost:3001/debug-env

# Deberías ver:
{
  "TURSO_DATABASE_URL": "libsql://...",
  "TURSO_AUTH_TOKEN_length": 200+,
  ...
}
```

## 🚀 Reiniciar el Servidor

Después de agregar las credenciales:

1. Detén el servidor backend (Ctrl+C)
2. Reinicia: `npm run dev`
3. Los turnos ahora se guardarán correctamente

## 📌 Nota de Seguridad

- ⚠️ **NUNCA** subas el archivo `.env` a Git
- ⚠️ El `.env` ya está en `.gitignore`
- ⚠️ Comparte las credenciales de forma segura (no por email público)

## 🔍 Solución de Problemas

### Error: "TURSO_DATABASE_URL not set"
- Verifica que el archivo `.env` esté en `backend/.env`
- Verifica que las variables estén sin comillas
- Reinicia el servidor

### Error: "Turso error: Unauthorized"
- El token puede haber expirado
- Genera un nuevo token desde Turso Dashboard
- Actualiza `TURSO_AUTH_TOKEN` en `.env`

### Los datos no se guardan
- Verifica que ambas variables estén configuradas
- Revisa los logs del servidor para errores
- Prueba el endpoint `/debug-db` para verificar conexión
