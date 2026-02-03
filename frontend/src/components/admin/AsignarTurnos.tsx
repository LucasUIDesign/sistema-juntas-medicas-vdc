import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { format, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XMarkIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

interface Turno {
  id: string;
  fecha: Date;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  medicoNombre?: string;
  medicoId?: string;
  lugar?: string;
  observaciones?: string;
  estado: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  numeroDocumento: string;
}

interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
}

const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const AsignarTurnos = () => {
  // Fecha mínima: 72 horas (3 días) de anticipación para notificación
  const fechaMinima = addDays(new Date(), 3);
  
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(fechaMinima);
  const [showForm, setShowForm] = useState(false);
  const [isLoadingTurnos, setIsLoadingTurnos] = useState(true);
  
  // Form state para turno
  const [formData, setFormData] = useState({
    pacienteId: '',
    pacienteNombre: '',
    pacienteDni: '',
    hora: '',
    medicoId: '',
    lugar: 'VDC Internacional - Sede Principal',
    observaciones: '',
  });

  // Autocomplete states
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacienteSuggestions, setPacienteSuggestions] = useState<Paciente[]>([]);
  const [showPacienteSuggestions, setShowPacienteSuggestions] = useState(false);
  const [medicosEvaluadores, setMedicosEvaluadores] = useState<Medico[]>([]);
  const pacienteInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('vdc_token');

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

  // Cargar médicos evaluadores
  useEffect(() => {
    const loadMedicos = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/medicos`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMedicosEvaluadores(data);
        }
      } catch (error) {
        console.error('Error loading medicos:', error);
      }
    };
    loadMedicos();
  }, []);

  // Cargar turnos existentes
  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    try {
      setIsLoadingTurnos(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/turnos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const turnosData: Turno[] = data.map((turno: any) => ({
          id: turno.id,
          fecha: new Date(turno.fecha),
          hora: turno.hora,
          pacienteNombre: turno.pacienteNombre,
          pacienteDni: turno.pacienteDni,
          medicoNombre: turno.medicoNombre,
          medicoId: turno.medicoId,
          lugar: turno.lugar,
          observaciones: turno.observaciones,
          estado: turno.estado,
        }));
        setTurnos(turnosData);
      }
    } catch (error) {
      console.error('Error loading turnos:', error);
      toast.error('Error al cargar los turnos');
    } finally {
      setIsLoadingTurnos(false);
    }
  };

  // Buscar pacientes
  useEffect(() => {
    const searchPacientes = async () => {
      if (pacienteSearch.length < 2) {
        setPacienteSuggestions([]);
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(
          `${API_URL}/pacientes?search=${encodeURIComponent(pacienteSearch)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          setPacienteSuggestions(data);
        }
      } catch (error) {
        console.error('Error searching pacientes:', error);
      }
    };

    const debounce = setTimeout(searchPacientes, 300);
    return () => clearTimeout(debounce);
  }, [pacienteSearch]);

  const handleSelectPaciente = (paciente: Paciente) => {
    setFormData({
      ...formData,
      pacienteId: paciente.id,
      pacienteNombre: paciente.nombreCompleto,
      pacienteDni: paciente.numeroDocumento,
    });
    setPacienteSearch(paciente.nombreCompleto);
    setShowPacienteSuggestions(false);
  };

  const handleSubmitTurno = async () => {
    if (!selectedDate) {
      toast.error('Seleccione una fecha');
      return;
    }

    if (!formData.pacienteId) {
      toast.error('Seleccione un paciente existente');
      return;
    }

    if (!formData.hora) {
      toast.error('Seleccione un horario');
      return;
    }

    if (!formData.medicoId) {
      toast.error('Seleccione un médico evaluador');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/turnos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pacienteId: formData.pacienteId,
          medicoId: formData.medicoId,
          fecha: selectedDate.toISOString(),
          hora: formData.hora,
          lugar: formData.lugar,
          observaciones: `Turno asignado para el ${format(selectedDate, "dd/MM/yyyy")} a las ${formData.hora}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const medicoAsignado = medicosEvaluadores.find(m => m.id === formData.medicoId);
        
        toast.success(`Turno asignado correctamente a ${medicoAsignado?.nombre || 'médico'}`);
        
        // Recargar turnos
        await loadTurnos();
        
        // Limpiar formulario
        setFormData({
          pacienteId: '',
          pacienteNombre: '',
          pacienteDni: '',
          hora: '',
          medicoId: '',
          lugar: 'VDC Internacional - Sede Principal',
          observaciones: '',
        });
        setPacienteSearch('');
        setShowForm(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al asignar el turno');
      }
    } catch (error: any) {
      console.error('Error al crear turno:', error);
      toast.error(error.message || 'Error al asignar el turno');
    }
  };

  const handleDeleteTurno = async (turnoId: string) => {
    if (!confirm('¿Está seguro de eliminar este turno?')) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/turnos/${turnoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Turno eliminado correctamente');
        await loadTurnos();
      } else {
        toast.error('Error al eliminar el turno');
      }
    } catch (error) {
      console.error('Error deleting turno:', error);
      toast.error('Error al eliminar el turno');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Asignar Turnos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los turnos de las juntas médicas con anticipación mínima de 72 horas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-vdc-primary" />
              Calendario
            </h3>
            
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              inline
              locale={es}
              minDate={fechaMinima}
              highlightDates={fechasConTurnos}
              calendarClassName="custom-calendar"
            />

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los turnos deben asignarse con al menos 72 horas de anticipación.
              </p>
            </div>
          </div>
        </div>

        {/* Turnos del día */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : 'Seleccione una fecha'}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="inline-flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
                >
                  {showForm ? (
                    <>
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Nuevo Turno
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Formulario de nuevo turno */}
            <AnimatePresence>
              {showForm && selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <h4 className="font-medium text-gray-900 mb-4">Asignar Nuevo Turno</h4>
                  
                  <div className="space-y-4">
                    {/* Buscar Paciente */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paciente <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          ref={pacienteInputRef}
                          type="text"
                          value={pacienteSearch}
                          onChange={(e) => {
                            setPacienteSearch(e.target.value);
                            setShowPacienteSuggestions(true);
                          }}
                          onFocus={() => setShowPacienteSuggestions(true)}
                          placeholder="Buscar paciente por nombre o DNI..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                        />
                      </div>
                      
                      {/* Sugerencias de pacientes */}
                      {showPacienteSuggestions && pacienteSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {pacienteSuggestions.map((paciente) => (
                            <button
                              key={paciente.id}
                              onClick={() => handleSelectPaciente(paciente)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium text-gray-900">{paciente.nombreCompleto}</div>
                                <div className="text-sm text-gray-500">DNI: {paciente.numeroDocumento}</div>
                              </div>
                              <CheckCircleIcon className="w-5 h-5 text-vdc-primary" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Médico Evaluador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Médico Evaluador <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.medicoId}
                        onChange={(e) => setFormData({ ...formData, medicoId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                      >
                        <option value="">Seleccione un médico</option>
                        {medicosEvaluadores.map((medico) => (
                          <option key={medico.id} value={medico.id}>
                            {medico.nombre} {medico.apellido}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Horario */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.hora}
                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                      >
                        <option value="">Seleccione un horario</option>
                        {horariosLibres.map((hora) => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                      {horariosLibres.length === 0 && (
                        <p className="mt-1 text-sm text-red-600">No hay horarios disponibles para este día</p>
                      )}
                    </div>

                    {/* Lugar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lugar
                      </label>
                      <input
                        type="text"
                        value={formData.lugar}
                        onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent"
                      />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setFormData({
                            pacienteId: '',
                            pacienteNombre: '',
                            pacienteDni: '',
                            hora: '',
                            medicoId: '',
                            lugar: 'VDC Internacional - Sede Principal',
                            observaciones: '',
                          });
                          setPacienteSearch('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmitTurno}
                        className="px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90"
                      >
                        Asignar Turno
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lista de turnos */}
            {isLoadingTurnos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vdc-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando turnos...</p>
              </div>
            ) : turnosDelDia.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay turnos asignados para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {turnosDelDia.map((turno) => (
                  <motion.div
                    key={turno.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-vdc-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center text-vdc-primary">
                            <ClockIcon className="w-5 h-5 mr-1" />
                            <span className="font-semibold">{turno.hora}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <UserIcon className="w-5 h-5 mr-1" />
                            <span>{turno.pacienteNombre}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <IdentificationIcon className="w-5 h-5 mr-1" />
                            <span className="text-sm">{turno.pacienteDni}</span>
                          </div>
                        </div>
                        {turno.medicoNombre && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <AcademicCapIcon className="w-4 h-4 mr-1" />
                            <span>Médico: {turno.medicoNombre}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTurno(turno.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Eliminar turno"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignarTurnos;
