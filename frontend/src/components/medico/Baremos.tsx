import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface BaremoCard {
  id: string;
  categoria: 'laboral' | 'previsional' | 'complementaria';
  categoriaLabel: string;
  nombre: string;
  vigencia?: string;
  vigenciaProxima?: boolean;
  subtitulo: string;
  descripcion: string;
  highlight?: string;
  items?: string[];
  link: string;
  linkText: string;
}

const BAREMOS_LABORALES: BaremoCard[] = [
  {
    id: 'decreto-659-96',
    categoria: 'laboral',
    categoriaLabel: 'Principal',
    nombre: 'Decreto 659/96',
    vigencia: 'Vigente',
    subtitulo: 'Tabla de Evaluación de Incapacidades Laborales',
    descripcion: 'Herramienta técnica y legal fundamental del Sistema de Riesgos del Trabajo. Traduce las secuelas de accidentes laborales o enfermedades profesionales en un porcentaje de incapacidad laboral permanente.',
    highlight: 'Aplicación obligatoria para Comisiones Médicas, ART y sistema judicial.',
    link: 'https://www.argentina.gob.ar/normativa/nacional/decreto-659-1996-37573',
    linkText: 'Ver texto completo',
  },
  {
    id: 'decreto-549-2025',
    categoria: 'laboral',
    categoriaLabel: 'Nueva Normativa',
    nombre: 'Decreto 549/2025',
    vigencia: 'Vigencia: Feb 2026',
    vigenciaProxima: true,
    subtitulo: 'Actualización de la Tabla de Incapacidades',
    descripcion: 'Modernización integral que reemplaza el baremo de 1996. Incorpora avances científicos y médicos actuales, nuevas patologías y busca mayor uniformidad en las pericias.',
    highlight: 'Sustituirá el Anexo I del Decreto 659/96.',
    link: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/329369/20250806',
    linkText: 'Ver en Boletín Oficial',
  },
  {
    id: 'decreto-658-96',
    categoria: 'laboral',
    categoriaLabel: 'Enfermedades',
    nombre: 'Decreto 658/96',
    subtitulo: 'Listado de Enfermedades Profesionales',
    descripcion: 'Establece el catálogo oficial de enfermedades profesionales reconocidas por el Sistema de Riesgos del Trabajo.',
    items: ['Agentes de riesgo', 'Cuadros clínicos asociados', 'Exposiciones laborales', 'Actividades causantes'],
    link: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/35000-39999/37572/texact.htm',
    linkText: 'Ver listado completo',
  },
  {
    id: 'decreto-49-2014',
    categoria: 'laboral',
    categoriaLabel: 'Ampliación',
    nombre: 'Decreto 49/2014',
    subtitulo: 'Nuevas Enfermedades Profesionales',
    descripcion: 'Incorpora al listado del Dec. 658/96 nuevas patologías laborales:',
    items: ['Hernias de disco (lumbosacras)', 'Hernias inguinales directas, mixtas y crurales', 'Várices primitivas bilaterales'],
    highlight: 'Requiere exposición mínima de 3 años en actividades de riesgo.',
    link: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/225000-229999/225309/norma.htm',
    linkText: 'Ver decreto',
  },
  {
    id: 'ley-24557',
    categoria: 'laboral',
    categoriaLabel: 'Marco Legal',
    nombre: 'Ley 24.557',
    subtitulo: 'Ley de Riesgos del Trabajo (LRT)',
    descripcion: 'Marco normativo principal del sistema de riesgos laborales.',
    items: ['Definición de contingencias cubiertas', 'Creación de las Comisiones Médicas', 'Sistema de prestaciones dinerarias y en especie', 'Funcionamiento de las ART'],
    highlight: 'Art. 8°: El grado de ILP será determinado por las Comisiones Médicas en base a la Tabla de Evaluación.',
    link: 'https://www.argentina.gob.ar/normativa/nacional/ley-24557-27971/texto',
    linkText: 'Ver ley completa',
  },
];

const BAREMOS_COMPLEMENTARIOS: BaremoCard[] = [
  {
    id: 'ley-26773',
    categoria: 'complementaria',
    categoriaLabel: 'Reparación',
    nombre: 'Ley 26.773 (2012)',
    subtitulo: 'Régimen de Reparación de Daños Laborales',
    descripcion: 'Ordena la reparación de daños derivados de accidentes de trabajo y enfermedades profesionales. Establece criterios de suficiencia, accesibilidad y automaticidad de las prestaciones.',
    highlight: 'Indemnización adicional del 20% cuando el daño ocurre en el lugar de trabajo.',
    link: 'https://www.argentina.gob.ar/normativa/nacional/ley-26773-2012-203798',
    linkText: 'Ver ley',
  },
  {
    id: 'ley-27348',
    categoria: 'complementaria',
    categoriaLabel: 'Procedimiento',
    nombre: 'Ley 27.348 (2017)',
    subtitulo: 'Complementaria de la LRT',
    descripcion: 'Establece la actuación de las Comisiones Médicas como instancia administrativa previa, obligatoria y excluyente antes de cualquier reclamo judicial.',
    highlight: 'Las CM deben expedirse en 60 días hábiles administrativos.',
    items: ['Requiere patrocinio letrado del trabajador', 'Recurso ante CM Central o justicia laboral', 'Homologaciones con carácter de cosa juzgada'],
    link: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/159382/20170224',
    linkText: 'Ver ley',
  },
];

const BAREMOS_PREVISIONALES: BaremoCard[] = [
  {
    id: 'decreto-478-98',
    categoria: 'previsional',
    categoriaLabel: 'Principal',
    nombre: 'Decreto 478/98',
    vigencia: 'Vigente',
    subtitulo: 'Baremo Nacional Previsional',
    descripcion: 'Normas para la evaluación, calificación y cuantificación del grado de invalidez de los trabajadores afiliados al Sistema Integrado de Jubilaciones y Pensiones (SIJP).',
    highlight: 'Umbral de invalidez: ≥66% de incapacidad laborativa.',
    items: ['Piel', 'Osteoarticular', 'Respiratorio', 'Cardiovascular', 'Digestivo', 'Nervioso', 'Ojos', 'ORL', 'Psiquismo', 'Neoplasias'],
    link: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/50000-54999/50726/norma.htm',
    linkText: 'Ver texto completo',
  },
  {
    id: 'ley-24241',
    categoria: 'previsional',
    categoriaLabel: 'Marco Legal',
    nombre: 'Ley 24.241',
    subtitulo: 'Sistema Integrado de Jubilaciones y Pensiones',
    descripcion: 'Marco legal del sistema previsional argentino. El Art. 48 establece el derecho al retiro por invalidez cuando la incapacidad física o intelectual priva al afiliado del 66% o más de su capacidad laborativa.',
    highlight: 'Art. 51: Crea las Comisiones Médicas y la Comisión Médica Central.',
    link: 'https://www.argentina.gob.ar/normativa/nacional/ley-24241-639',
    linkText: 'Ver ley',
  },
];

const getCategoriaStyles = (categoria: string) => {
  switch (categoria) {
    case 'laboral':
      return {
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700',
      };
    case 'previsional':
      return {
        border: 'border-l-green-500',
        badge: 'bg-green-100 text-green-700',
      };
    case 'complementaria':
      return {
        border: 'border-l-purple-500',
        badge: 'bg-purple-100 text-purple-700',
      };
    default:
      return {
        border: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-700',
      };
  }
};

const BaremoCardComponent = ({ baremo }: { baremo: BaremoCard }) => {
  const styles = getCategoriaStyles(baremo.categoria);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg p-4 shadow-card border-l-4 ${styles.border} hover:shadow-lg transition-all`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}>
          {baremo.categoriaLabel}
        </span>
        {baremo.vigencia && (
          <span className={`text-xs px-2 py-1 rounded ${baremo.vigenciaProxima ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {baremo.vigencia}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{baremo.nombre}</h3>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{baremo.subtitulo}</p>
      
      <p className="text-sm text-gray-600 mb-3">{baremo.descripcion}</p>

      {baremo.items && (
        <ul className="text-sm text-gray-600 mb-3 ml-4 list-disc space-y-1">
          {baremo.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}

      {baremo.highlight && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-3">
          <p className="text-xs text-amber-800">📋 {baremo.highlight}</p>
        </div>
      )}

      <a
        href={baremo.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-vdc-primary hover:text-vdc-primary/80 font-medium"
      >
        <DocumentTextIcon className="h-4 w-4 mr-1" />
        {baremo.linkText}
        <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
      </a>
    </motion.div>
  );
};

const Baremos = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h2 className="text-subtitle font-semibold text-gray-900 flex items-center">
          <BookOpenIcon className="h-6 w-6 mr-2 text-vdc-primary" />
          Baremos Argentinos
        </h2>
        <p className="text-vdc-secondary text-sm mt-1">
          Referencia médica y normativa para evaluación de incapacidades
        </p>
      </div>

      {/* Nota de actualización */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800">
            <strong>Actualización 2025:</strong> El Decreto 549/2025 aprueba una nueva Tabla de Evaluación de Incapacidades Laborales que entrará en vigencia en febrero de 2026.
          </p>
        </div>
      </div>

      {/* Baremos Laborales */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-vdc-primary pb-2 mb-4">
          🔧 Baremos Laborales
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {BAREMOS_LABORALES.map((baremo) => (
            <BaremoCardComponent key={baremo.id} baremo={baremo} />
          ))}
        </div>
      </div>

      {/* Normativa Complementaria */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-purple-500 pb-2 mb-4">
          📑 Normativa Complementaria
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {BAREMOS_COMPLEMENTARIOS.map((baremo) => (
            <BaremoCardComponent key={baremo.id} baremo={baremo} />
          ))}
        </div>
      </div>

      {/* Baremos Previsionales */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-green-500 pb-2 mb-4">
          🏛️ Baremos Previsionales
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {BAREMOS_PREVISIONALES.map((baremo) => (
            <BaremoCardComponent key={baremo.id} baremo={baremo} />
          ))}
        </div>
      </div>

      {/* Nota técnica */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>📌 Nota para profesionales:</strong> Para patologías no contempladas en el baremo laboral (Dec. 659/96), se utilizará el <strong>Baremo Previsional (Dec. 478/98)</strong> como referencia subsidiaria, según indica la propia normativa laboral actualizada.
        </p>
      </div>
    </motion.div>
  );
};

export default Baremos;
