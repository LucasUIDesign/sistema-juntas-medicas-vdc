interface ConstanciaData {
  provincia: string;
  fecha: string;
  empleado: string;
  reparticion: string;
  dni: string;
  resultado: string;
  // Nuevos campos
  domicilio: string;
  fechaNacimiento: string;
  hora: string;
  medicosEvaluadores: { nombre: string; matricula: string; especialidad: string }[];
  lugarAtencion: string;
  motivoConsulta: string;
  medicoTratante: string;
  medicoTratanteMatricula: string;
  justifica: string;
  justificaDesde: string;
  justificaHasta: string;
  tipoConsulta: string;
  fundamentacion: string;
}

export function generateConstanciaHTML(data: ConstanciaData): string {
  // Helper to clean specialty names
  const cleanEspecialidad = (esp: string): string => {
    if (!esp) return '';
    const upper = esp.toUpperCase().trim();
    // If contains "psiquiatra", just show MEDICO PSIQUIATRA
    if (upper.includes('PSIQUIATRA')) return 'MEDICO PSIQUIATRA';
    // If already starts with MEDICO, return as-is uppercase
    if (upper.startsWith('MEDICO')) return upper;
    return 'MEDICO ' + upper;
  };

  // Build médicos list
  const medicosListHTML = data.medicosEvaluadores && data.medicosEvaluadores.length > 0
    ? data.medicosEvaluadores.map(m => {
        const esp = cleanEspecialidad(m.especialidad);
        return `<div>${(m.nombre || '').toUpperCase()}${esp ? ' - ' + esp : ''}</div>`;
      }).join('')
    : '<div>&nbsp;</div>';

  // Build signature blocks for up to 2 médicos
  const med1 = data.medicosEvaluadores?.[0];
  const med2 = data.medicosEvaluadores?.[1];

  const firma1Name = med1?.nombre || '';
  const firma1MP = med1?.matricula ? `MP Nº ${med1.matricula}` : '';
  const firma1Esp = med1?.especialidad || 'MEDICO LABORAL';

  const firma2Name = med2?.nombre || '';
  const firma2MP = med2?.matricula ? `MP ${med2.matricula}` : '';
  const firma2Esp = 'MEDICO PSIQUIATRA';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Junta Médica Laboral - Dictamen Médico</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm 2cm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
      max-width: 750px;
      margin: 0 auto;
      padding: 15px 20px;
    }
    .title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 20px 0;
      text-transform: uppercase;
      text-decoration: underline;
    }
    .field-row {
      margin: 6px 0;
      font-size: 12px;
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
    }
    .field-row-inline {
      margin: 6px 0;
      font-size: 12px;
    }
    .field-label {
      font-weight: bold;
      margin-right: 4px;
      white-space: nowrap;
    }
    .field-value {
      border-bottom: 1px solid #000;
      min-width: 150px;
      display: inline-block;
      padding: 0 5px;
      min-height: 16px;
    }
    .field-value-wide {
      border-bottom: 1px solid #000;
      flex: 1;
      display: inline-block;
      padding: 0 5px;
      min-height: 16px;
    }
    .field-value-dots {
      border-bottom: 1px dotted #000;
      flex: 1;
      display: inline-block;
      padding: 0 5px;
      min-height: 16px;
    }
    .profesionales-box {
      border: 1px solid #000;
      padding: 8px 12px;
      margin: 12px 0;
    }
    .profesionales-box .box-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .profesionales-box .box-title {
      font-weight: bold;
      font-size: 12px;
    }
    .section-label {
      font-weight: bold;
      margin: 14px 0 4px 0;
      font-size: 12px;
    }
    .dotted-line {
      border-bottom: 1px dotted #000;
      width: 100%;
      height: 20px;
      margin: 2px 0;
    }
    .blank-line {
      border-bottom: 1px solid #000;
      width: 100%;
      height: 22px;
      margin: 2px 0;
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
      flex-wrap: wrap;
    }
    .checkbox {
      width: 14px;
      height: 14px;
      border: 1px solid #000;
      display: inline-block;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }
    .checkbox.checked::after {
      content: '✓';
      position: absolute;
      top: -3px;
      left: 1px;
      font-size: 13px;
      font-weight: bold;
    }
    .legal-text {
      text-align: justify;
      margin: 20px 0;
      font-size: 11px;
      line-height: 1.7;
      border-top: 1px solid #ccc;
      padding-top: 12px;
    }
    .signatures-container {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding: 0 20px;
    }
    .signature {
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      margin: 0 auto 5px auto;
    }
    .signature-name {
      font-size: 11px;
      font-weight: bold;
    }
    .signature-mp {
      font-size: 11px;
    }
    .signature-title {
      font-size: 10px;
    }
    .three-col {
      display: flex;
      gap: 10px;
    }
    .three-col > div {
      flex: 1;
    }
    .two-col {
      display: flex;
      gap: 10px;
    }
    .two-col > div:first-child {
      flex: 2;
    }
    .two-col > div:last-child {
      flex: 1;
    }
    @media print {
      body {
        padding: 0;
        margin: 0 auto;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>

  <div class="title">
    JUNTA MÉDICA LABORAL – DICTAMEN MÉDICO
  </div>

  <!-- Paciente / DNI / Fecha Nac -->
  <div class="three-col">
    <div class="field-row">
      <span class="field-label">Paciente:</span>
      <span class="field-value-wide">${data.empleado}</span>
    </div>
    <div class="field-row" style="flex: 0 0 auto;">
      <span class="field-label">DNI:</span>
      <span class="field-value" style="min-width: 100px;">${data.dni}</span>
    </div>
    <div class="field-row" style="flex: 0 0 auto;">
      <span class="field-label">Fecha Nac.:</span>
      <span class="field-value" style="min-width: 90px;">${data.fechaNacimiento}</span>
    </div>
  </div>

  <!-- Domicilio -->
  <div class="field-row">
    <span class="field-label">Domicilio:</span>
    <span class="field-value-wide">${data.domicilio}</span>
  </div>

  <!-- Reparticiones -->
  <div class="field-row">
    <span class="field-label">Reparticiones:</span>
    <span class="field-value-wide">${data.reparticion}</span>
  </div>

  <!-- Profesionales Intervinientes box -->
  <div class="profesionales-box">
    <div class="box-header">
      <div>
        <div class="box-title">Profesionales Intervinientes</div>
        <div style="font-size: 11px;">Médicos:</div>
        ${medicosListHTML}
      </div>
      <div style="text-align: right;">
        <div><span class="field-label">Fecha:</span> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 80px; padding: 0 3px;">${data.fecha}</span></div>
        <div style="margin-top: 4px;"><span class="field-label">Hora:</span> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 80px; padding: 0 3px;">${data.hora}</span></div>
      </div>
    </div>
  </div>

  <!-- Lugar de Atención / Tipo de Consulta -->
  <div class="field-row">
    <span class="field-label">Lugar de Atención:</span>
    <span class="field-value-wide">${data.lugarAtencion}</span>
  </div>
  <div class="field-row">
    <span class="field-label">Tipo de Consulta:</span>
    <span class="field-value-wide">${data.tipoConsulta || 'JUNTA MEDICA'}</span>
  </div>

  <!-- Motivo de Consulta -->
  <div class="section-label">Motivo de Consulta:</div>
  <div class="field-row">
    <span>${data.motivoConsulta}</span>
    <span class="field-value-dots">&nbsp;</span>
  </div>

  <!-- Médico Tratante -->
  <div class="section-label">Médico Tratante:</div>
  <div class="two-col">
    <div class="field-row">
      <span class="field-label" style="margin-left: 20px;">Apellido y Nombre: DR/A</span>
      <span class="field-value-wide">${data.medicoTratante}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Matrícula:</span>
      <span class="field-value-wide">${data.medicoTratanteMatricula}</span>
    </div>
  </div>

  <!-- Resolución -->
  <div class="section-label">Luego del examen clínico de auditoría, se resuelve:</div>
  <div class="checkbox-row">
    <span class="field-label" style="margin-left: 20px;">Justifica:</span>
    <span>SI</span>
    <span class="checkbox ${data.justifica === 'SI' ? 'checked' : ''}">&nbsp;</span>
    <span class="field-label" style="margin-left: 15px;">Desde</span>
    <span class="field-value" style="min-width: 90px;">${data.justificaDesde}</span>
    <span class="field-label" style="margin-left: 15px;">Hasta</span>
    <span class="field-value" style="min-width: 90px;">${data.justificaHasta}</span>
  </div>
  <div class="checkbox-row">
    <span style="margin-left: 85px;">NO</span>
    <span class="checkbox ${data.justifica === 'NO' ? 'checked' : ''}">&nbsp;</span>
  </div>

  <!-- Fundamentación -->
  <div class="section-label">Fundamentación:</div>
  <div style="font-size: 12px; line-height: 1.7; text-align: justify; margin-top: 4px; min-height: 110px; border-bottom: 1px solid #000; padding-bottom: 4px;">${data.fundamentacion || ''}</div>

  <!-- Texto legal -->
  <div class="legal-text">
    Por la presente se deja constancia que, en conformidad a lo establecido en las leyes y 
    reglamentaciones, Ley de Contrato de Trabajo 20.477, (Decreto 1338/96- Res-559/09 de la 
    SRT), se ha efectuado la correspondiente constatación del estado de salud del empleado de 
    referencia, mediante evaluación médica. El dictamen con el resultado de la misma, será 
    presentado a quien lo requiera.
  </div>

  <!-- Firmas -->
  <div class="signatures-container">
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">${firma1Name}</div>
      <div class="signature-mp">${firma1MP}</div>
      <div class="signature-title">${firma1Esp}</div>
    </div>
    <div class="signature">
      <div class="signature-line"></div>
      <div class="signature-name">${firma2Name}</div>
      <div class="signature-mp">${firma2MP}</div>
      <div class="signature-title">${firma2Esp}</div>
    </div>
  </div>

  <script class="no-print">
    // Auto-print cuando se carga la página
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `.trim();
}
