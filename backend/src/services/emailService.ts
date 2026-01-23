import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface JuntaNotificationData {
  pacienteNombre: string;
  pacienteEmail: string;
  medicoNombre: string;
  medicoEmail: string;
  fecha: string;
  hora?: string;
  lugar: string;
}

// Configurar el transportador de email
const createTransporter = () => {
  // Para desarrollo, usar ethereal.email (emails de prueba)
  // Para producción, configurar con Gmail, SendGrid, etc.
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (!emailUser || !emailPass) {
    console.warn('⚠️  Credenciales de email no configuradas. Los emails no se enviarán.');
    return null;
  }

  return nodemailer.createTransporter({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true para 465, false para otros puertos
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('📧 Email simulado enviado a:', options.to);
      console.log('   Asunto:', options.subject);
      return true; // Simular éxito en desarrollo
    }

    await transporter.sendMail({
      from: `"VDC Internacional - Juntas Médicas" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('✅ Email enviado exitosamente a:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return false;
  }
};

export const emailService = {
  async sendJuntaNotificationToMedico(data: JuntaNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1e40af; border-radius: 4px; }
          .info-label { font-weight: bold; color: #1e40af; }
          .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nueva Junta Médica Asignada</h1>
          </div>
          <div class="content">
            <p>Estimado/a Dr./Dra. <strong>${data.medicoNombre}</strong>,</p>
            <p>Se le ha asignado una nueva junta médica. A continuación los detalles:</p>
            
            <div class="info-box">
              <p><span class="info-label">Paciente:</span> ${data.pacienteNombre}</p>
              <p><span class="info-label">Fecha:</span> ${data.fecha}</p>
              ${data.hora ? `<p><span class="info-label">Hora:</span> ${data.hora}</p>` : ''}
              <p><span class="info-label">Lugar:</span> ${data.lugar}</p>
            </div>

            <p>Por favor, asegúrese de estar disponible en la fecha y hora indicadas.</p>
            <p>Puede acceder al sistema para ver más detalles de la junta médica.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'https://sistema-juntas-medicas-vdc.vercel.app'}/dashboard/medico-evaluador" class="button">
                Ir al Sistema
              </a>
            </center>
          </div>
          <div class="footer">
            <p>VDC Internacional - Sistema de Gestión de Juntas Médicas</p>
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: data.medicoEmail,
      subject: `Nueva Junta Médica Asignada - ${data.fecha}`,
      html,
    });
  },

  async sendJuntaNotificationToPaciente(data: JuntaNotificationData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1e40af; border-radius: 4px; }
          .info-label { font-weight: bold; color: #1e40af; }
          .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .important { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cita para Junta Médica</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${data.pacienteNombre}</strong>,</p>
            <p>Se ha programado su junta médica. A continuación los detalles de su cita:</p>
            
            <div class="info-box">
              <p><span class="info-label">Médico Evaluador:</span> Dr./Dra. ${data.medicoNombre}</p>
              <p><span class="info-label">Fecha:</span> ${data.fecha}</p>
              ${data.hora ? `<p><span class="info-label">Hora:</span> ${data.hora}</p>` : ''}
              <p><span class="info-label">Lugar:</span> ${data.lugar}</p>
            </div>

            <div class="important">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Por favor llegue 15 minutos antes de su cita</li>
                <li>Traiga su documento de identidad</li>
                <li>Traiga cualquier documentación médica relevante</li>
              </ul>
            </div>

            <p>Si tiene alguna pregunta o necesita reprogramar, por favor contacte a nuestro departamento de recursos humanos.</p>
          </div>
          <div class="footer">
            <p>VDC Internacional - Sistema de Gestión de Juntas Médicas</p>
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: data.pacienteEmail,
      subject: `Cita Junta Médica Programada - ${data.fecha}`,
      html,
    });
  },
};
