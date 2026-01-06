import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { JuntaAsignada } from '../../types';
import { juntasService } from '../../services/juntasService';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-card shadow-card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (juntasAsignadas.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-4">
        <h3 className="text-sm font-semibold text-vdc-primary mb-3 flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Próximas Juntas Asignadas
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">
          No hay juntas asignadas próximamente
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <h3 className="text-sm font-semibold text-vdc-primary mb-3 flex items-center">
        <CalendarIcon className="h-4 w-4 mr-2" />
        Próximas Juntas Asignadas
      </h3>
      
      <div className="space-y-3">
        {juntasAsignadas.map((junta, index) => (
          <motion.div
            key={junta.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-gray-200 rounded-lg p-3 hover:border-vdc-primary/30 hover:bg-blue-50/30 transition-colors"
          >
            {/* Fecha y Hora */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-vdc-primary font-medium text-sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {format(new Date(junta.fecha), "EEEE d 'de' MMMM", { locale: es })}
              </div>
              <div className="flex items-center text-gray-600 text-sm bg-gray-100 px-2 py-0.5 rounded">
                <ClockIcon className="h-3.5 w-3.5 mr-1" />
                {junta.hora}
              </div>
            </div>
            
            {/* Paciente */}
            <div className="flex items-center text-gray-700 text-sm">
              <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <span className="font-medium">{junta.pacienteNombre}</span>
                <span className="text-gray-400 ml-2">DNI: {junta.pacienteDni}</span>
              </div>
            </div>

            {/* Lugar si existe */}
            {junta.lugar && (
              <div className="mt-1 text-xs text-gray-500">
                📍 {junta.lugar}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProximasJuntas;
