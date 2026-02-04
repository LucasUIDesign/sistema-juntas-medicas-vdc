import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { JuntaAsignada } from '../../types';
import { juntasService } from '../../services/juntasService';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const ProximasJuntas = () => {
  const [juntasAsignadas, setJuntasAsignadas] = useState<JuntaAsignada[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJuntasAsignadas();
  }, []);

  const loadJuntasAsignadas = async () => {
    try {
      const data = await juntasService.getJuntasAsignadas();
      console.log('Juntas asignadas recibidas:', data);
      
      // Filtrar turnos de hoy y próximos
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const turnosFuturos = data.filter(junta => {
        const fechaJunta = new Date(junta.fecha);
        fechaJunta.setHours(0, 0, 0, 0);
        const esFuturo = fechaJunta >= hoy;
        console.log(`Turno ${junta.id}: fecha=${fechaJunta.toISOString()}, hoy=${hoy.toISOString()}, esFuturo=${esFuturo}`);
        return esFuturo;
      });
      
      // Ordenar por fecha ascendente (próximos primero)
      turnosFuturos.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        return fechaA - fechaB;
      });
      
      console.log('Turnos futuros filtrados y ordenados:', turnosFuturos);
      
      // Solo mostrar el turno más próximo (el primero)
      const proximoTurno = turnosFuturos.length > 0 ? [turnosFuturos[0]] : [];
      console.log('Próximo turno a mostrar:', proximoTurno);
      
      setJuntasAsignadas(proximoTurno);
    } catch (error) {
      console.error('Error loading juntas asignadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded-lg"></div>
          <div className="h-24 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (juntasAsignadas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
          <CalendarDaysIcon className="h-5 w-5 mr-2 text-vdc-primary" />
          Próximo Turno
        </h3>
        <div className="text-center py-6">
          <CalendarDaysIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            No hay turnos asignados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
        <CalendarDaysIcon className="h-5 w-5 mr-2 text-vdc-primary" />
        Próximo Turno
      </h3>
      
      {/* Mostrar fecha de cada turno */}
      <div className="space-y-3">
        {juntasAsignadas.map((junta, index) => {
          const fechaJunta = new Date(junta.fecha);
          const esHoy = isToday(fechaJunta);
          
          return (
            <div key={junta.id}>
              {/* Fecha del turno */}
              <div className="mb-2 px-3 py-2 bg-vdc-primary/10 rounded-lg">
                <p className="text-sm text-vdc-primary font-medium capitalize">
                  {esHoy ? '🔔 Hoy - ' : ''}
                  {format(fechaJunta, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg overflow-hidden border border-vdc-primary bg-blue-50/50"
              >
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
                    <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {junta.pacienteNombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        DNI: {junta.pacienteDni}
                      </p>
                    </div>
                  </div>

                  {/* Médicos participantes */}
                  {junta.profesionales && junta.profesionales.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium">Médicos participantes:</span>
                      </div>
                      <div className="space-y-1 ml-5">
                        {junta.profesionales.map((prof) => (
                          <div key={prof.id} className="text-xs">
                            <span className="text-gray-800 font-medium">{prof.nombre}</span>
                            <span className="text-gray-500 ml-1">• {prof.especialidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProximasJuntas;
