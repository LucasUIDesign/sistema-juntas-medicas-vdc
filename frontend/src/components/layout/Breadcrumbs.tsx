import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

// Route name mappings
const routeNames: Record<string, string> = {
  'dashboard': 'Dashboard',
  'medico': 'Médico',
  'rrhh': 'RRHH',
  'nueva-junta': 'Nueva Junta',
  'mis-juntas': 'Mis Juntas',
  'perfil': 'Perfil',
  'todas-juntas': 'Todas las Juntas',
  'reportes': 'Reportes',
  'usuarios': 'Gestionar Usuarios',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const href = `/${pathnames.slice(0, index + 1).join('/')}`;
    const name = routeNames[value] || value.charAt(0).toUpperCase() + value.slice(1);
    
    return {
      name,
      href: index < pathnames.length - 1 ? href : undefined // Last item has no link
    };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home link */}
        <li>
          <Link
            to="/"
            className="text-vdc-secondary hover:text-vdc-primary transition-colors"
            aria-label="Ir al inicio"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRightIcon 
              className="h-4 w-4 text-vdc-secondary mx-1" 
              aria-hidden="true" 
            />
            {item.href ? (
              <Link
                to={item.href}
                className="text-vdc-secondary hover:text-vdc-primary transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-gray-800 font-medium" aria-current="page">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
