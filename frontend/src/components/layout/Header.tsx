import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const navLinks = [
  { name: 'Inicio', href: '/', external: false, noActiveState: true },
  { name: 'Gestión de Juntas Médicas', href: '/', external: false, noActiveState: false },
  { name: 'Contacto', href: 'https://www.vdc-internacional.com/contacto', external: true, noActiveState: false },
];

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-gray-100 to-gray-200 shadow-md">
      <nav className="w-full px-4 sm:px-6 lg:px-12" aria-label="Navegación principal">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo - Izquierda */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              className="flex items-center"
              aria-label="VDC Internacional - Ir al inicio"
            >
              <img
                src="/logo-vdc.png"
                alt="VDC Internacional"
                className="h-10 sm:h-12 md:h-14 lg:h-[60px] w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-vdc-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    !link.noActiveState && (location.pathname === link.href || location.pathname.startsWith('/dashboard'))
                      ? 'text-vdc-primary bg-vdc-primary/10 rounded'
                      : 'text-gray-600 hover:text-vdc-primary'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Auth Button - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center text-gray-600 text-sm">
                  <UserCircleIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                  <span className="hidden lg:inline">{user.nombre}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-card text-sm font-medium transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                  Cerrar Sesión
                </motion.button>
              </div>
            ) : (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-vdc-primary hover:bg-vdc-primary/90 text-white px-4 py-2 rounded-card text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 p-2 rounded-md hover:bg-gray-300 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pb-4"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-600 hover:text-vdc-primary hover:bg-gray-300 px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      !link.noActiveState && location.pathname === link.href
                        ? 'text-vdc-primary bg-vdc-primary/10'
                        : 'text-gray-600 hover:text-vdc-primary hover:bg-gray-300'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>

            {/* Auth Button - Mobile */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600 px-3 py-2">
                    <UserCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    {user.nombre}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-card text-base font-medium"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block w-full text-center bg-vdc-primary hover:bg-vdc-primary/90 text-white px-4 py-2 rounded-card text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;
