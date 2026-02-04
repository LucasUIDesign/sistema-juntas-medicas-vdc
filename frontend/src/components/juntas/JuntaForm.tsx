import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { juntasService } from '../../services/juntasService';
import { DocumentoParaSubir } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import DictamenMedicoWizard, { DictamenMedicoData, isDictamenCompleto } from './DictamenMedicoWizard';
import DocumentosManager from './DocumentosManager';
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  PaperClipIcon,
  ChevronDownIcon,
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
        ${dictamen.medicosEvaluadores && dictamen.medicosEvaluadores.length > 0 ? dictamen.medicosEvaluadores.map((medico: any) => `
        <div class="firma-box">
          <p>${medico.nombre || 'Médico Evaluador'}</p>
          <p style="font-size: 12px;">${medico.matricula || ''} - ${medico.especialidad || ''}</p>
        </div>
        `).join('') : `
        <div class="firma-box">
          <p>Médico Evaluador</p>
          <p style="font-size: 12px;">-</p>
        </div>
        `}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dictamenData, setDictamenData] = useState<DictamenMedicoData | null>(null);
  const [currentJuntaId, setCurrentJuntaId] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoParaSubir[]>([]);
  const [showDocumentos, setShowDocumentos] = useState(false);

  // Save dictamen data from wizard
  const handleDictamenChange = (data: DictamenMedicoData) => {
    setDictamenData(data);
  };

  // Finalize and save junta
  const handleFinalize = async () => {
    if (!dictamenData) {
      toast.error('Complete el dictamen primero');
      return;
    }

    if (!dictamenData.nombreCompleto || !dictamenData.dni) {
      toast.error('Complete los datos de identificación del paciente (nombre y DNI)');
      return;
    }

    if (!isDictamenCompleto(dictamenData)) {
      toast.warning('El dictamen tiene campos requeridos vacíos, se guardará igualmente');
    }

    setIsSubmitting(true);
    try {
      console.log('=== INICIANDO PROCESO DE FINALIZACIÓN ===');
      console.log('Datos del dictamen:', dictamenData);
      
      // Buscar paciente existente por DNI
      console.log('Buscando paciente por DNI:', dictamenData.dni);
      const pacientes = await juntasService.searchPacientes(dictamenData.dni);
      console.log('Pacientes encontrados:', pacientes);
      
      if (!pacientes || pacientes.length === 0) {
        toast.error('El paciente no existe en el sistema. Por favor, solicite al administrador que cree el paciente primero.');
        setIsSubmitting(false);
        return;
      }
      
      const paciente = pacientes[0];
      console.log('Usando paciente existente:', paciente);

      // Create junta
      console.log('Creando junta para paciente:', paciente.id);
      const junta = await juntasService.createJunta({
        pacienteId: paciente.id,
        observaciones: '',
      });
      console.log('Junta creada exitosamente:', junta);

      setCurrentJuntaId(junta.id);

      // Save dictamen and finalize
      console.log('Guardando dictamen y finalizando junta...');
      await juntasService.saveDictamen(junta.id, {
        dictamen: dictamenData,
        finalizar: true,
      });
      console.log('Dictamen guardado y junta finalizada');

      // Upload documents if any
      if (documentos.length > 0) {
        console.log(`Subiendo ${documentos.length} documento(s)...`);
        let uploadedCount = 0;
        let failedCount = 0;

        for (const doc of documentos) {
          try {
            await juntasService.uploadDocumento(junta.id, doc.file, doc.categoria);
            uploadedCount++;
            console.log(`✅ Documento subido: ${doc.file.name}`);
          } catch (error) {
            failedCount++;
            console.error(`❌ Error subiendo ${doc.file.name}:`, error);
          }
        }

        if (uploadedCount > 0) {
          toast.success(`${uploadedCount} documento(s) subido(s) exitosamente`);
        }
        if (failedCount > 0) {
          toast.warning(`${failedCount} documento(s) no se pudieron subir`);
        }
      }

      toast.success('¡Junta médica creada y finalizada correctamente!');

      // Reset form
      setDictamenData(null);
      setCurrentJuntaId(null);
      setDocumentos([]);

      if (onJuntaCreated) {
        onJuntaCreated();
      }
    } catch (error: any) {
      console.error('=== ERROR AL FINALIZAR JUNTA ===');
      console.error('Error completo:', error);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('Response:', error.response);
      toast.error(error.message || 'Error al finalizar la junta. Revise la consola del navegador para más detalles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!dictamenData) {
      toast.error('Complete el dictamen primero');
      return;
    }
    generatePDF(dictamenData, currentJuntaId || 'borrador');
  };

  const handleCancel = () => {
    setDictamenData(null);
    setCurrentJuntaId(null);
    setDocumentos([]);
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
          Cargar Nueva Junta Médica
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Complete el cuestionario del dictamen médico para registrar la junta
        </p>
      </div>

      {/* Dictamen Form */}
      <div className="bg-white rounded-card shadow-card p-card">
        <div className="space-y-6">
          {/* Dictamen Medico Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-vdc-primary flex items-center">
                Dictamen Médico
                {dictamenData && (
                  <span className={`ml-2 px-2 py-0.5 text-xs text-white rounded-full ${isDictamenCompleto(dictamenData) ? 'bg-vdc-success' : 'bg-yellow-500'
                    }`}>
                    {isDictamenCompleto(dictamenData) ? 'Completo' : 'Incompleto'}
                  </span>
                )}
              </h3>
              {dictamenData && (
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700"
                  title="Limpiar formulario"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <DictamenMedicoWizard
              onComplete={(data, _isCompleto) => {
                handleDictamenChange(data);
              }}
              onCancel={() => { }}
              initialData={dictamenData || undefined}
              hideProfesionales={false}
            />
          </div>

          {/* Documentos Adjuntos Section */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowDocumentos(!showDocumentos)}
              className="flex items-center justify-between w-full text-vdc-primary hover:text-vdc-primary/80"
            >
              <span className="flex items-center">
                <PaperClipIcon className="h-5 w-5 mr-2" />
                Documentos Adjuntos
                {documentos.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-vdc-primary text-white rounded-full">
                    {documentos.length}
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
                  onChange={setDocumentos}
                />
              </div>
            )}
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
              className={`px-6 py-2 rounded-card text-white font-medium transition-colors flex items-center ${isSubmitting || !dictamenData
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
    </motion.div>
  );
};

export default JuntaForm;
