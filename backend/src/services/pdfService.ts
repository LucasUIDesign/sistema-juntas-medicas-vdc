import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface DictamenData {
  // Información del paciente
  nombrePaciente?: string;
  dni?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  domicilio?: string;
  telefono?: string;
  email?: string;
  obraSocial?: string;

  // Datos laborales
  establecimiento?: string;
  cargo?: string;
  antiguedad?: string;
  situacionRevista?: string;
  nivelEducativo?: string;
  cargaHoraria?: string;
  modalidad?: string;
  legajo?: string;

  // Motivo de la junta
  motivoJunta?: string | string[];
  fechaInicioLicencia?: string;
  diagnosticosPrevios?: string;

  // Antecedentes
  patologiasPrevias?: string;
  antecedentesQuirurgicos?: string;
  alergias?: string;
  antecedentesFamiliares?: string;
  habitos?: string;
  factoresRiesgo?: string;
  licenciasAnteriores?: string;
  accidentesLaborales?: string;

  // Enfermedad actual
  sintomasPrincipales?: string;
  evolucion?: string;
  tratamientosActuales?: string;
  interconsultas?: string;

  // Examen físico
  presionArterial?: string;
  frecuenciaCardiaca?: string;
  frecuenciaRespiratoria?: string;
  temperatura?: string;
  peso?: string;
  talla?: string;
  imc?: string;
  examenGeneral?: string;

  // Estudios
  laboratorio?: string;
  imagenes?: string;
  estudiosFuncionales?: string;

  // Diagnóstico
  diagnosticoPrincipal?: string;
  codigoCIE10?: string;
  naturalezaEnfermedad?: string;
  capacidadFuncional?: string;
  factoresLimitantes?: string;

  // Dictamen
  aptitudLaboral?: string;
  restricciones?: string;
  recomendaciones?: string;
  tiempoRecuperacion?: string;
  fechaDictamen?: string;

  // Profesionales
  medicosEvaluadores?: Array<{
    nombre?: string;
    matricula?: string;
    especialidad?: string;
  }>;
  medicoEvaluador1?: string;
  matricula1?: string;
  especialidad1?: string;
  medicoEvaluador2?: string;
  matricula2?: string;
  especialidad2?: string;
}

interface JuntaInfo {
  id: string;
  fecha: string;
  estado: string;
  numeroDocumento: string;
  medicoNombre: string;
}

export async function generateDictamenPDF(
  juntaInfo: JuntaInfo,
  dictamenData: DictamenData
): Promise<PassThrough> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const stream = new PassThrough();
      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('DICTAMEN MÉDICO', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text('VDC Internacional', { align: 'center' });
      doc.moveDown(1);

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Información de la junta
      doc.fontSize(10).font('Helvetica-Bold').text('Información de la Junta Médica', { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      doc.text(`ID de Junta: ${juntaInfo.id}`);
      doc.text(`Fecha: ${new Date(juntaInfo.fecha).toLocaleDateString('es-AR')}`);
      doc.text(`Estado: ${juntaInfo.estado}`);
      doc.text(`Médico Evaluador: ${juntaInfo.medicoNombre}`);
      doc.moveDown(1);

      // Datos del Paciente
      addSection(doc, 'DATOS DEL PACIENTE');
      if (dictamenData.nombrePaciente) doc.text(`Nombre: ${dictamenData.nombrePaciente}`);
      if (dictamenData.dni) doc.text(`DNI: ${dictamenData.dni}`);
      if (dictamenData.fechaNacimiento) doc.text(`Fecha de Nacimiento: ${dictamenData.fechaNacimiento}`);
      if (dictamenData.sexo) doc.text(`Sexo: ${dictamenData.sexo === 'M' ? 'Masculino' : dictamenData.sexo === 'F' ? 'Femenino' : dictamenData.sexo}`);
      if (dictamenData.estadoCivil) doc.text(`Estado Civil: ${dictamenData.estadoCivil}`);
      if (dictamenData.domicilio) doc.text(`Domicilio: ${dictamenData.domicilio}`);
      if (dictamenData.telefono) doc.text(`Teléfono: ${dictamenData.telefono}`);
      if (dictamenData.email) doc.text(`Email: ${dictamenData.email}`);
      if (dictamenData.obraSocial) doc.text(`Obra Social: ${dictamenData.obraSocial}`);
      doc.moveDown(1);

      // Datos Laborales
      if (hasLaboral(dictamenData)) {
        addSection(doc, 'DATOS LABORALES');
        if (dictamenData.establecimiento) doc.text(`Establecimiento: ${dictamenData.establecimiento}`);
        if (dictamenData.cargo) doc.text(`Cargo: ${dictamenData.cargo}`);
        if (dictamenData.antiguedad) doc.text(`Antigüedad: ${dictamenData.antiguedad}`);
        if (dictamenData.situacionRevista) doc.text(`Situación de Revista: ${dictamenData.situacionRevista}`);
        if (dictamenData.nivelEducativo) doc.text(`Nivel Educativo: ${dictamenData.nivelEducativo}`);
        if (dictamenData.cargaHoraria) doc.text(`Carga Horaria: ${dictamenData.cargaHoraria}`);
        if (dictamenData.modalidad) doc.text(`Modalidad: ${dictamenData.modalidad}`);
        if (dictamenData.legajo) doc.text(`Legajo: ${dictamenData.legajo}`);
        doc.moveDown(1);
      }

      // Motivo de la Junta
      if (dictamenData.motivoJunta) {
        addSection(doc, 'MOTIVO DE LA JUNTA');
        const motivos = Array.isArray(dictamenData.motivoJunta) 
          ? dictamenData.motivoJunta 
          : dictamenData.motivoJunta.split(',').map(m => m.trim());
        motivos.forEach(motivo => {
          if (motivo) doc.text(`• ${motivo}`);
        });
        if (dictamenData.fechaInicioLicencia) doc.text(`Fecha Inicio Licencia: ${dictamenData.fechaInicioLicencia}`);
        if (dictamenData.diagnosticosPrevios) doc.text(`Diagnósticos Previos: ${dictamenData.diagnosticosPrevios}`);
        doc.moveDown(1);
      }

      // Antecedentes
      if (hasAntecedentes(dictamenData)) {
        addSection(doc, 'ANTECEDENTES');
        if (dictamenData.patologiasPrevias) doc.text(`Patologías Previas: ${dictamenData.patologiasPrevias}`);
        if (dictamenData.antecedentesQuirurgicos) doc.text(`Antecedentes Quirúrgicos: ${dictamenData.antecedentesQuirurgicos}`);
        if (dictamenData.alergias) doc.text(`Alergias: ${dictamenData.alergias}`);
        if (dictamenData.antecedentesFamiliares) doc.text(`Antecedentes Familiares: ${dictamenData.antecedentesFamiliares}`);
        if (dictamenData.habitos) doc.text(`Hábitos: ${dictamenData.habitos}`);
        if (dictamenData.factoresRiesgo) doc.text(`Factores de Riesgo: ${dictamenData.factoresRiesgo}`);
        if (dictamenData.licenciasAnteriores) doc.text(`Licencias Anteriores: ${dictamenData.licenciasAnteriores}`);
        if (dictamenData.accidentesLaborales) doc.text(`Accidentes Laborales: ${dictamenData.accidentesLaborales}`);
        doc.moveDown(1);
      }

      // Enfermedad Actual
      if (hasEnfermedadActual(dictamenData)) {
        addSection(doc, 'ENFERMEDAD ACTUAL');
        if (dictamenData.sintomasPrincipales) {
          doc.font('Helvetica-Bold').text('Síntomas Principales:');
          doc.font('Helvetica').text(dictamenData.sintomasPrincipales, { indent: 20 });
        }
        if (dictamenData.evolucion) doc.text(`Evolución: ${dictamenData.evolucion}`);
        if (dictamenData.tratamientosActuales) doc.text(`Tratamientos Actuales: ${dictamenData.tratamientosActuales}`);
        if (dictamenData.interconsultas) doc.text(`Interconsultas: ${dictamenData.interconsultas}`);
        doc.moveDown(1);
      }

      // Examen Físico
      if (hasExamenFisico(dictamenData)) {
        addSection(doc, 'EXAMEN FÍSICO');
        doc.font('Helvetica-Bold').text('Signos Vitales:');
        doc.font('Helvetica');
        if (dictamenData.presionArterial) doc.text(`  PA: ${dictamenData.presionArterial}`);
        if (dictamenData.frecuenciaCardiaca) doc.text(`  FC: ${dictamenData.frecuenciaCardiaca}`);
        if (dictamenData.frecuenciaRespiratoria) doc.text(`  FR: ${dictamenData.frecuenciaRespiratoria}`);
        if (dictamenData.temperatura) doc.text(`  Temperatura: ${dictamenData.temperatura}`);
        if (dictamenData.peso) doc.text(`  Peso: ${dictamenData.peso}`);
        if (dictamenData.talla) doc.text(`  Talla: ${dictamenData.talla}`);
        if (dictamenData.imc) doc.text(`  IMC: ${dictamenData.imc}`);
        if (dictamenData.examenGeneral) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text('Examen General:');
          doc.font('Helvetica').text(dictamenData.examenGeneral, { indent: 20 });
        }
        doc.moveDown(1);
      }

      // Estudios Complementarios
      if (hasEstudios(dictamenData)) {
        addSection(doc, 'ESTUDIOS COMPLEMENTARIOS');
        if (dictamenData.laboratorio) doc.text(`Laboratorio: ${dictamenData.laboratorio}`);
        if (dictamenData.imagenes) doc.text(`Imágenes: ${dictamenData.imagenes}`);
        if (dictamenData.estudiosFuncionales) doc.text(`Estudios Funcionales: ${dictamenData.estudiosFuncionales}`);
        doc.moveDown(1);
      }

      // Diagnóstico
      addSection(doc, 'DIAGNÓSTICO');
      if (dictamenData.diagnosticoPrincipal) {
        doc.font('Helvetica-Bold').fontSize(12).text(dictamenData.diagnosticoPrincipal);
        doc.font('Helvetica').fontSize(10);
      }
      if (dictamenData.codigoCIE10) doc.text(`Código CIE-10: ${dictamenData.codigoCIE10}`);
      if (dictamenData.naturalezaEnfermedad) doc.text(`Naturaleza de la Enfermedad: ${dictamenData.naturalezaEnfermedad}`);
      if (dictamenData.capacidadFuncional) doc.text(`Capacidad Funcional: ${dictamenData.capacidadFuncional}`);
      if (dictamenData.factoresLimitantes) doc.text(`Factores Limitantes: ${dictamenData.factoresLimitantes}`);
      doc.moveDown(1);

      // Dictamen Final
      addSection(doc, 'DICTAMEN FINAL');
      if (dictamenData.aptitudLaboral) {
        const aptitudText = getAptitudText(dictamenData.aptitudLaboral);
        doc.font('Helvetica-Bold').fontSize(14).text(aptitudText, { align: 'center' });
        doc.font('Helvetica').fontSize(10);
        doc.moveDown(0.5);
      }
      if (dictamenData.restricciones) doc.text(`Restricciones: ${dictamenData.restricciones}`);
      if (dictamenData.recomendaciones) doc.text(`Recomendaciones: ${dictamenData.recomendaciones}`);
      if (dictamenData.tiempoRecuperacion) doc.text(`Tiempo Estimado de Recuperación: ${dictamenData.tiempoRecuperacion}`);
      if (dictamenData.fechaDictamen) doc.text(`Fecha del Dictamen: ${new Date(dictamenData.fechaDictamen).toLocaleDateString('es-AR')}`);
      doc.moveDown(1);

      // Profesionales
      if (hasProfesionales(dictamenData)) {
        addSection(doc, 'PROFESIONALES EVALUADORES');
        
        // Intentar formato nuevo (array)
        if (dictamenData.medicosEvaluadores && dictamenData.medicosEvaluadores.length > 0) {
          dictamenData.medicosEvaluadores.forEach((medico, index) => {
            if (medico.nombre || medico.matricula || medico.especialidad) {
              doc.font('Helvetica-Bold').text(`Médico Evaluador ${index + 1}:`);
              doc.font('Helvetica');
              if (medico.nombre) doc.text(`  Nombre: ${medico.nombre}`);
              if (medico.matricula) doc.text(`  Matrícula: ${medico.matricula}`);
              if (medico.especialidad) doc.text(`  Especialidad: ${medico.especialidad}`);
              doc.moveDown(0.5);
            }
          });
        } else {
          // Formato antiguo
          if (dictamenData.medicoEvaluador1) {
            doc.font('Helvetica-Bold').text('Médico Evaluador Principal:');
            doc.font('Helvetica');
            doc.text(`  Nombre: ${dictamenData.medicoEvaluador1}`);
            if (dictamenData.matricula1) doc.text(`  Matrícula: ${dictamenData.matricula1}`);
            if (dictamenData.especialidad1) doc.text(`  Especialidad: ${dictamenData.especialidad1}`);
            doc.moveDown(0.5);
          }
          if (dictamenData.medicoEvaluador2) {
            doc.font('Helvetica-Bold').text('Médico Evaluador Secundario:');
            doc.font('Helvetica');
            doc.text(`  Nombre: ${dictamenData.medicoEvaluador2}`);
            if (dictamenData.matricula2) doc.text(`  Matrícula: ${dictamenData.matricula2}`);
            if (dictamenData.especialidad2) doc.text(`  Especialidad: ${dictamenData.especialidad2}`);
          }
        }
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text(
        `Documento generado el ${new Date().toLocaleString('es-AR')}`,
        { align: 'center' }
      );

      doc.end();
      resolve(stream);
    } catch (error) {
      reject(error);
    }
  });
}

function addSection(doc: PDFKit.PDFDocument, title: string) {
  doc.font('Helvetica-Bold').fontSize(11).text(title, { underline: true });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(10);
}

function getAptitudText(aptitud: string): string {
  const map: Record<string, string> = {
    'APTO': 'APTO',
    'NO_APTO': 'NO APTO',
    'APTO_CON_RESTRICCIONES': 'APTO CON RESTRICCIONES',
    'NO_APTO_TEMPORARIO': 'NO APTO TEMPORARIO',
    'NO_APTO_DEFINITIVO': 'NO APTO DEFINITIVO',
  };
  return map[aptitud] || aptitud;
}

function hasLaboral(data: DictamenData): boolean {
  return !!(data.establecimiento || data.cargo || data.antiguedad || data.situacionRevista || 
    data.nivelEducativo || data.cargaHoraria || data.modalidad || data.legajo);
}

function hasAntecedentes(data: DictamenData): boolean {
  return !!(data.patologiasPrevias || data.antecedentesQuirurgicos || data.alergias || 
    data.antecedentesFamiliares || data.habitos || data.factoresRiesgo || 
    data.licenciasAnteriores || data.accidentesLaborales);
}

function hasEnfermedadActual(data: DictamenData): boolean {
  return !!(data.sintomasPrincipales || data.evolucion || data.tratamientosActuales || data.interconsultas);
}

function hasExamenFisico(data: DictamenData): boolean {
  return !!(data.presionArterial || data.frecuenciaCardiaca || data.frecuenciaRespiratoria || 
    data.temperatura || data.peso || data.talla || data.imc || data.examenGeneral);
}

function hasEstudios(data: DictamenData): boolean {
  return !!(data.laboratorio || data.imagenes || data.estudiosFuncionales);
}

function hasProfesionales(data: DictamenData): boolean {
  return !!(
    (data.medicosEvaluadores && data.medicosEvaluadores.length > 0) ||
    data.medicoEvaluador1 || data.medicoEvaluador2
  );
}
