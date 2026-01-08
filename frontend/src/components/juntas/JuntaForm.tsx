import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { DocumentoParaSubir } from '../../types';
import { CreateJuntaConDictamenDTO } from '../../services/juntasService';
import LoadingSpinner from '../ui/LoadingSpinner';
import DocumentosManager from './DocumentosManager';
import DictamenMedicoWizard, { DictamenMedicoData, isDictamenCompleto } from './DictamenMedicoWizard';
import {
  CheckCircleIcon,
  PaperClipIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

const JuntaForm = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [dictamenData, setDictamenData] = useState<DictamenMedicoData | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoParaSubir[]>([]);

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const data: CreateJuntaConDictamenDTO = {
        fecha: new Date().toISOString(),
        pacienteId: 'default',
        detalles: 'Dictamen médico registrado',
        aprobacion: false,
        documentos: documentos,
        dictamen: dictamenData || undefined,
      };

      await juntasService.createJunta(data, user.id, user.nombre);
      
      toast.success('¡Junta médica guardada exitosamente!', { icon: '✅' });
      
      // Reset form
      setDocumentos([]);
      setDictamenData(null);
      setShowDocumentos(false);
    } catch (error) {
      toast.error('Error al guardar la junta médica. Intenta nuevamente.', { icon: '❌' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDocumentos([]);
    setDictamenData(null);
    setShowDocumentos(false);
    toast.info('Formulario limpiado', { icon: 'ℹ️' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-subtitle font-semibold text-vdc-primary">
          Cargar Nueva Junta Médica
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Complete el dictamen médico para registrar una nueva evaluación médica ocupacional
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-card shadow-card p-card">
        <div className="space-y-6">
          {/* Dictamen Médico Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-vdc-primary flex items-center">
                Dictamen Médico - Junta Médica Laboral
                {dictamenData && (
                  <span className={`ml-2 px-2 py-0.5 text-xs text-white rounded-full ${
                    isDictamenCompleto(dictamenData) ? 'bg-vdc-success' : 'bg-yellow-500'
                  }`}>
                    {isDictamenCompleto(dictamenData) ? 'Completo' : 'Incompleto'}
                  </span>
                )}
              </h3>
            </div>

            <DictamenMedicoWizard
              onComplete={(data, isCompleto) => {
                setDictamenData(data);
                if (isCompleto) {
                  toast.success('Dictamen médico completo guardado', { icon: '✅' });
                } else {
                  toast.info('Dictamen médico guardado (incompleto)', { icon: 'ℹ️' });
                }
              }}
              onCancel={() => {}}
              initialData={dictamenData || undefined}
              hideProfesionales={true}
            />
          </div>

          {/* Documentos Section */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowDocumentos(!showDocumentos)}
              className="flex items-center text-vdc-primary hover:text-vdc-primary/80 transition-colors w-full justify-between"
              aria-expanded={showDocumentos}
            >
              <span className="flex items-center">
                <PaperClipIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Adjuntar Documentos
                {documentos.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-vdc-primary text-white rounded-full">
                    {documentos.length}
                  </span>
                )}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform ${showDocumentos ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            <motion.div
              initial={false}
              animate={{ height: showDocumentos ? 'auto' : 0, opacity: showDocumentos ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <DocumentosManager documentos={documentos} onChange={setDocumentos} />
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <motion.button
              type="button"
              onClick={handleCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 border border-vdc-secondary text-vdc-secondary rounded-card hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`px-6 py-2 rounded-card text-white font-medium transition-colors flex items-center ${
                isSubmitting ? 'bg-vdc-success/70 cursor-not-allowed' : 'bg-vdc-success hover:bg-vdc-success/90'
              }`}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  Guardar
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JuntaForm;
