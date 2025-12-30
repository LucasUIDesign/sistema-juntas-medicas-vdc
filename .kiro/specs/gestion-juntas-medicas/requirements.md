# Requirements Document

## Introduction

Sistema web de Gestión de Juntas Médicas para VDC Internacional. Plataforma integral que permite a médicos y personal de RRHH gestionar, supervisar y documentar juntas médicas ocupacionales. El sistema se integra visualmente con el sitio existente de VDC Internacional, implementando autenticación segura basada en roles y almacenamiento en la nube AWS.

## Glossary

- **Junta_Medica**: Registro formal de una evaluación médica ocupacional que incluye fecha, paciente, médico responsable, detalles clínicos, estado de aprobación y documentos adjuntos.
- **Medico_Inferior**: Usuario con rol básico que puede crear y ver juntas médicas con campos limitados.
- **Medico_Superior**: Usuario con rol avanzado que puede crear juntas con campos adicionales (aprobación, adjuntos) y ver todas las juntas.
- **RRHH**: Usuario de Recursos Humanos con acceso total de lectura y edición limitada para supervisión.
- **Sistema**: La aplicación web de Gestión de Juntas Médicas.
- **Dashboard**: Panel de control personalizado según el rol del usuario.
- **Cuestionario_Inteligente**: Formulario dinámico de carga de juntas médicas con validación en tiempo real.
- **AWS_Cognito**: Servicio de autenticación de Amazon Web Services para gestión de usuarios y roles.
- **S3_Storage**: Servicio de almacenamiento de Amazon para archivos adjuntos.

## Requirements

### Requirement 1: Autenticación y Control de Acceso

**User Story:** Como usuario del sistema, quiero iniciar sesión de forma segura con mis credenciales, para acceder a las funcionalidades según mi rol asignado.

#### Acceptance Criteria

1. WHEN un usuario accede a la ruta /login, THE Sistema SHALL mostrar un formulario centrado con campos de usuario y contraseña.
2. WHEN un usuario ingresa credenciales válidas y presiona "Ingresar", THE Sistema SHALL autenticar via AWS Cognito y redirigir al dashboard correspondiente según el rol.
3. WHEN un usuario ingresa credenciales inválidas, THE Sistema SHALL mostrar un mensaje de error en rojo sin revelar qué campo es incorrecto.
4. WHEN un usuario autenticado cierra sesión, THE Sistema SHALL invalidar el token JWT y redirigir a la página de login.
5. WHEN un usuario no autenticado intenta acceder a rutas protegidas, THE Sistema SHALL redirigir automáticamente a /login.
6. WHILE un usuario está autenticado, THE Sistema SHALL almacenar el token JWT de forma segura en el contexto de la aplicación.
7. WHEN un usuario hace clic en "¿Olvidaste contraseña?", THE Sistema SHALL iniciar el flujo de recuperación de Cognito.

### Requirement 2: Dashboard de Médicos - Carga de Juntas

**User Story:** Como médico, quiero cargar nuevas juntas médicas mediante un formulario inteligente, para documentar las evaluaciones ocupacionales de manera eficiente.

#### Acceptance Criteria

1. WHEN un Medico_Inferior o Medico_Superior accede a /dashboard/medico, THE Sistema SHALL mostrar el sidebar de navegación y el formulario de carga.
2. WHEN un médico completa el formulario con datos válidos y presiona "Guardar", THE Sistema SHALL crear la Junta_Medica via API POST y mostrar toast de éxito.
3. WHEN un médico ingresa datos inválidos, THE Sistema SHALL mostrar errores inline en rojo junto a cada campo afectado.
4. WHEN un Medico_Superior carga una junta, THE Sistema SHALL mostrar campos adicionales en accordion: checkbox de aprobación y upload de adjuntos.
5. WHEN un médico sube un archivo adjunto, THE Sistema SHALL validar que sea PDF o imagen y subirlo a S3_Storage.
6. WHEN un médico presiona "Cancelar", THE Sistema SHALL limpiar el formulario sin guardar cambios.
7. THE Sistema SHALL mostrar datepicker para selección de fecha con formato DD/MM/YYYY.
8. THE Sistema SHALL mostrar autocomplete para búsqueda de pacientes y médicos existentes.
9. THE Sistema SHALL limitar el campo de detalles a 500 caracteres con contador visible.

### Requirement 3: Dashboard de Médicos - Visualización de Juntas

**User Story:** Como médico, quiero ver mis juntas médicas recientes en una tabla, para dar seguimiento a mis evaluaciones.

#### Acceptance Criteria

1. WHEN un médico accede a la sección "Mis Juntas", THE Sistema SHALL mostrar una tabla con las juntas creadas por ese médico.
2. THE Sistema SHALL mostrar columnas: Fecha, Paciente, Estado en la tabla de juntas.
3. WHEN un médico hace clic en una fila, THE Sistema SHALL mostrar modal con detalles completos de la junta.
4. THE Sistema SHALL permitir ordenar la tabla por cualquier columna.
5. THE Sistema SHALL paginar resultados con opciones de 10, 25 o 50 registros por página.

### Requirement 4: Dashboard de RRHH - Supervisión Total

**User Story:** Como personal de RRHH, quiero ver y filtrar todas las juntas médicas del sistema, para supervisar y gestionar la información ocupacional.

#### Acceptance Criteria

1. WHEN un usuario RRHH accede a /dashboard/rrhh, THE Sistema SHALL mostrar la vista general con todas las juntas médicas.
2. THE Sistema SHALL mostrar toolbar sticky con filtros: rango de fechas y selector múltiple de médicos.
3. WHEN RRHH aplica filtros y presiona "Buscar", THE Sistema SHALL actualizar la tabla con resultados filtrados via API.
4. THE Sistema SHALL mostrar tabla con columnas: Fecha, Paciente (link), Médico, Detalles (truncados), Acciones.
5. WHEN RRHH hace clic en icono "ver", THE Sistema SHALL mostrar modal readonly con todos los detalles.
6. WHEN RRHH hace clic en icono "editar" (si permitido), THE Sistema SHALL abrir formulario de edición limitada.
7. THE Sistema SHALL mostrar filas con colores alternados (#F8F9FA/#FFF) para mejor legibilidad.
8. WHEN RRHH hace clic en "Exportar", THE Sistema SHALL generar archivo Excel o PDF con los datos filtrados.

### Requirement 5: Navegación y Layout

**User Story:** Como usuario, quiero una interfaz consistente con navegación clara, para usar el sistema de manera intuitiva.

#### Acceptance Criteria

1. THE Sistema SHALL mostrar header fijo con logo VDC a la izquierda y navegación horizontal en azul oscuro #003366.
2. THE Sistema SHALL mostrar botón "Iniciar Sesión" o "Cerrar Sesión" en el header según estado de autenticación.
3. THE Sistema SHALL mostrar sidebar izquierdo (20% ancho) en dashboards con menú de navegación interna.
4. WHEN el usuario accede desde dispositivo móvil, THE Sistema SHALL colapsar sidebar en menú hamburguesa.
5. THE Sistema SHALL mostrar footer con información de contacto y "Derechos Reservados 2025".
6. THE Sistema SHALL mostrar breadcrumbs en dashboards para indicar ubicación actual.
7. WHEN un usuario navega entre secciones, THE Sistema SHALL usar React Router sin recargar la página.

### Requirement 6: Diseño Visual y UX

**User Story:** Como usuario, quiero una interfaz profesional y accesible, para trabajar cómodamente con el sistema.

#### Acceptance Criteria

1. THE Sistema SHALL usar colores corporativos: azul primario #007BFF, verde éxito #28A745, gris secundario #6C757D, rojo error #FF0000.
2. THE Sistema SHALL usar fuentes sans-serif (Arial/Helvetica): 16px body, 24px títulos.
3. THE Sistema SHALL aplicar box-shadow (0 2px 4px rgba(0,0,0,0.1)) y border-radius 8px en cards.
4. THE Sistema SHALL mostrar tooltips en hover para elementos interactivos.
5. THE Sistema SHALL mostrar toasts de feedback al completar acciones (éxito verde, error rojo).
6. THE Sistema SHALL incluir ARIA labels en todos los elementos interactivos.
7. THE Sistema SHALL soportar navegación por teclado con outlines visibles.
8. THE Sistema SHALL respetar prefers-reduced-motion para animaciones opcionales.
9. WHEN el sistema está cargando datos, THE Sistema SHALL mostrar spinner animado.

### Requirement 7: Animaciones y Micro-interacciones

**User Story:** Como usuario, quiero feedback visual sutil en mis interacciones, para confirmar que el sistema responde a mis acciones.

#### Acceptance Criteria

1. WHEN un modal se abre, THE Sistema SHALL aplicar animación fade-in de 0.3s.
2. WHEN el sidebar se abre en móvil, THE Sistema SHALL aplicar animación slide-in de 0.5s.
3. WHEN un usuario hace hover en botones, THE Sistema SHALL aplicar efecto bounce sutil (scale 1.05).
4. WHEN un accordion se expande, THE Sistema SHALL animar la altura con transición de 0.4s.
5. IF el usuario tiene prefers-reduced-motion activado, THEN THE Sistema SHALL desactivar todas las animaciones.

### Requirement 8: API Backend y Persistencia

**User Story:** Como sistema, quiero endpoints API seguros y base de datos en la nube, para gestionar los datos de juntas médicas de forma confiable.

#### Acceptance Criteria

1. THE Sistema SHALL exponer endpoint GET /api/juntas para listar juntas con filtros opcionales.
2. THE Sistema SHALL exponer endpoint POST /api/juntas para crear nueva junta médica.
3. THE Sistema SHALL exponer endpoint PUT /api/juntas/:id para actualizar junta existente.
4. THE Sistema SHALL exponer endpoint GET /api/juntas/:id para obtener detalle de una junta.
5. WHEN una petición API no incluye token válido, THE Sistema SHALL responder con status 401.
6. WHEN una petición API incluye datos inválidos, THE Sistema SHALL responder con status 400 y errores detallados.
7. THE Sistema SHALL almacenar juntas en DynamoDB con campos: id, fecha, paciente, medico, detalles, aprobacion, adjuntos, createdAt, updatedAt.
8. THE Sistema SHALL encriptar datos sensibles antes de almacenar.

### Requirement 9: Gestión de Archivos

**User Story:** Como médico superior, quiero adjuntar documentos a las juntas médicas, para complementar la información clínica.

#### Acceptance Criteria

1. WHEN un Medico_Superior selecciona archivo para adjuntar, THE Sistema SHALL validar tipo (PDF, JPG, PNG) y tamaño (max 10MB).
2. WHEN el archivo es válido, THE Sistema SHALL subirlo a S3_Storage y guardar la URL en la junta.
3. WHEN el archivo es inválido, THE Sistema SHALL mostrar error descriptivo sin intentar subir.
4. WHEN un usuario autorizado solicita ver adjunto, THE Sistema SHALL generar URL firmada temporal de S3.

### Requirement 10: Seguridad

**User Story:** Como administrador del sistema, quiero que la aplicación sea segura, para proteger la información médica sensible.

#### Acceptance Criteria

1. THE Sistema SHALL usar HTTPS para todas las comunicaciones.
2. THE Sistema SHALL validar y sanitizar todos los inputs del usuario.
3. THE Sistema SHALL implementar rate limiting en endpoints API.
4. THE Sistema SHALL no exponer información sensible en mensajes de error.
5. THE Sistema SHALL almacenar tokens de forma segura (httpOnly cookies o secure storage).
6. THE Sistema SHALL implementar CORS restrictivo para dominios autorizados.

### Requirement 11: Usuarios de Prueba y Datos de Demostración

**User Story:** Como equipo de desarrollo, quiero usuarios de prueba precargados y datos de demostración, para validar el funcionamiento del sistema y realizar demostraciones.

#### Acceptance Criteria

1. THE Sistema SHALL incluir usuario de prueba Medico_Inferior: email "medico.junior@vdc-demo.com", password "Demo2025!".
2. THE Sistema SHALL incluir usuario de prueba Medico_Superior: email "medico.senior@vdc-demo.com", password "Demo2025!".
3. THE Sistema SHALL incluir usuario de prueba RRHH: email "rrhh@vdc-demo.com", password "Demo2025!".
4. THE Sistema SHALL precargar 10 juntas médicas de ejemplo con datos realistas para demostración.
5. THE Sistema SHALL incluir 5 pacientes de prueba con nombres ficticios para el autocomplete.
6. THE Sistema SHALL incluir script de seed para poblar la base de datos con datos de demostración.
7. WHEN el sistema se inicia en modo desarrollo, THE Sistema SHALL verificar y crear usuarios de prueba si no existen.
8. THE Sistema SHALL incluir archivo README con credenciales de prueba y guía de demostración.
