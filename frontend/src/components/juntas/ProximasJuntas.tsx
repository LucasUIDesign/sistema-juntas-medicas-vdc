import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { JuntaAsignada } from '../../types';
import { juntasService } from '../../services/juntasService';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  MapPinIcon,
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
      setJuntasAsignadas(data);
    } catch (error) {
      console.error('Error loading juntas asignadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFechaLabel = (fecha: string) => {
    const date = new Date(fecha);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "EEEE d", { locale: es });
  };

  const getMesLabel = (fecha: string) => {
    const date = new Date(fecha);
    if (isToday(date) || isTomorrow(date)) {
      return format(date, "d 'de' MMMM", { locale: es });
    }
    return format(date, "MMMM", { locale: es });
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
          Próximos Turnos
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
        Próximos Turnos
        <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {juntasAsignadas.length} pendiente{juntasAsignadas.length > 1 ? 's' : ''}
        </span>
      </h3>
      
      <div className="space-y-3">
        {juntasAsignadas.map((junta, index) => {
          const fechaDate = new Date(junta.fecha);
          const esHoy = isToday(fechaDate);
          const esManana = isTomorrow(fechaDate);
          
          return (
            <motion.div
              key={junta.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg overflow-hidden border ${
                esHoy 
                  ? 'border-vdc-primary bg-blue-50/50' 
                  : esManana 
                    ? 'border-orange-200 bg-orange-50/30'
                    : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              {/* Header con fecha */}
              <div className={`px-3 py-2 flex items-center justify-between ${
                esHoy 
                  ? 'bg-vdc-primary text-white' 
                  : esManana 
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                <span className="font-semibold text-sm capitalize">
                  {getFechaLabel(junta.fecha)}
                </span>
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

                {/* Lugar */}
                {junta.lugar && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{junta.lugar}</span>
                  </div>
                )}

                {/* Fecha completa para días futuros */}
                {!esHoy && !esManana && (
                  <p className="text-xs text-gray-400 mt-2 capitalize">
                    {getMesLabel(junta.fecha)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProximasJuntas;
