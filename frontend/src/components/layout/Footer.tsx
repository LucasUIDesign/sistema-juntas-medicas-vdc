import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-vdc-navy text-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">VDC Internacional</h3>
            <p className="text-white/70 text-sm">
              Sistema de Gestión de Juntas Médicas para la administración 
              eficiente de evaluaciones ocupacionales.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                <a 
                  href="mailto:info@vdc-internacional.com" 
                  className="hover:text-white transition-colors"
                  aria-label="Enviar correo a info@vdc-internacional.com"
                >
                  info@vdc-internacional.com
                </a>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                <a 
                  href="tel:+5403794428711" 
                  className="hover:text-white transition-colors"
                  aria-label="Llamar al teléfono de contacto"
                >
                  +54 0379 4428711
                </a>
              </li>
              <li className="flex items-start">
                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>San Luis 789, Corrientes Capital, Argentina</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a 
                  href="https://www.vdc-internacional.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Sitio Principal
                </a>
              </li>
              <li>
                <a 
                  href="https://www.vdc-internacional.com/servicios" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Nuestros Servicios
                </a>
              </li>
              <li>
                <a 
                  href="https://www.vdc-internacional.com/contacto" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contáctenos
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-white/60">
          <p>
            © {currentYear} VDC Internacional. Todos los derechos reservados.
          </p>
          <p className="mt-1">
            Sistema de Gestión de Juntas Médicas v1.0
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
