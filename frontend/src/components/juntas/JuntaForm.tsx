import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { Paciente, DocumentoParaSubir } from '../../types';
import { CreateJuntaConDictamenDTO } from '../../services/juntasService';
import LoadingSpinner from '../ui/LoadingSpinner';
import DocumentosManager from './DocumentosManager';
import DictamenMedicoWizard, { DictamenMedicoData, isDictamenCompleto } from './DictamenMedicoWizard';
import {
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PaperClipIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

// Validation schema
const juntaSchema = Yup.object({
  fecha: Yup.date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura'),
  pacienteId: Yup.string()
    .required('El paciente es requerido'),
  detalles: Yup.string()
    .required('Los detalles son requeridos')
    .max(500, 'Máximo 500 caracteres'),
  aprobacion: Yup.boolean(),
});

interface JuntaFormValues {
  fecha: Date | null;
  pacienteId: string;
  detalles: string;
  aprobacion: boolean;
}

const JuntaForm = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [showDictamen, setShowDictamen] = useState(false);
  const [dictamenData, setDictamenData] = useState<DictamenMedicoData | null>(null);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoParaSubir[]>([]);

  const isMedicoSuperior = user?.role === 'MEDICO_SUPERIOR';

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async (search?: string) => {
    try {
      const data = await juntasService.getPacientes(search);
      setPacientes(data);
    } catch (error) {
      console.error('Error loading pacientes:', error);
    } finally {
      setIsLoadingPacientes(false);
    }
  };

  const initialValues: JuntaFormValues = {
    fecha: new Date(),
    pacienteId: '',
    detalles: '',
    aprobacion: false,
  };

  const handleSubmit = async (values: JuntaFormValues, { resetForm }: { resetForm: () => void }) => {
    if (!user || !values.fecha) return;

    setIsSubmitting(true);
    try {
      const data: CreateJuntaConDictamenDTO = {
        fecha: values.fecha.toISOString(),
        pacienteId: values.pacienteId,
        detalles: values.detalles,
        aprobacion: values.aprobacion,
        documentos: documentos,
        dictamen: dictamenData || undefined,
      };

      await juntasService.createJunta(data, user.id, user.nombre);
      
      toast.success('¡Junta médica guardada exitosamente!', {
        icon: '✅',
      });
      
      resetForm();
      setSearchPaciente('');
      setDocumentos([]);
      setDictamenData(null);
      setShowDocumentos(false);
      setShowDictamen(false);
    } catch (error) {
      toast.error('Error al guardar la junta médica. Intenta nuevamente.', {
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (resetForm: () => void) => {
    resetForm();
    setSearchPaciente('');
    setDocumentos([]);
    setShowDocumentos(false);
    toast.info('Formulario limpiado', { icon: 'ℹ️' });
  };

  const filteredPacientes = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(searchPaciente.toLowerCase()) ||
    p.documento.includes(searchPaciente)
  );

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
          Complete el formulario para registrar una nueva evaluación médica ocupacional
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-card shadow-card p-card">
        <Formik
          initialValues={initialValues}
          validationSchema={juntaSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, resetForm }) => (
            <Form className="space-y-6" noValidate>
              {/* Fecha Field */}
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="inline h-4 w-4 mr-1" aria-hidden="true" />
                  Fecha de la Junta
                </label>
                <DatePicker
                  id="fecha"
                  selected={values.fecha}
                  onChange={(date) => setFieldValue('fecha', date)}
                  maxDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecciona una fecha"
                  className={`w-full px-4 py-3 border rounded-card text-body transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                    errors.fecha && touched.fecha
                      ? 'border-vdc-error'
                      : 'border-gray-300 focus:border-vdc-primary'
                  }`}
                  aria-describedby={errors.fecha && touched.fecha ? 'fecha-error' : undefined}
                />
                <ErrorMessage name="fecha">
                  {(msg) => (
                    <p id="fecha-error" className="mt-1 text-sm text-vdc-error" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              {/* Paciente Field - Autocomplete */}
              <div className="relative">
                <label htmlFor="paciente-search" className="block text-sm font-medium text-gray-700 mb-1">
                  <UserIcon className="inline h-4 w-4 mr-1" aria-hidden="true" />
                  Paciente
                </label>
                <div className="relative">
                  <input
                    id="paciente-search"
                    type="text"
                    value={searchPaciente}
                    onChange={(e) => {
                      setSearchPaciente(e.target.value);
                      setShowPacienteDropdown(true);
                    }}
                    onFocus={() => setShowPacienteDropdown(true)}
                    placeholder="Buscar por nombre o documento..."
                    className={`w-full px-4 py-3 border rounded-card text-body transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 ${
                      errors.pacienteId && touched.pacienteId
                        ? 'border-vdc-error'
                        : 'border-gray-300 focus:border-vdc-primary'
                    }`}
                    aria-expanded={showPacienteDropdown}
                    aria-haspopup="listbox"
                    aria-describedby={errors.pacienteId && touched.pacienteId ? 'paciente-error' : undefined}
                  />
                  {isLoadingPacientes && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>

                {/* Dropdown */}
                {showPacienteDropdown && filteredPacientes.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-card shadow-card max-h-60 overflow-auto"
                    role="listbox"
                  >
                    {filteredPacientes.map((paciente) => (
                      <li
                        key={paciente.id}
                        onClick={() => {
                          setFieldValue('pacienteId', paciente.id);
                          setSearchPaciente(paciente.nombre);
                          setShowPacienteDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-vdc-bg cursor-pointer transition-colors"
                        role="option"
                        aria-selected={values.pacienteId === paciente.id}
                      >
                        <div className="font-medium text-gray-900">{paciente.nombre}</div>
                        <div className="text-sm text-vdc-secondary">
                          {paciente.documento} - {paciente.empresa}
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                )}

                {/* Click outside to close */}
                {showPacienteDropdown && (
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowPacienteDropdown(false)}
                  />
                )}

                <ErrorMessage name="pacienteId">
                  {(msg) => (
                    <p id="paciente-error" className="mt-1 text-sm text-vdc-error" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              {/* Detalles Field */}
              <div>
                <label htmlFor="detalles" className="block text-sm font-medium text-gray-700 mb-1">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" aria-hidden="true" />
                  Detalles de la Evaluación
                </label>
                <Field
                  as="textarea"
                  id="detalles"
                  name="detalles"
                  rows={5}
                  maxLength={500}
                  placeholder="Describa los hallazgos y recomendaciones de la evaluación médica..."
                  className={`w-full px-4 py-3 border rounded-card text-body transition-colors focus:outline-none focus:ring-2 focus:ring-vdc-primary/20 resize-none ${
                    errors.detalles && touched.detalles
                      ? 'border-vdc-error'
                      : 'border-gray-300 focus:border-vdc-primary'
                  }`}
                  aria-describedby="detalles-count detalles-error"
                />
                <div className="flex justify-between mt-1">
                  <ErrorMessage name="detalles">
                    {(msg) => (
                      <p id="detalles-error" className="text-sm text-vdc-error" role="alert">
                        {msg}
                      </p>
                    )}
                  </ErrorMessage>
                  <p id="detalles-count" className="text-sm text-vdc-secondary">
                    {values.detalles.length}/500 caracteres
                  </p>
                </div>
              </div>

              {/* Dictamen Médico Section */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDictamen(!showDictamen)}
                  className="flex items-center text-vdc-primary hover:text-vdc-primary/80 transition-colors w-full justify-between"
                  aria-expanded={showDictamen}
                >
                  <span className="flex items-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Dictamen Médico - Junta Médica Laboral
                    {dictamenData && (
                      <span className={`ml-2 px-2 py-0.5 text-xs text-white rounded-full ${
                        isDictamenCompleto(dictamenData) ? 'bg-vdc-success' : 'bg-yellow-500'
                      }`}>
                        {isDictamenCompleto(dictamenData) ? 'Completo' : 'Incompleto'}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 transition-transform ${showDictamen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <motion.div
                  initial={false}
                  animate={{ height: showDictamen ? 'auto' : 0, opacity: showDictamen ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <DictamenMedicoWizard
                      onComplete={(data, isCompleto) => {
                        setDictamenData(data);
                        setShowDictamen(false);
                        if (isCompleto) {
                          toast.success('Dictamen médico completo guardado', { icon: '✅' });
                        } else {
                          toast.info('Dictamen médico guardado (incompleto)', { icon: 'ℹ️' });
                        }
                      }}
                      onCancel={() => setShowDictamen(false)}
                      initialData={dictamenData || undefined}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Advanced Options - Only for Médico Superior */}
              {isMedicoSuperior && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center text-vdc-primary hover:text-vdc-primary/80 transition-colors"
                    aria-expanded={showAdvanced}
                  >
                    <ChevronDownIcon
                      className={`h-5 w-5 mr-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                    Opciones Avanzadas (Médico Superior)
                  </button>

                  <motion.div
                    initial={false}
                    animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      {/* Aprobación Checkbox */}
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="aprobacion"
                          name="aprobacion"
                          className="h-5 w-5 text-vdc-primary border-gray-300 rounded focus:ring-vdc-primary"
                        />
                        <label htmlFor="aprobacion" className="ml-3 text-sm text-gray-700">
                          <CheckCircleIcon className="inline h-4 w-4 mr-1 text-vdc-success" aria-hidden="true" />
                          Marcar como Aprobada
                        </label>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Documentos Section - Available for all users */}
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
                    <DocumentosManager
                      documentos={documentos}
                      onChange={setDocumentos}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <motion.button
                  type="button"
                  onClick={() => handleCancel(resetForm)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 border border-vdc-secondary text-vdc-secondary rounded-card hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={`px-6 py-2 rounded-card text-white font-medium transition-colors flex items-center ${
                    isSubmitting
                      ? 'bg-vdc-success/70 cursor-not-allowed'
                      : 'bg-vdc-success hover:bg-vdc-success/90'
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
            </Form>
          )}
        </Formik>
      </div>
    </motion.div>
  );
};

export default JuntaForm;
