import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { format, isSameDay } from 'date-fns';
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
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

interface Turno {
  id: string;
  fecha: Date;
  hora: string;
  pacienteNombre: string;
  pacienteDni: string;
  medicos: string[];
}

// Mock de turnos existentes
const MOCK_TURNOS_EXISTENTES: Turno[] = [
  {
    id: 'turno-001',
    fecha: new Date(),
    hora: '09:00',
    pacienteNombre: 'Juan Pérez García',
    pacienteDni: '32.456.789',
    medicos: ['Dr. Carlos Mendoza', 'Dra. María González'],
  },
  {
    id: 'turno-002',
    fecha: new Date(),
    hora: '10:30',
    pacienteNombre: 'María López Rodríguez',
    pacienteDni: '28.123.456',
    medicos: ['Dr. Carlos Mendoza'],
  },
];

const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

const AsignarTurnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>(MOCK_TURNOS_EXISTENTES);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    pacienteNombre: '',
    pacienteDni: '',
    hora: '',
    medicos: [''] as string[],
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filtrar médicos vacíos
    const medicosValidos = formData.medicos.filter(m => m.trim() !== '');
    
    if (!selectedDate || !formData.pacienteNombre || !formData.pacienteDni || !formData.hora || medicosValidos.length === 0) {
      toast.warning('Por favor complete todos los campos');
      return;
    }

    // Verificar que el horario no esté ocupado
    if (horariosOcupados.includes(formData.hora)) {
      toast.error('Este horario ya está ocupado');
      return;
    }

    const nuevoTurno: Turno = {
      id: `turno-${Date.now()}`,
      fecha: selectedDate,
      hora: formData.hora,
      pacienteNombre: formData.pacienteNombre,
      pacienteDni: formData.pacienteDni,
      medicos: medicosValidos,
    };

    setTurnos([...turnos, nuevoTurno]);
    setFormData({ pacienteNombre: '', pacienteDni: '', hora: '', medicos: [''] });
    setShowForm(false);
    toast.success('Turno asignado correctamente');
  };

  const handleDeleteTurno = (turnoId: string) => {
    setTurnos(turnos.filter(t => t.id !== turnoId));
    toast.success('Turno eliminado');
  };

  // Custom day class para el calendario
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
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-subtitle font-semibold text-gray-900">
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
              minDate={new Date()}
              dayClassName={getDayClassName}
              calendarClassName="!border-0 !font-sans"
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-vdc-primary/20 mr-2"></div>
                <span>Días con turnos asignados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Turnos del día */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-card shadow-card">
            {/* Header del día */}
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

            {/* Lista de turnos */}
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
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-vdc-primary/30 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-16 h-16 bg-vdc-primary/10 rounded-lg">
                            <div className="text-center">
                              <ClockIcon className="h-5 w-5 text-vdc-primary mx-auto mb-1" />
                              <span className="text-sm font-semibold text-vdc-primary">{turno.hora}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 flex items-center">
                              <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {turno.pacienteNombre}
                            </p>
                            <p className="text-sm text-vdc-secondary flex items-center mt-1">
                              <IdentificationIcon className="h-4 w-4 mr-2 text-gray-400" />
                              DNI: {turno.pacienteDni}
                            </p>
                            <p className="text-sm text-vdc-secondary flex items-center mt-1">
                              <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {turno.medicos.join(', ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTurno(turno.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Eliminar turno"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
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
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Nuevo Turno
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Paciente *
                    </label>
                    <input
                      type="text"
                      value={formData.pacienteNombre}
                      onChange={(e) => setFormData({ ...formData, pacienteNombre: e.target.value })}
                      placeholder="Ej: Juan Pérez García"
                      className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                      required
                    />
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
                    />
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
                          <option key={hora} value={hora}>
                            {hora}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-red-50 text-red-700 rounded-card text-sm">
                        No hay horarios disponibles para este día
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médico(s) Participante(s) *
                    </label>
                    <div className="space-y-2">
                      {formData.medicos.map((medico, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={medico}
                            onChange={(e) => {
                              const newMedicos = [...formData.medicos];
                              newMedicos[index] = e.target.value;
                              setFormData({ ...formData, medicos: newMedicos });
                            }}
                            placeholder="Ej: Dr. Juan Pérez"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                          />
                          {formData.medicos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newMedicos = formData.medicos.filter((_, i) => i !== index);
                                setFormData({ ...formData, medicos: newMedicos });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              aria-label="Eliminar médico"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.medicos.length === 0 && (
                        <input
                          type="text"
                          value=""
                          onChange={(e) => {
                            setFormData({ ...formData, medicos: [e.target.value] });
                          }}
                          placeholder="Ej: Dr. Juan Pérez"
                          className="w-full px-4 py-2 border border-gray-300 rounded-card focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.medicos.length === 0) {
                            setFormData({ ...formData, medicos: [''] });
                          } else {
                            setFormData({ ...formData, medicos: [...formData.medicos, ''] });
                          }
                        }}
                        className="flex items-center text-sm text-vdc-primary hover:text-vdc-primary/80 font-medium"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Agregar otro médico
                      </button>
                    </div>
                  </div>

                  {horariosOcupados.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Horarios ocupados:</p>
                      <div className="flex flex-wrap gap-1">
                        {horariosOcupados.map((h) => (
                          <span key={h} className="px-2 py-0.5 bg-gray-200 rounded text-gray-600">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
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
                      disabled={horariosLibres.length === 0 || formData.medicos.filter(m => m.trim() !== '').length === 0}
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
    </motion.div>
  );
};

export default AsignarTurnos;
