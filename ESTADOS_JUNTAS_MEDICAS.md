# Estados de las Juntas Médicas

## 📊 Resumen de Estados

El sistema de Juntas Médicas maneja **6 estados diferentes** para el ciclo de vida de una junta médica.

---

## 🔄 Estados Disponibles

### 1. 🟤 **BORRADOR**
- **Color**: Gris
- **Significado**: La junta está en proceso de creación pero no ha sido finalizada
- **Quién lo asigna**: Sistema (automático al crear)
- **Cuándo se usa**: 
  - Cuando el médico está llenando el dictamen pero no ha presionado "Finalizar"
  - Estado inicial por defecto
- **Acciones permitidas**:
  - ✅ Editar dictamen
  - ✅ Agregar documentos
  - ✅ Eliminar junta
  - ❌ No visible para Director Médico hasta que se finalice

**Ejemplo de uso:**
```
Médico crea junta → Estado: BORRADOR
Médico llena dictamen → Estado: BORRADOR
Médico presiona "Finalizar" → Estado: COMPLETADA
```

---

### 2. 🟡 **PENDIENTE**
- **Color**: Amarillo
- **Significado**: La junta ha sido asignada por el admin pero el médico aún no la ha completado
- **Quién lo asigna**: Sistema (cuando admin asigna turno)
- **Cuándo se usa**:
  - Cuando el admin asigna un turno a un médico
  - La junta está esperando que el médico complete el dictamen
- **Acciones permitidas**:
  - ✅ Médico puede completar el dictamen
  - ✅ Admin puede reasignar
  - ✅ Visible en lista de juntas pendientes

**Ejemplo de uso:**
```
Admin asigna turno → Estado: PENDIENTE
Médico completa dictamen → Estado: COMPLETADA
```

---

### 3. 🔵 **COMPLETADA**
- **Color**: Azul
- **Significado**: El médico evaluador finalizó el dictamen y está listo para revisión
- **Quién lo asigna**: Sistema (cuando médico presiona "Finalizar Junta")
- **Cuándo se usa**:
  - Cuando el médico completa todos los pasos del dictamen
  - El dictamen está guardado y listo para ser revisado por el Director Médico
- **Acciones permitidas**:
  - ✅ Director Médico puede revisar
  - ✅ Director Médico puede aprobar o rechazar
  - ✅ Visible en dashboard de Director Médico
  - ❌ Médico no puede editar (ya finalizada)

**Ejemplo de uso:**
```
Médico presiona "Finalizar" → Estado: COMPLETADA
Director revisa → Puede aprobar o rechazar
```

---

### 4. 🟢 **APROBADA**
- **Color**: Verde
- **Significado**: El Director Médico revisó y aprobó el dictamen
- **Quién lo asigna**: Director Médico, RRHH o Admin
- **Cuándo se usa**:
  - Cuando el Director Médico revisa el dictamen y lo considera correcto
  - El dictamen es válido y puede ser usado oficialmente
- **Acciones permitidas**:
  - ✅ Generar PDF oficial
  - ✅ Exportar datos
  - ✅ Archivar
  - ❌ No se puede editar (estado final)

**Ejemplo de uso:**
```
Director revisa junta COMPLETADA → Aprueba → Estado: APROBADA
```

**Requisitos para aprobar:**
- Debe tener rol: DIRECTOR_MEDICO, RRHH o ADMIN
- Debe agregar detalles de evaluación (comentarios del director)

---

### 5. 🔴 **RECHAZADA**
- **Color**: Rojo
- **Significado**: El Director Médico revisó y rechazó el dictamen
- **Quién lo asigna**: Director Médico, RRHH o Admin
- **Cuándo se usa**:
  - Cuando el dictamen tiene errores o información incorrecta
  - Cuando falta información importante
  - Cuando no cumple con los estándares requeridos
- **Acciones permitidas**:
  - ✅ Ver motivo de rechazo (detalles del director)
  - ✅ Puede ser reabierta para corrección (según política)
  - ❌ No se puede usar oficialmente

**Ejemplo de uso:**
```
Director revisa junta COMPLETADA → Encuentra errores → Rechaza → Estado: RECHAZADA
```

**Requisitos para rechazar:**
- Debe tener rol: DIRECTOR_MEDICO, RRHH o ADMIN
- Debe agregar detalles de evaluación (motivo del rechazo)

---

### 6. 🟠 **DOCUMENTOS_PENDIENTES**
- **Color**: Naranja
- **Significado**: La junta está completa pero faltan documentos adjuntos requeridos
- **Quién lo asigna**: Sistema (automático si faltan documentos después de 72 horas)
- **Cuándo se usa**:
  - Cuando el médico finaliza el dictamen pero no sube todos los documentos requeridos
  - Hay un plazo de 72 horas para subir los documentos
- **Acciones permitidas**:
  - ✅ Subir documentos faltantes
  - ✅ Ver lista de documentos pendientes
  - ⚠️ Si no se completan en 72 horas → puede ser rechazada automáticamente

**Ejemplo de uso:**
```
Médico finaliza dictamen → Faltan 2 documentos → Estado: DOCUMENTOS_PENDIENTES
Médico sube documentos → Estado: COMPLETADA
```

**Documentos requeridos:**
- Examen Psicológico
- Resultados Bioquímicos
- Estudios de Imágenes
- Informes Médicos Previos
- Certificados de Especialidad
- Otros documentos según el caso

---

## 🔄 Flujo de Estados

### Flujo Normal (Exitoso)
```
1. BORRADOR (médico crea)
   ↓
2. COMPLETADA (médico finaliza)
   ↓
3. APROBADA (director aprueba)
```

### Flujo con Asignación de Admin
```
1. PENDIENTE (admin asigna turno)
   ↓
2. COMPLETADA (médico completa)
   ↓
3. APROBADA (director aprueba)
```

### Flujo con Documentos Pendientes
```
1. COMPLETADA (médico finaliza sin documentos)
   ↓
2. DOCUMENTOS_PENDIENTES (faltan docs)
   ↓
3. COMPLETADA (médico sube docs)
   ↓
4. APROBADA (director aprueba)
```

### Flujo con Rechazo
```
1. COMPLETADA (médico finaliza)
   ↓
2. RECHAZADA (director rechaza)
   ↓
3. [Fin o reapertura según política]
```

---

## 👥 Permisos por Rol

### Médico Evaluador
- ✅ Puede crear juntas (BORRADOR)
- ✅ Puede finalizar juntas (BORRADOR → COMPLETADA)
- ✅ Puede subir documentos (DOCUMENTOS_PENDIENTES → COMPLETADA)
- ❌ No puede aprobar/rechazar

### Director Médico
- ✅ Puede revisar juntas COMPLETADAS
- ✅ Puede aprobar (COMPLETADA → APROBADA)
- ✅ Puede rechazar (COMPLETADA → RECHAZADA)
- ✅ Debe agregar comentarios de evaluación

### RRHH
- ✅ Puede ver todas las juntas
- ✅ Puede aprobar/rechazar
- ✅ Puede generar reportes
- ✅ Puede eliminar juntas

### Admin
- ✅ Puede asignar turnos (crear PENDIENTE)
- ✅ Puede aprobar/rechazar
- ✅ Acceso completo a todas las funciones

---

## 🎨 Colores y Badges

| Estado | Color | Badge | Clase CSS |
|--------|-------|-------|-----------|
| BORRADOR | Gris | `bg-gray-100 text-gray-800` | border-gray-200 |
| PENDIENTE | Amarillo | `bg-yellow-100 text-yellow-800` | border-yellow-200 |
| COMPLETADA | Azul | `bg-blue-100 text-blue-800` | border-blue-200 |
| APROBADA | Verde | `bg-green-100 text-green-800` | border-green-200 |
| RECHAZADA | Rojo | `bg-red-100 text-red-800` | border-red-200 |
| DOCUMENTOS_PENDIENTES | Naranja | `bg-orange-100 text-orange-800` | border-orange-200 |

---

## 📝 Etiquetas por Contexto

### En Mis Juntas (Médico)
- BORRADOR → "Borrador"
- PENDIENTE → "Pendiente"
- COMPLETADA → "Completada"
- APROBADA → "Aprobada"
- RECHAZADA → "Rechazada"
- DOCUMENTOS_PENDIENTES → "Faltan Docs."

### En Dashboard Director
- COMPLETADA → "Pendiente de Revisión"
- APROBADA → "Aprobada"
- RECHAZADA → "Rechazada"

### En Vista RRHH
- BORRADOR → "Borrador"
- PENDIENTE → "Pendiente"
- COMPLETADA → "Completada"
- APROBADA → "Aprobada"
- RECHAZADA → "Rechazada"
- DOCUMENTOS_PENDIENTES → "Docs. Pendientes"

---

## ⚠️ Reglas Importantes

1. **Solo DIRECTOR_MEDICO, RRHH o ADMIN** pueden cambiar estado a APROBADA o RECHAZADA
2. **El médico NO puede editar** una junta después de finalizarla (COMPLETADA)
3. **DOCUMENTOS_PENDIENTES** tiene un límite de 72 horas
4. **BORRADOR** no es visible para el Director Médico
5. **APROBADA y RECHAZADA** son estados finales (no se pueden cambiar)

---

## 🔍 Consultas Comunes

### ¿Cuándo una junta pasa de BORRADOR a COMPLETADA?
Cuando el médico presiona el botón "Finalizar Junta" después de completar el dictamen.

### ¿Puede un médico editar una junta COMPLETADA?
No, una vez finalizada (COMPLETADA), el médico no puede editarla. Solo el Director puede aprobar o rechazar.

### ¿Qué pasa si no subo los documentos en 72 horas?
La junta puede ser rechazada automáticamente o requerir aprobación especial del Director.

### ¿Puede una junta RECHAZADA volver a COMPLETADA?
Depende de la política del sistema. Actualmente, RECHAZADA es un estado final, pero puede implementarse un flujo de corrección.

### ¿Quién puede ver juntas en estado BORRADOR?
Solo el médico que la creó. No es visible para Director Médico ni RRHH hasta que se finalice.

---

**Última actualización**: 30 de Enero de 2026
