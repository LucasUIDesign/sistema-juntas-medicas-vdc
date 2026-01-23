# Configuración del Sistema de Notificaciones por Email

## Descripción

El sistema ahora envía notificaciones automáticas por correo electrónico cuando el administrador asigna un turno de junta médica. Se envían dos emails:

1. **Al Médico Evaluador**: Notificación de nueva junta asignada
2. **Al Paciente**: Confirmación de cita programada

## Configuración

### 1. Variables de Entorno

Agregar las siguientes variables al archivo `.env` del backend:

```env
# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación

# Frontend URL (para links en emails)
FRONTEND_URL=https://sistema-juntas-medicas-vdc.vercel.app
```

### 2. Configurar Gmail (Recomendado para desarrollo)

#### Opción A: Usar Contraseña de Aplicación (Más Seguro)

1. Ir a tu cuenta de Google: https://myaccount.google.com/
2. Navegar a **Seguridad** → **Verificación en dos pasos** (activarla si no está activa)
3. Ir a **Contraseñas de aplicaciones**
4. Seleccionar **Correo** y **Otro (nombre personalizado)**
5. Escribir "Sistema Juntas Médicas VDC"
6. Copiar la contraseña generada (16 caracteres)
7. Usar esa contraseña en `EMAIL_PASS`

#### Opción B: Permitir Aplicaciones Menos Seguras (No recomendado)

1. Ir a https://myaccount.google.com/lesssecureapps
2. Activar "Permitir aplicaciones menos seguras"
3. Usar tu contraseña normal de Gmail en `EMAIL_PASS`

### 3. Configurar Otros Proveedores de Email

#### SendGrid (Producción recomendada)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=tu-api-key-de-sendgrid
```

#### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASS=tu-contraseña
```

#### Yahoo

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASS=tu-contraseña-de-aplicación
```

## Modo de Desarrollo (Sin Configuración)

Si no configuras las credenciales de email, el sistema funcionará normalmente pero **simulará** el envío de emails mostrando mensajes en la consola del servidor:

```
📧 Email simulado enviado a: medico@example.com
   Asunto: Nueva Junta Médica Asignada - 25 de enero de 2026
```

Esto permite desarrollar sin necesidad de configurar un servidor de email real.

## Contenido de los Emails

### Email al Médico Evaluador

- **Asunto**: Nueva Junta Médica Asignada - [Fecha]
- **Contenido**:
  - Nombre del paciente
  - Fecha y hora de la junta
  - Lugar de la junta
  - Botón para acceder al sistema

### Email al Paciente

- **Asunto**: Cita Junta Médica Programada - [Fecha]
- **Contenido**:
  - Nombre del médico evaluador
  - Fecha y hora de la cita
  - Lugar de la cita
  - Instrucciones importantes (llegar 15 min antes, traer documentos, etc.)

## Requisitos para Envío de Emails

Para que se envíen los emails, es necesario que:

1. **El médico tenga email configurado** en su perfil de usuario
2. **El paciente tenga email configurado** en sus datos

Si alguno no tiene email, el sistema continuará funcionando normalmente pero no enviará la notificación a ese destinatario.

## Personalización

### Modificar el Lugar por Defecto

En el archivo `backend/src/routes/juntas.ts`, línea ~235:

```typescript
const assignedLugar = lugar || 'VDC Internacional - Sede Principal';
```

### Modificar Plantillas de Email

Las plantillas HTML de los emails están en `backend/src/services/emailService.ts`:

- `sendJuntaNotificationToMedico()` - Email para médicos
- `sendJuntaNotificationToPaciente()` - Email para pacientes

## Verificación

Para verificar que el sistema de emails está funcionando:

1. Asegúrate de que el backend esté corriendo
2. Revisa los logs del servidor al asignar un turno
3. Deberías ver mensajes como:
   - `✅ Email enviado exitosamente a: email@example.com`
   - O `📧 Email simulado enviado a: email@example.com` (modo desarrollo)

## Troubleshooting

### Error: "Invalid login"

- Verifica que el email y contraseña sean correctos
- Si usas Gmail, asegúrate de usar una contraseña de aplicación
- Verifica que la verificación en dos pasos esté activa (Gmail)

### Error: "Connection timeout"

- Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)
- Verifica que no haya firewall bloqueando la conexión

### Los emails no llegan

- Revisa la carpeta de spam
- Verifica que el email del destinatario sea correcto
- Revisa los logs del servidor para ver si hay errores

## Producción

Para producción en Render:

1. Ir a tu servicio en Render
2. Navegar a **Environment**
3. Agregar las variables de entorno:
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `FRONTEND_URL`
4. Guardar y esperar a que el servicio se reinicie

## Seguridad

⚠️ **Importante**:

- **NUNCA** subas las credenciales de email al repositorio
- Usa variables de entorno para todas las credenciales
- En producción, usa servicios profesionales como SendGrid o AWS SES
- Considera usar contraseñas de aplicación en lugar de contraseñas reales
