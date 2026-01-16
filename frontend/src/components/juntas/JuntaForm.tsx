import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { juntasService } from '../../services/juntasService';
import { Paciente } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import DictamenMedicoWizard, { DictamenMedicoData, isDictamenCompleto } from './DictamenMedicoWizard';
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';

// PDF Generation utility
const generatePDF = async (dictamen: DictamenMedicoData, juntaId: string) => {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('No se pudo abrir la ventana de impresion');
    return;
  }

  const aptitudLabels: Record<string, string> = {
    'apto': 'APTO',
    'apto_con_restricciones': 'APTO CON RESTRICCIONES',
    'no_apto_temporario': 'NO APTO TEMPORARIO',
    'no_apto_definitivo': 'NO APTO DEFINITIVO',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dictamen Medico - ${dictamen.nombreCompleto}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }
        h2 { color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
        .section { margin-bottom: 20px; }
        .field { margin-bottom: 8px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .aptitud {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          padding: 15px;
          margin: 20px 0;
          border: 2px solid #1e3a5f;
          background: #f5f5f5;
        }
        .firma { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .firma-box { text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>DICTAMEN MEDICO - JUNTA MEDICA LABORAL</h1>
      <p style="text-align: center; color: #666;">ID: ${juntaId} | Fecha: ${dictamen.fechaDictamen || new Date().toLocaleDateString()}</p>

      <h2>1. DATOS DE IDENTIFICACION</h2>
      <div class="section grid">
        <div class="field"><span class="label">Nombre:</span><span class="value">${dictamen.nombreCompleto || '-'}</span></div>
        <div class="field"><span class="label">DNI:</span><span class="value">${dictamen.dni || '-'}</span></div>
        <div class="field"><span class="label">Fecha Nac.:</span><span class="value">${dictamen.fechaNacimiento || '-'}</span></div>
        <div class="field"><span class="label">Sexo:</span><span class="value">${dictamen.sexo || '-'}</span></div>
        <div class="field"><span class="label">Estado Civil:</span><span class="value">${dictamen.estadoCivil || '-'}</span></div>
        <div class="field"><span class="label">Telefono:</span><span class="value">${dictamen.telefono || '-'}</span></div>
      </div>
      <div class="field"><span class="label">Domicilio:</span><span class="value">${dictamen.domicilio || '-'}</span></div>
      <div class="field"><span class="label">Obra Social:</span><span class="value">${dictamen.obraSocial || '-'}</span></div>

      <h2>2. DATOS LABORALES</h2>
      <div class="section grid">
        <div class="field"><span class="label">Establecimiento:</span><span class="value">${dictamen.establecimiento || '-'}</span></div>
        <div class="field"><span class="label">Cargo:</span><span class="value">${dictamen.cargo || '-'}</span></div>
        <div class="field"><span class="label">Legajo:</span><span class="value">${dictamen.legajo || '-'}</span></div>
        <div class="field"><span class="label">Antiguedad:</span><span class="value">${dictamen.antiguedad || '-'}</span></div>
        <div class="field"><span class="label">Carga Horaria:</span><span class="value">${dictamen.cargaHoraria || '-'}</span></div>
        <div class="field"><span class="label">Situacion Revista:</span><span class="value">${dictamen.situacionRevista || '-'}</span></div>
      </div>

      <h2>3. MOTIVO DE LA JUNTA</h2>
      <div class="field"><span class="label">Motivos:</span><span class="value">${dictamen.motivoJunta?.join(', ') || '-'}</span></div>
      <div class="field"><span class="label">Inicio Licencia:</span><span class="value">${dictamen.fechaInicioLicencia || '-'}</span></div>
      <div class="field"><span class="label">Diagnosticos Previos:</span><span class="value">${dictamen.diagnosticosPrevios || '-'}</span></div>

      <h2>4. ANTECEDENTES MEDICOS</h2>
      <div class="field"><span class="label">Patologias Previas:</span><span class="value">${dictamen.patologiasPrevias || '-'}</span></div>
      <div class="field"><span class="label">Antecedentes Quirurgicos:</span><span class="value">${dictamen.antecedentesQuirurgicos || '-'}</span></div>
      <div class="field"><span class="label">Alergias:</span><span class="value">${dictamen.alergias || '-'}</span></div>
      <div class="field"><span class="label">Habitos:</span><span class="value">${dictamen.habitos || '-'}</span></div>

      <h2>5. ENFERMEDAD ACTUAL</h2>
      <div class="field"><span class="label">Sintomas Principales:</span><span class="value">${dictamen.sintomasPrincipales || '-'}</span></div>
      <div class="field"><span class="label">Evolucion:</span><span class="value">${dictamen.evolucion || '-'}</span></div>
      <div class="field"><span class="label">Tratamientos Actuales:</span><span class="value">${dictamen.tratamientosActuales || '-'}</span></div>

      <h2>6. EXAMEN FISICO</h2>
      <div class="section grid">
        <div class="field"><span class="label">PA:</span><span class="value">${dictamen.presionArterial || '-'}</span></div>
        <div class="field"><span class="label">FC:</span><span class="value">${dictamen.frecuenciaCardiaca || '-'}</span></div>
        <div class="field"><span class="label">FR:</span><span class="value">${dictamen.frecuenciaRespiratoria || '-'}</span></div>
        <div class="field"><span class="label">Temp:</span><span class="value">${dictamen.temperatura || '-'}</span></div>
        <div class="field"><span class="label">Peso:</span><span class="value">${dictamen.peso || '-'}</span></div>
        <div class="field"><span class="label">Talla:</span><span class="value">${dictamen.talla || '-'}</span></div>
        <div class="field"><span class="label">IMC:</span><span class="value">${dictamen.imc || '-'}</span></div>
      </div>
      <div class="field"><span class="label">Examen General:</span><span class="value">${dictamen.examenGeneral || '-'}</span></div>

      <h2>7. ESTUDIOS COMPLEMENTARIOS</h2>
      <div class="field"><span class="label">Laboratorio:</span><span class="value">${dictamen.laboratorio || '-'}</span></div>
      <div class="field"><span class="label">Imagenes:</span><span class="value">${dictamen.imagenes || '-'}</span></div>
      <div class="field"><span class="label">Estudios Funcionales:</span><span class="value">${dictamen.estudiosFuncionales || '-'}</span></div>

      <h2>8. DIAGNOSTICO</h2>
      <div class="field"><span class="label">Diagnostico Principal:</span><span class="value">${dictamen.diagnosticoPrincipal || '-'}</span></div>
      <div class="field"><span class="label">Codigo CIE-10:</span><span class="value">${dictamen.codigoCIE10 || '-'}</span></div>
      <div class="field"><span class="label">Naturaleza:</span><span class="value">${dictamen.naturalezaEnfermedad || '-'}</span></div>

      <h2>9. EVALUACION DE CAPACIDAD LABORAL</h2>
      <div class="field"><span class="label">Capacidad Funcional:</span><span class="value">${dictamen.capacidadFuncional || '-'}</span></div>
      <div class="field"><span class="label">Factores Limitantes:</span><span class="value">${dictamen.factoresLimitantes || '-'}</span></div>

      <h2>10. DICTAMEN Y RECOMENDACIONES</h2>
      <div class="aptitud">APTITUD LABORAL: ${aptitudLabels[dictamen.aptitudLaboral] || dictamen.aptitudLaboral || '-'}</div>
      <div class="field"><span class="label">Restricciones:</span><span class="value">${dictamen.restricciones || '-'}</span></div>
      <div class="field"><span class="label">Recomendaciones:</span><span class="value">${dictamen.recomendaciones || '-'}</span></div>
      <div class="field"><span class="label">Tiempo Recuperacion:</span><span class="value">${dictamen.tiempoRecuperacion || '-'}</span></div>

      <div class="firma">
        <div class="firma-box">
          <p>${dictamen.medicoEvaluador1 || 'Medico Evaluador'}</p>
          <p style="font-size: 12px;">${dictamen.matricula1 || ''} - ${dictamen.especialidad1 || ''}</p>
        </div>
        ${dictamen.medicoEvaluador2 ? `
        <div class="firma-box">
          <p>${dictamen.medicoEvaluador2}</p>
          <p style="font-size: 12px;">${dictamen.matricula2 || ''} - ${dictamen.especialidad2 || ''}</p>
        </div>
        ` : '<div></div>'}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

interface JuntaFormProps {
  onJuntaCreated?: () => void;
}

const JuntaForm = ({ onJuntaCreated }: JuntaFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [dictamenData, setDictamenData] = useState<DictamenMedicoData | null>(null);
  const [currentJuntaId, setCurrentJuntaId] = useState<string | null>(null);

  // Patient selection state
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [searchPaciente, setSearchPaciente] = useState('');
  const [showPacienteSearch, setShowPacienteSearch] = useState(false);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  // New patient form
  const [showNewPacienteForm, setShowNewPacienteForm] = useState(false);
  const [newPaciente, setNewPaciente] = useState({
    nombre: '',
    apellido: '',
    numeroDocumento: '',
    correo: '',
    telefono: '',
    domicilio: '',
  });

  // Load pacientes on search
  useEffect(() => {
    const loadPacientes = async () => {
      if (searchPaciente.length < 2) {
        setPacientes([]);
        return;
      }

      setLoadingPacientes(true);
      try {
        const results = await juntasService.getPacientes(searchPaciente);
        setPacientes(results);
      } catch (error) {
        console.error('Error loading pacientes:', error);
      } finally {
        setLoadingPacientes(false);
      }
    };

    const debounce = setTimeout(loadPacientes, 300);
    return () => clearTimeout(debounce);
  }, [searchPaciente]);

  // Handle patient selection and create junta
  const handleSelectPaciente = async (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowPacienteSearch(false);
    setSearchPaciente('');

    // Create junta in database
    try {
      const junta = await juntasService.createJunta({
        pacienteId: paciente.id,
        observaciones: '',
      });
      setCurrentJuntaId(junta.id);
      toast.success('Junta creada. Complete el dictamen medico.');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la junta');
      setSelectedPaciente(null);
    }
  };

  // Handle creating new patient
  const handleCreatePaciente = async () => {
    if (!newPaciente.nombre || !newPaciente.apellido || !newPaciente.numeroDocumento) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      const paciente = await juntasService.createPaciente(newPaciente);
      setShowNewPacienteForm(false);
      setNewPaciente({ nombre: '', apellido: '', numeroDocumento: '', correo: '', telefono: '', domicilio: '' });
      await handleSelectPaciente(paciente);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el paciente');
    }
  };

  // Save dictamen as draft
  const handleSaveDraft = async (data: DictamenMedicoData) => {
    if (!currentJuntaId) {
      toast.error('Seleccione un paciente primero');
      return;
    }

    setIsSavingDraft(true);
    try {
      await juntasService.saveDictamen(currentJuntaId, {
        dictamen: data,
        finalizar: false,
      });
      setDictamenData(data);
      toast.success('Borrador guardado');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Finalize and save junta
  const handleFinalize = async () => {
    if (!currentJuntaId || !dictamenData) {
      toast.error('Complete el dictamen primero');
      return;
    }

    if (!isDictamenCompleto(dictamenData)) {
      toast.warning('El dictamen tiene campos requeridos vacios');
    }

    setIsSubmitting(true);
    try {
      await juntasService.saveDictamen(currentJuntaId, {
        dictamen: dictamenData,
        finalizar: true,
      });

      toast.success('Junta medica finalizada correctamente!');

      // Reset form
      setDictamenData(null);
      setSelectedPaciente(null);
      setCurrentJuntaId(null);

      if (onJuntaCreated) {
        onJuntaCreated();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al finalizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!dictamenData || !currentJuntaId) {
      toast.error('Complete el dictamen primero');
      return;
    }
    generatePDF(dictamenData, currentJuntaId);
  };

  const handleCancel = () => {
    setDictamenData(null);
    setSelectedPaciente(null);
    setCurrentJuntaId(null);
    toast.info('Formulario limpiado');
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
          Cargar Nueva Junta Medica
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Seleccione un paciente y complete el dictamen medico
        </p>
      </div>

      {/* Patient Selection */}
      {!selectedPaciente && (
        <div className="bg-white rounded-card shadow-card p-card mb-6">
          <h3 className="text-lg font-medium text-vdc-primary mb-4">
            1. Seleccionar Paciente
          </h3>

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  value={searchPaciente}
                  onChange={(e) => {
                    setSearchPaciente(e.target.value);
                    setShowPacienteSearch(true);
                  }}
                  onFocus={() => setShowPacienteSearch(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary/20 focus:border-vdc-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewPacienteForm(true)}
                className="flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Nuevo Paciente
              </button>
            </div>

            {/* Search Results */}
            {showPacienteSearch && searchPaciente.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {loadingPacientes ? (
                  <div className="p-4 text-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <button
                      key={paciente.id}
                      type="button"
                      onClick={() => handleSelectPaciente(paciente)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <p className="font-medium">{paciente.nombre}</p>
                      <p className="text-sm text-gray-500">DNI: {paciente.documento}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron pacientes
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Patient Form Modal */}
          {showNewPacienteForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Nuevo Paciente</h4>
                  <button onClick={() => setShowNewPacienteForm(false)}>
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={newPaciente.nombre}
                        onChange={(e) => setNewPaciente({ ...newPaciente, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                      <input
                        type="text"
                        value={newPaciente.apellido}
                        onChange={(e) => setNewPaciente({ ...newPaciente, apellido: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI / Documento *</label>
                    <input
                      type="text"
                      value={newPaciente.numeroDocumento}
                      onChange={(e) => setNewPaciente({ ...newPaciente, numeroDocumento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                    <input
                      type="email"
                      value={newPaciente.correo}
                      onChange={(e) => setNewPaciente({ ...newPaciente, correo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="text"
                      value={newPaciente.telefono}
                      onChange={(e) => setNewPaciente({ ...newPaciente, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                    <input
                      type="text"
                      value={newPaciente.domicilio}
                      onChange={(e) => setNewPaciente({ ...newPaciente, domicilio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewPacienteForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreatePaciente}
                      className="px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90"
                    >
                      Crear Paciente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Patient Info */}
      {selectedPaciente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-600 font-medium">Paciente seleccionado</p>
              <p className="text-lg font-semibold text-blue-900">{selectedPaciente.nombre}</p>
              <p className="text-sm text-blue-700">DNI: {selectedPaciente.documento}</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Dictamen Form - Only show if patient selected */}
      {selectedPaciente && currentJuntaId && (
        <div className="bg-white rounded-card shadow-card p-card">
          <div className="space-y-6">
            {/* Dictamen Medico Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-vdc-primary flex items-center">
                  2. Dictamen Medico
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
                  handleSaveDraft(data);
                }}
                onCancel={() => {}}
                initialData={dictamenData || undefined}
                hideProfesionales={false}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
              <motion.button
                type="button"
                onClick={handleCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 border border-vdc-secondary text-vdc-secondary rounded-card hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </motion.button>

              {dictamenData && (
                <motion.button
                  type="button"
                  onClick={handleDownloadPDF}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 border border-vdc-primary text-vdc-primary rounded-card hover:bg-vdc-primary/10 transition-colors flex items-center"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Descargar PDF
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={handleFinalize}
                disabled={isSubmitting || !dictamenData}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className={`px-6 py-2 rounded-card text-white font-medium transition-colors flex items-center ${
                  isSubmitting || !dictamenData
                    ? 'bg-vdc-success/50 cursor-not-allowed'
                    : 'bg-vdc-success hover:bg-vdc-success/90'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Finalizar Junta
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default JuntaForm;
