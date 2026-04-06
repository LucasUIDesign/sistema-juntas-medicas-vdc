interface ConstanciaData {
  provincia: string;
  fecha: string;
  empleado: string;
  reparticion: string;
  dni: string;
  resultado: string;
}

export function generateConstanciaHTML(data: ConstanciaData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Constancia de Junta Médica</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: left;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      margin: 40px 0 30px 0;
      text-transform: uppercase;
    }
    .field {
      margin: 20px 0;
      font-size: 14px;
    }
    .field-label {
      display: inline-block;
      min-width: 120px;
    }
    .field-value {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 300px;
      padding: 0 10px;
    }
    .legal-text {
      text-align: justify;
      margin: 40px 0;
      font-size: 13px;
      line-height: 1.8;
    }
    .result {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 40px 0;
      padding: 15px;
      border: 2px solid #333;
    }
    .signature {
      text-align: center;
      margin-top: 80px;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 300px;
      margin: 0 auto 10px auto;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #666;
      margin-top: 60px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">VDC</div>
    <div class="logo">INTERNACIONAL SRL</div>
  </div>

  <div class="title">
    Acta de Realización de Junta Médica
  </div>

  <div class="field">
    Provincia de ${data.provincia}, ${data.fecha}
  </div>

  <div class="field">
    <span class="field-label">Empleado:</span>
    <span class="field-value">${data.empleado}</span>
  </div>

  <div class="field">
    <span class="field-label">Repartición:</span>
    <span class="field-value">${data.reparticion}</span>
  </div>

  <div class="field">
    <span class="field-label">DNI Nº</span>
    <span class="field-value">${data.dni}</span>
  </div>

  <div class="legal-text">
    Por la presente se deja constancia que en conformidad a lo establecido en las leyes y 
    reglamentaciones, Ley de Contrato de Trabajo 20.477, (Decreto 1338/96- Res-559/09 de la 
    SRT), se ha efectuado la correspondiente constatación del estado de salud del empleado de 
    referencia, mediante evaluación médica. El dictamen con el resultado de la misma, será 
    presentado a quien lo requiera.
  </div>

  <div class="result">
    RESULTADO: ${data.resultado}
  </div>

  <div class="signature">
    <div class="signature-line"></div>
    <div>Firma y Sello</div>
    <div>Director Médico</div>
  </div>

  <div class="footer">
    Documento generado el ${new Date().toLocaleDateString('es-AR')}
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

