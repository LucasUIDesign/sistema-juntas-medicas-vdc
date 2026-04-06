import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface ConstanciaData {
  provincia: string;
  fecha: string;
  empleado: string;
  reparticion: string;
  dni: string;
  resultado: string; // APTO, NO APTO, etc.
}

export async function generateConstanciaPDF(data: ConstanciaData): Promise<PassThrough> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 100, bottom: 100, left: 72, right: 72 },
      });

      const stream = new PassThrough();
      doc.pipe(stream);

      // Logo y encabezado
      doc.fontSize(10)
         .text('VDC', 72, 80)
         .text('INTERNACIONAL SRL', 72, 95);

      // Título principal
      doc.moveDown(2);
      doc.fontSize(14)
         .text('ACTA DE REALIZACION DE JUNTA MEDICA', { align: 'center' });

      doc.moveDown(2);

      // Provincia y fecha
      doc.fontSize(10);
      doc.text(`Provincia de ${data.provincia}, ${data.fecha}`, { align: 'left' });

      doc.moveDown(3);

      // Empleado
      doc.text(`Empleado: ${data.empleado}`);

      doc.moveDown(1.5);

      // Repartición
      doc.text(`Reparticion: ${data.reparticion}`);

      doc.moveDown(2);

      // DNI
      doc.text(`DNI N° ${data.dni}`);

      doc.moveDown(4);

      // Texto legal
      const textoLegal = `Por la presente se deja constancia que en conformidad a lo establecido en las leyes y reglamentaciones, Ley de Contrato de Trabajo 20.477, (Decreto 1338/96- Res-559/09 de la SRT), se ha efectuado la correspondiente constatacion del estado de salud del empleado de referencia, mediante evaluacion medica. El dictamen con el resultado de la misma, sera presentado a quien lo requiera.`;

      doc.fontSize(10)
         .text(textoLegal, {
           align: 'justify',
           lineGap: 5
         });

      doc.moveDown(3);

      // Resultado del dictamen
      doc.fontSize(12)
         .text(`RESULTADO: ${data.resultado}`, { align: 'center' });

      doc.moveDown(4);

      // Firma
      doc.fontSize(10)
         .text('________________________________________', { align: 'center' });
      doc.moveDown(0.5);
      doc.text('Firma y Sello', { align: 'center' });
      doc.text('Director Medico', { align: 'center' });

      // Footer
      doc.fontSize(8)
         .text(
           `Documento generado el ${new Date().toLocaleDateString('es-AR')}`,
           72,
           doc.page.height - 50,
           { align: 'center' }
         );

      doc.end();
      resolve(stream);
    } catch (error) {
      reject(error);
    }
  });
}
