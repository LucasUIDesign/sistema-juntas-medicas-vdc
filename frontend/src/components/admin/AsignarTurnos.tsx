import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { format, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { juntasService } from '../../services/juntasService';
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

interface Profesional {
  id: string;
  nombre: string;
  matricula: string;
  especialidad: string;
}

interface Turno {
  id: string;
  fecha: Date;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  medicoNombre?: string; // Agregar nombre del médico
  medicoId?: string; // Agregar ID del médico
}

const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

const AsignarTurnos = () => {
  // Fecha mínima: 72 horas (3 días) de anticipación para notificación
  const fechaMinima = addDays(new Date(), 3);
  
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(fechaMinima);
  const [showForm, setShowForm] = useState(false);
  const [showProfesionalForm, setShowProfesionalForm] = useState(false);
  const [isLoadingTurnos, setIsLoadingTurnos] = useState(true);
  
  // Form state para turno
  const [formData, setFormData] = useState({
    pacienteNombre: '',
    pacienteDni: '',
    hora: '',
    medicoId: '', // ID del médico evaluador asignado
  });

  // Form state para profesional
  const [profesionalForm, setProfesionalForm] = useState({
    nombre: '',
    matricula: '',
    especialidad: '',
  });

  // Autocomplete states
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacienteSuggestions, setPacienteSuggestions] = useState<any[]>([]);
  const [showPacienteSuggestions, setShowPacienteSuggestions] = useState(false);
  const [profesionalSearch, setProfesionalSearch] = useState('');
  const [profesionalSuggestions, setProfesionalSuggestions] = useState<any[]>([]);
  const [showProfesionalSuggestions, setShowProfesionalSuggestions] = useState(false);
  const [medicosEvaluadores, setMedicosEvaluadores] = useState<any[]>([]); // Lista de médicos evaluadores
  const pacienteInputRef = useRef<HTMLInputElement>(null);
  const profesionalInputRef = useRef<HTMLInputElement>(null);

  // Obtener turnos del día seleccionado
  const turnosDelDia = selectedDate 
    ? turnos.filter(t => isSameDay(t.fecha, selectedDate))
    : [];

  // Obtener horarios ocupados del día
  const horariosOcupados = turnosDelDia.map(t => t.hora);

  // Horarios disponibles para el día seleccionado
  const horariosLibres = HORARIOS_DISPONIBLES.filter(h => !horariosOcupados.includes(h));

  // Fechas con turnos (para marcar en el calendario)
  const fechasConTurnos = turnos.map(t => t.fecha);

  // Cargar médicos evaluadores al montar el componente
  useEffect(() => {
    const loadMedicos = async () => {
      try {
        const medicos = await juntasService.getMedicos();
        setMedicosEvaluadores(medicos);
      } catch (error) {
        console.error('Error loading medicos:', error);
      }
    };
    loadMedicos();
  }, []);

  // Cargar turnos existentes al montar el componente
  useEffect(() => {
    const loadTurnos = async () => {
      try {
        setIsLoadingTurnos(true);
        // Obtener todas las juntas con estado PENDIENTE (turnos asignados)
        const response = await juntasService.getJuntas({ estado: 'PENDIENTE', pageSize: 100 });
        
        // Transformar a formato Turno
        const turnosData: Turno[] = response.data
          .filter(junta => junta.hora) // Solo juntas con hora asignada
          .map(junta => ({
            id: junta.id,
            fecha: new Date(junta.fecha),
            hora: junta.hora!,
            pacienteNombre: junta.pacienteNombre,
            pacienteDni: junta.pacienteDni || '',
            medicoNombre: junta.medicoNombre || 'Médico no asignado',
            medicoId: junta.medicoId,
          }));
        
        setTurnos(turnosData);
      } catch (error) {
        console.error('Error loading turnos:', error);
        toast.error('Error al cargar los turnos');
      } finally {
        setIsLoadingTurnos(false);
      }
    };
    loadTurnos();
  }, []);

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

  // Cerrar sugerencias al hacer click fuera
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

  // Seleccionar paciente de las sugerencias
  const handleSelectPaciente = (paciente: any) => {
    setFormData({
      ...formData,
      pacienteNombre: paciente.nombre,
      pacienteDni: paciente.documento,
    });
    setPacienteSearch('');
    setShowPacienteSuggestions(false);
  };

  // Seleccionar profesional de las sugerencias
  const handleSelectProfesional = (profesional: any) => {
    setProfesionalForm({
      nombre: profesional.nombre,
      matricula: profesional.id, // Usamos el ID como matrícula por ahora
      especialidad: 'Medicina Laboral', // Valor por defecto
    });
    setProfesionalSearch('');
    setShowProfesionalSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !formData.pacienteNombre || !formData.pacienteDni || !formData.hora || !formData.medicoId) {
      toast.warning('Por favor complete todos los campos');
      return;
    }

    if (horariosOcupados.includes(formData.hora)) {
      toast.error('Este horario ya está ocupado');
      return;
    }

    try {
      console.log('Iniciando creación de turno...');
      console.log('Datos del formulario:', formData);
      
      // Buscar o crear el paciente
      let pacienteId = '';
      console.log('Buscando paciente con DNI:', formData.pacienteDni);
      const pacientes = await juntasService.searchPacientes(formData.pacienteDni);
      console.log('Pacientes encontrados:', pacientes);
      
      if (pacientes.length > 0) {
        // Paciente existe
        pacienteId = pacientes[0].id;
        console.log('Paciente encontrado, ID:', pacienteId);
      } else {
        // Crear nuevo paciente
        console.log('Creando nuevo paciente...');
        const nombreParts = formData.pacienteNombre.trim().split(' ');
        const nombre = nombreParts[0];
        const apellido = nombreParts.slice(1).join(' ') || nombre;
        
        const nuevoPaciente = await juntasService.createPaciente({
          nombre,
          apellido,
          numeroDocumento: formData.pacienteDni,
        });
        pacienteId = nuevoPaciente.id;
        console.log('Paciente creado, ID:', pacienteId);
      }

      // Crear la junta médica con el turno asignado al médico seleccionado
      console.log('Creando junta médica para médico:', formData.medicoId);
      const nuevaJunta = await juntasService.createJuntaParaMedico({
        pacienteId,
        medicoId: formData.medicoId,
        hora: formData.hora,
        fecha: selectedDate.toISOString(),
        observaciones: `Turno asignado para el ${format(selectedDate, "dd/MM/yyyy")} a las ${formData.hora}`,
      });
      console.log('Junta creada:', nuevaJunta);

      // Buscar el nombre del médico asignado
      const medicoAsignado = medicosEvaluadores.find(m => m.id === formData.medicoId);
      const nombreMedico = medicoAsignado?.nombre || 'médico';
      
      // Agregar al estado local para mostrar en la UI
      const nuevoTurno: Turno = {
        id: nuevaJunta.id,
        fecha: selectedDate,
        hora: formData.hora,
        pacienteNombre: formData.pacienteNombre,
        pacienteDni: formData.pacienteDni,
        medicoNombre: nombreMedico,
        medicoId: formData.medicoId,
      };

      setTurnos([...turnos, nuevoTurno]);
      setFormData({ pacienteNombre: '', pacienteDni: '', hora: '', medicoId: '' });
      setPacienteSearch('');
      setShowForm(false);
      
      toast.success(`Turno asignado correctamente a ${nombreMedico}. Será notificado.`);
    } catch (error: any) {
      console.error('Error completo al crear turno:', error);
      console.error('Mensaje de error:', error.message);
      console.error('Stack:', error.stack);
      toast.error(error.message || 'Error al asignar el turno. Revise la consola para más detalles.');
    }
  };

  const handleAddProfesional = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profesionalForm.nombre || !profesionalForm.matricula || !profesionalForm.especialidad) {
      toast.warning('Por favor complete todos los campos');
      return;
    }

    const nuevoProfesional: Profesional = {
      id: `prof-${Date.now()}`,
      nombre: profesionalForm.nombre,
      matricula: profesionalForm.matricula,
      especialidad: profesionalForm.especialidad,
    };

    setProfesionales([...profesionales, nuevoProfesional]);
    setProfesionalForm({ nombre: '', matricula: '', especialidad: '' });
    setShowProfesionalForm(false);
    toast.success('Profesional agregado a la nómina');
  };

  const handleDeleteTurno = async (turnoId: string) => {
    try {
      // Eliminar de la base de datos
      await juntasService.deleteJunta(turnoId);
      
      // Eliminar del estado local
      setTurnos(turnos.filter(t => t.id !== turnoId));
      toast.success('Turno eliminado');
    } catch (error: any) {
      console.error('Error al eliminar turno:', error);
      toast.error('Error al eliminar el turno');
    }
  };

  const handleDeleteProfesional = (profId: string) => {
    setProfesionales(profesionales.filter(p => p.id !== profId));
    toast.success('Profesional eliminado de la nómina');
  };

  const getDayClassName = (date: Date) => {
    const tieneTurnos = fechasConTurnos.some(f => isSameDay(f, date));
    if (tieneTurnos) {
      return 'bg-vdc-primary/20 text-vdc-primary font-semibold rounded-full';
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Profesionales de la Junta */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-subtitle font-semibold text-gray-900 flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2 text-vdc-primary" />
              Profesionales de la Junta
            </h2>
            <p className="text-vdc-secondary text-sm mt-1">
              Nómina de médicos que participan en las juntas médicas
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowProfesionalForm(true)}
            className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Profesional
          </motion.button>
        </div>

        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {profesionales.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {profesionales.map((prof) => (
                <div
                  key={prof.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-vdc-primary/10 rounded-full flex items-center justify-center">
                      <AcademicCapIcon className="h-6 w-6 text-vdc-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{prof.nombre}</p>
                      <p className="text-sm text-vdc-secondary">
                        {prof.matricula} • {prof.especialidad}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProfesional(prof.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Eliminar profesional"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-vdc-secondary">No hay profesionales en la nómina</p>
              <button
                onClick={() => setShowProfesionalForm(true)}
                className="mt-4 text-vdc-primary hover:text-vdc-primary/80 font-medium"
              >
                + Agregar primer profesional
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Asignar Turnos */}
      <div>
        <div className="mb-4">
          <h2 className="text-subtitle font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2 text-vdc-primary" />
            Asignar Turnos
          </h2>
          <p className="text-vdc-secondary text-sm mt-1">
            Gestione los turnos de juntas médicas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-card shadow-card p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-vdc-primary" />
                Seleccionar Fecha
              </h3>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                inline
                locale={es}
                minDate={fechaMinima}
                dayClassName={getDayClassName}
                calendarClassName="!border-0 !font-sans"
              />
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-vdc-primary/20 mr-2"></div>
                  <span>Días con turnos asignados</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700">
                    <strong>Nota:</strong> Los turnos deben asignarse con al menos 72 horas de anticipación para cumplir con el plazo de notificación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Turnos del día */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-card shadow-card">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedDate 
                      ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
                      : 'Seleccione una fecha'}
                  </h3>
                  <p className="text-sm text-vdc-secondary mt-1">
                    {turnosDelDia.length} turno{turnosDelDia.length !== 1 ? 's' : ''} asignado{turnosDelDia.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedDate && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nuevo Turno
                  </motion.button>
                )}
              </div>

              <div className="p-4">
                {turnosDelDia.length > 0 ? (
                  <div className="space-y-3">
                    {turnosDelDia
                      .sort((a, b) => a.hora.localeCompare(b.hora))
                      .map((turno) => (
                        <motion.div
                          key={turno.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-vdc-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="flex items-center justify-center w-16 h-16 bg-vdc-primary/10 rounded-lg flex-shrink-0">
                                <div className="text-center">
                                  <ClockIcon className="h-5 w-5 text-vdc-primary mx-auto mb-1" />
                                  <span className="text-sm font-semibold text-vdc-primary">{turno.hora}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <p className="font-medium text-gray-900 flex items-center">
                                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    {turno.pacienteNombre}
                                  </p>
                                  <p className="text-sm text-vdc-secondary flex items-center mt-1">
                                    <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    DNI: {turno.pacienteDni}
                                  </p>
                                </div>
                                {/* Médico Evaluador Asignado */}
                                {turno.medicoNombre && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center">
                                      <AcademicCapIcon className="h-3 w-3 mr-1" />
                                      Médico Evaluador:
                                    </p>
                                    <span className="inline-flex items-center px-2 py-0.5 bg-vdc-primary/10 text-vdc-primary text-xs rounded-full font-medium">
                                      {turno.medicoNombre}
                                    </span>
                                  </div>
                                )}
                                {/* Profesionales de la Junta */}
                                {profesionales.length > 0 && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center">
                                      <UserGroupIcon className="h-3 w-3 mr-1" />
                                      Profesionales de la Junta:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {profesionales.map((prof) => (
                                        <span
                                          key={prof.id}
                                          className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                        >
                                          {prof.nombre}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTurno(turno.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                              aria-label="Eliminar turno"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-vdc-secondary">
                      {selectedDate 
                        ? 'No hay turnos asignados para este día'
                        : 'Seleccione una fecha para ver los turnos'}
                    </p>
                    {selectedDate && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 text-vdc-primary hover:text-vdc-primary/80 font-medium"
                      >
                        + Asignar primer turno
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de nuevo turno */}
      <AnimatePresence>
        {showForm && selectedDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Nuevo Turno</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Paciente *
                    </label>
                    <div className="relative" ref={pacienteInputRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={pacienteSearch || formData.pacienteNombre}
                          onChange={(e) => {
                            setPacienteSearch(e.target.value);
                            setFormData({ ...formData, pacienteNombre: e.target.value, pacienteDni: '' });
                          }}
                          onFocus={() => pacienteSearch.length >= 2 && setShowPacienteSuggestions(true)}
                          placeholder="Buscar por nombre o DNI..."
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                          required
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Sugerencias de pacientes */}
                      {showPacienteSuggestions && pacienteSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {pacienteSuggestions.map((paciente) => (
                            <button
                              key={paciente.id}
                              type="button"
                              onClick={() => handleSelectPaciente(paciente)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{paciente.nombre}</div>
                              <div className="text-sm text-gray-500">DNI: {paciente.documento}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showPacienteSuggestions && pacienteSearch.length >= 2 && pacienteSuggestions.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          No se encontraron pacientes. Ingrese el nombre manualmente.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      value={formData.pacienteDni}
                      onChange={(e) => setFormData({ ...formData, pacienteDni: e.target.value })}
                      placeholder="Ej: 32.456.789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                      disabled={!!formData.pacienteDni && pacienteSearch === ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médico Evaluador *
                    </label>
                    <select
                      value={formData.medicoId}
                      onChange={(e) => setFormData({ ...formData, medicoId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                    >
                      <option value="">Seleccionar médico...</option>
                      {medicosEvaluadores.map((medico) => (
                        <option key={medico.id} value={medico.id}>{medico.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horario *
                    </label>
                    {horariosLibres.length > 0 ? (
                      <select
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                        required
                      >
                        <option value="">Seleccionar horario...</option>
                        {horariosLibres.map((hora) => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-red-50 text-red-700 rounded-card text-sm">
                        No hay horarios disponibles para este día
                      </div>
                    )}
                  </div>

                  {horariosOcupados.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Horarios ocupados:</p>
                      <div className="flex flex-wrap gap-1">
                        {horariosOcupados.map((h) => (
                          <span key={h} className="px-2 py-0.5 bg-gray-200 rounded text-gray-600">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-card hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={horariosLibres.length === 0}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Asignar Turno
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de nuevo profesional */}
      <AnimatePresence>
        {showProfesionalForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfesionalForm(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Agregar Profesional</h3>
                  <button
                    onClick={() => setShowProfesionalForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleAddProfesional} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar Profesional
                    </label>
                    <div className="relative" ref={profesionalInputRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={profesionalSearch || profesionalForm.nombre}
                          onChange={(e) => {
                            setProfesionalSearch(e.target.value);
                            setProfesionalForm({ ...profesionalForm, nombre: e.target.value });
                          }}
                          onFocus={() => profesionalSearch.length >= 2 && setShowProfesionalSuggestions(true)}
                          placeholder="Buscar por nombre o matrícula..."
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      
                      {/* Sugerencias de profesionales */}
                      {showProfesionalSuggestions && profesionalSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {profesionalSuggestions.map((prof) => (
                            <button
                              key={prof.id}
                              type="button"
                              onClick={() => handleSelectProfesional(prof)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{prof.nombre}</div>
                              <div className="text-sm text-gray-500">ID: {prof.id}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showProfesionalSuggestions && profesionalSearch.length >= 2 && profesionalSuggestions.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          No se encontraron profesionales en el sistema.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={profesionalForm.nombre}
                      onChange={(e) => setProfesionalForm({ ...profesionalForm, nombre: e.target.value })}
                      placeholder="Ej: Dr. Juan Pérez"
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matrícula *
                    </label>
                    <input
                      type="text"
                      value={profesionalForm.matricula}
                      onChange={(e) => setProfesionalForm({ ...profesionalForm, matricula: e.target.value })}
                      placeholder="Ej: MP 12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidad *
                    </label>
                    <input
                      type="text"
                      value={profesionalForm.especialidad}
                      onChange={(e) => setProfesionalForm({ ...profesionalForm, especialidad: e.target.value })}
                      placeholder="Ej: Medicina Laboral"
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProfesionalForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-card hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-vdc-primary text-white rounded-card hover:bg-vdc-primary/90 transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Agregar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AsignarTurnos;
