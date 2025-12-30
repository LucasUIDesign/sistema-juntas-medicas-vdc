import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const Reportes = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-subtitle font-semibold text-vdc-primary">
          Reportes
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Generación de reportes y estadísticas del sistema
        </p>
      </div>

      {/* Placeholder Card */}
      <div className="bg-white rounded-card shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-vdc-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="w-8 h-8 text-vdc-primary" aria-hidden="true" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Módulo de Reportes
        </h3>
        <p className="text-vdc-secondary mb-6 max-w-md mx-auto">
          Esta funcionalidad estará disponible próximamente. Podrás generar reportes 
          personalizados en PDF y Excel con estadísticas detalladas.
        </p>

        {/* Preview Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-vdc-bg rounded-card">
            <DocumentArrowDownIcon className="w-6 h-6 text-vdc-primary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">Exportar PDF</p>
            <p className="text-xs text-vdc-secondary">Actas y reportes formales</p>
          </div>
          <div className="p-4 bg-vdc-bg rounded-card">
            <ChartBarIcon className="w-6 h-6 text-vdc-success mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">Estadísticas</p>
            <p className="text-xs text-vdc-secondary">Gráficos y métricas</p>
          </div>
          <div className="p-4 bg-vdc-bg rounded-card">
            <CalendarIcon className="w-6 h-6 text-vdc-secondary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-gray-900">Por Período</p>
            <p className="text-xs text-vdc-secondary">Filtros personalizados</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 px-6 py-2 bg-vdc-primary/10 text-vdc-primary rounded-card cursor-not-allowed"
          disabled
        >
          Próximamente
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Reportes;
