import { useState } from 'react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { JuntaMedica, DocumentoParaSubir, UpdateJuntaDTO } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import DocumentosManager from './DocumentosManager';
import {
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PaperClipIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

const editJuntaSchema = Yup.object({
  fecha: Yup.date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),
  detalles: Yup.string()
    .required('Los detalles son requeridos')
    .max(500, 'Máximo 500 caracteres'),
  aprobacion: Yup.boolean(),
});

interface EditJuntaModalProps {
  junta: JuntaMedica;
  onClose: () => void;
  onSave: (junta: JuntaMedica) => void;
}

const EditJuntaModal = ({ junta, onClose, onSave }: EditJuntaModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoParaSubir[]>([]);
  const [adjuntosExistentes, setAdjuntosExistentes] = useState(junta.adjuntos || []);

  const isMedicoSuperior = user?.role === 'DIRECTOR_MEDICO';

  const initialValues = {
    fecha: new Date(junta.fecha),
    detalles: junta.detalles,
    aprobacion: junta.aprobacion || false,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateJuntaDTO = {
        fecha: values.fecha.toISOString(),
        detalles: values.detalles,
        aprobacion: values.aprobacion,
      };

      const updatedJunta = await juntasService.updateJunta(junta.id, updateData);
      
      // Simular subida de documentos nuevos
      if (documentos.length > 0) {
        const nuevosAdjuntos = documentos.map((doc, idx) => ({
          id: `adj-${Date.now()}-${idx}`,
          nombre: doc.file.name,
          tipo: doc.file.type,
          url: URL.createObjectURL(doc.file),
          size: doc.file.size,
          categoria: doc.categoria,
          uploadedAt: new Date().toISOString(),
        }));
        updatedJunta.adjuntos = [...adjuntosExistentes, ...nuevosAdjuntos];
      }

      toast.success('¡Junta médica actualizada exitosamente!', { icon: '✅' });
      onSave(updatedJunta);
      onClose();
    } catch (error) {
      toast.error('Error al actualizar la junta médica.', { icon: '❌' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdjunto = (adjuntoId: string) => {
    setAdjuntosExistentes(prev => prev.filter(a => a.id !== adjuntoId));
    toast.info('Documento marcado para eliminar', { icon: 'ℹ️' });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Editar Junta Médica
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={editJuntaSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form className="p-6 space-y-6">
                {/* Info del paciente (solo lectura) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Paciente
                  </div>
                  <p className="font-medium text-gray-900">{junta.pacienteNombre}</p>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                    Fecha de la Junta
                  </label>
                  <DatePicker
                    selected={values.fecha}
                    onChange={(date) => setFieldValue('fecha', date)}
                    maxDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                      errors.fecha && touched.fecha
                        ? 'border-red-500'
                        : 'border-gray-300 focus:border-vdc-primary'
                    }`}
                  />
                  <ErrorMessage name="fecha">
                    {(msg) => <p className="mt-1 text-sm text-red-500">{msg}</p>}
                  </ErrorMessage>
                </div>

                {/* Detalles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                    Detalles de la Evaluación
                  </label>
                  <Field
                    as="textarea"
                    name="detalles"
                    rows={5}
                    maxLength={500}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 resize-none ${
                      errors.detalles && touched.detalles
                        ? 'border-red-500'
                        : 'border-gray-300 focus:border-vdc-primary'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    <ErrorMessage name="detalles">
                      {(msg) => <p className="text-sm text-red-500">{msg}</p>}
                    </ErrorMessage>
                    <p className="text-sm text-gray-500">
                      {values.detalles.length}/500
                    </p>
                  </div>
                </div>

                {/* Aprobación - Solo Médico Superior */}
                {isMedicoSuperior && (
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      id="aprobacion"
                      name="aprobacion"
                      className="h-5 w-5 text-vdc-primary border-gray-300 rounded focus:ring-vdc-primary"
                    />
                    <label htmlFor="aprobacion" className="ml-3 text-sm text-gray-700">
                      <CheckCircleIcon className="inline h-4 w-4 mr-1 text-green-500" />
                      Marcar como Aprobada
                    </label>
                  </div>
                )}

                {/* Documentos */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDocumentos(!showDocumentos)}
                    className="flex items-center justify-between w-full text-vdc-primary hover:text-vdc-primary/80"
                  >
                    <span className="flex items-center">
                      <PaperClipIcon className="h-5 w-5 mr-2" />
                      Documentos Adjuntos
                      {(documentos.length + adjuntosExistentes.length) > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-vdc-primary text-white rounded-full">
                          {documentos.length + adjuntosExistentes.length}
                        </span>
                      )}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 transition-transform ${showDocumentos ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDocumentos && (
                    <div className="mt-4">
                      <DocumentosManager
                        documentos={documentos}
                        adjuntosExistentes={adjuntosExistentes}
                        onChange={setDocumentos}
                        onDeleteExistente={handleDeleteAdjunto}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-lg text-white font-medium flex items-center ${
                      isSubmitting
                        ? 'bg-vdc-primary/70 cursor-not-allowed'
                        : 'bg-vdc-primary hover:bg-vdc-primary/90'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </>
  );
};

export default EditJuntaModal;
