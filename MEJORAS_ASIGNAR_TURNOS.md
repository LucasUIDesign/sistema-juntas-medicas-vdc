# Mejoras en AsignarTurnos - Búsqueda Inteligente

## ✅ Cambios Implementados

### 1. Eliminación de Datos Demo de Profesionales

**Antes:**
```typescript
const MOCK_PROFESIONALES: Profesional[] = [
  { id: 'prof-001', nombre: 'Dr. Carlos Mendoza', matricula: 'MP 12345', especialidad: 'Medicina Laboral' },
  { id: 'prof-002', nombre: 'Dra. María González', matricula: 'MP 23456', especialidad: 'Medicina Ocupacional' },
];
```

**Después:**
```typescript
// Profesionales se cargarán desde la base de datos
const [profesionales, setProfesionales] = useState<Profesional[]>([]);
```

### 2. Búsqueda Inteligente de Pacientes

**Características:**
- ✅ Autocomplete con búsqueda en tiempo real
- ✅ Busca por nombre o DNI
- ✅ Debounce de 300ms para optimizar peticiones
- ✅ Muestra sugerencias en dropdown
- ✅ Auto-completa nombre y DNI al seleccionar
- ✅ Permite ingreso manual si no se encuentra

**Funcionamiento:**
1. Usuario escribe al menos 2 caracteres
2. Sistema busca en la base de datos de pacientes
3. Muestra resultados en tiempo real
4. Al seleccionar, completa automáticamente nombre y DNI

**Código:**
```typescript
// Búsqueda inteligente de pacientes
useEffect(() => {
  const searchPacientes = async () => {
    if (pacienteSearch.length >= 2) {
      try {
        const results = await juntasService.searchPacientes(pacienteSearch);
        setPacienteSuggestions(results);
        setShowPacienteSuggestions(true);
      } catch (error) {
        console.error('Error searching pacientes:', error);
      }
    } else {
      setPacienteSuggestions([]);
      setShowPacienteSuggestions(false);
    }
  };

  const debounce = setTimeout(searchPacientes, 300);
  return () => clearTimeout(debounce);
}, [pacienteSearch]);
```

### 3. Búsqueda Inteligente de Profesionales

**Características:**
- ✅ Autocomplete con búsqueda en tiempo real
- ✅ Busca por nombre o matrícula
- ✅ Debounce de 300ms para optimizar peticiones
- ✅ Muestra sugerencias en dropdown
- ✅ Auto-completa datos del profesional al seleccionar
- ✅ Permite ingreso manual si no se encuentra

**Funcionamiento:**
1. Usuario escribe al menos 2 caracteres
2. Sistema busca en la lista de médicos del sistema
3. Filtra por nombre o ID (matrícula)
4. Muestra resultados en tiempo real
5. Al seleccionar, completa automáticamente los datos

**Código:**
```typescript
// Búsqueda inteligente de profesionales (médicos)
useEffect(() => {
  const searchProfesionales = async () => {
    if (profesionalSearch.length >= 2) {
      try {
        const results = await juntasService.getMedicos();
        // Filtrar por nombre o matrícula
        const filtered = results.filter(m => 
          m.nombre.toLowerCase().includes(profesionalSearch.toLowerCase()) ||
          (m.id && m.id.toLowerCase().includes(profesionalSearch.toLowerCase()))
        );
        setProfesionalSuggestions(filtered);
        setShowProfesionalSuggestions(true);
      } catch (error) {
        console.error('Error searching profesionales:', error);
      }
    } else {
      setProfesionalSuggestions([]);
      setShowProfesionalSuggestions(false);
    }
  };

  const debounce = setTimeout(searchProfesionales, 300);
  return () => clearTimeout(debounce);
}, [profesionalSearch]);
```

## 🎨 Interfaz de Usuario

### Formulario de Nuevo Turno

**Campo de Paciente:**
```tsx
<div className="relative" ref={pacienteInputRef}>
  <div className="relative">
    <input
      type="text"
      value={pacienteSearch || formData.pacienteNombre}
      onChange={(e) => {
        setPacienteSearch(e.target.value);
        setFormData({ ...formData, pacienteNombre: e.target.value, pacienteDni: '' });
      }}
      placeholder="Buscar por nombre o DNI..."
      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-card"
    />
    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  </div>
  
  {/* Dropdown de sugerencias */}
  {showPacienteSuggestions && pacienteSuggestions.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
      {pacienteSuggestions.map((paciente) => (
        <button onClick={() => handleSelectPaciente(paciente)}>
          <div className="font-medium">{paciente.nombre}</div>
          <div className="text-sm text-gray-500">DNI: {paciente.documento}</div>
        </button>
      ))}
    </div>
  )}
</div>
```

### Formulario de Agregar Profesional

**Campo de Búsqueda:**
```tsx
<div className="relative" ref={profesionalInputRef}>
  <input
    type="text"
    value={profesionalSearch || profesionalForm.nombre}
    onChange={(e) => {
      setProfesionalSearch(e.target.value);
      setProfesionalForm({ ...profesionalForm, nombre: e.target.value });
    }}
    placeholder="Buscar por nombre o matrícula..."
    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-card"
  />
  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  
  {/* Dropdown de sugerencias */}
  {showProfesionalSuggestions && profesionalSuggestions.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
      {profesionalSuggestions.map((prof) => (
        <button onClick={() => handleSelectProfesional(prof)}>
          <div className="font-medium">{prof.nombre}</div>
          <div className="text-sm text-gray-500">ID: {prof.id}</div>
        </button>
      ))}
    </div>
  )}
</div>
```

## 🔧 Optimizaciones Implementadas

### 1. Debouncing
- Espera 300ms después de que el usuario deja de escribir
- Reduce la cantidad de peticiones al servidor
- Mejora el rendimiento

### 2. Click Outside Detection
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (pacienteInputRef.current && !pacienteInputRef.current.contains(event.target as Node)) {
      setShowPacienteSuggestions(false);
    }
    if (profesionalInputRef.current && !profesionalInputRef.current.contains(event.target as Node)) {
      setShowProfesionalSuggestions(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### 3. Mínimo de Caracteres
- Requiere al menos 2 caracteres para iniciar búsqueda
- Evita búsquedas innecesarias
- Mejora la experiencia del usuario

## 📊 Flujo de Usuario

### Asignar Turno con Búsqueda de Paciente

1. Usuario hace click en "Nuevo Turno"
2. Comienza a escribir el nombre o DNI del paciente
3. Después de 2 caracteres, aparecen sugerencias
4. Usuario selecciona un paciente de la lista
5. Nombre y DNI se completan automáticamente
6. Usuario selecciona horario y confirma

### Agregar Profesional con Búsqueda

1. Usuario hace click en "Agregar Profesional"
2. Comienza a escribir el nombre o matrícula
3. Después de 2 caracteres, aparecen sugerencias
4. Usuario selecciona un profesional de la lista
5. Datos se completan automáticamente
6. Usuario puede ajustar especialidad si es necesario
7. Confirma y el profesional se agrega a la nómina

## 🎯 Beneficios

### Para el Usuario
- ✅ Búsqueda más rápida y eficiente
- ✅ Menos errores de tipeo
- ✅ Autocompletado inteligente
- ✅ Experiencia más fluida

### Para el Sistema
- ✅ Datos más consistentes
- ✅ Menos duplicados
- ✅ Mejor integración con la base de datos
- ✅ Validación automática

## 🚀 Despliegue

Los cambios ya están en GitHub y se desplegarán automáticamente:

1. ✅ Commit realizado
2. ✅ Push a GitHub completado
3. ⏳ Vercel detectará los cambios y desplegará automáticamente

**Tiempo estimado:** 2-3 minutos

## 🧪 Pruebas Recomendadas

### Búsqueda de Pacientes
1. Escribir nombre parcial → Verificar sugerencias
2. Escribir DNI parcial → Verificar sugerencias
3. Seleccionar paciente → Verificar autocompletado
4. Escribir nombre no existente → Verificar mensaje
5. Ingresar manualmente → Verificar que funciona

### Búsqueda de Profesionales
1. Escribir nombre parcial → Verificar sugerencias
2. Escribir matrícula → Verificar sugerencias
3. Seleccionar profesional → Verificar autocompletado
4. Escribir nombre no existente → Verificar mensaje
5. Ingresar manualmente → Verificar que funciona

## 📝 Notas Técnicas

### Estados Agregados
```typescript
const [pacienteSearch, setPacienteSearch] = useState('');
const [pacienteSuggestions, setPacienteSuggestions] = useState<any[]>([]);
const [showPacienteSuggestions, setShowPacienteSuggestions] = useState(false);
const [profesionalSearch, setProfesionalSearch] = useState('');
const [profesionalSuggestions, setProfesionalSuggestions] = useState<any[]>([]);
const [showProfesionalSuggestions, setShowProfesionalSuggestions] = useState(false);
const pacienteInputRef = useRef<HTMLInputElement>(null);
const profesionalInputRef = useRef<HTMLInputElement>(null);
```

### Servicios Utilizados
- `juntasService.searchPacientes(query)` - Buscar pacientes
- `juntasService.getMedicos()` - Obtener lista de médicos

## 🔄 Próximas Mejoras Sugeridas

1. **Caché de resultados** - Guardar búsquedas recientes
2. **Búsqueda fuzzy** - Tolerar errores de tipeo
3. **Historial de búsquedas** - Mostrar búsquedas recientes
4. **Filtros avanzados** - Por especialidad, disponibilidad, etc.
5. **Teclado navigation** - Navegar sugerencias con flechas

---

**Fecha de implementación:** 17 de enero de 2025
**Archivos modificados:** 1
**Líneas agregadas:** ~185
**Líneas eliminadas:** ~15
