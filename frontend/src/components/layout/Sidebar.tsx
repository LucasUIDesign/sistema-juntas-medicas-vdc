import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface SidebarLink {
  name: string;
  href: string;
  icon: ReactNode;
}

interface SidebarProps {
  links: SidebarLink[];
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const Sidebar = ({ links, isOpen, onClose, title }: SidebarProps) => {
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-vdc-sidebar border-r border-gray-200"
        aria-label="Menú lateral"
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {title && (
            <div className="px-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>
          )}
          <nav className="flex-1 px-2 space-y-1" aria-label="Navegación del dashboard">
            {links.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                end={link.href.split('/').length <= 3}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-card transition-all duration-200 ${
                    isActive
                      ? 'bg-vdc-primary text-white shadow-card'
                      : 'text-gray-700 hover:bg-white hover:shadow-card'
                  }`
                }
              >
                <span className="mr-3 flex-shrink-0" aria-hidden="true">
                  {link.icon}
                </span>
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              aria-hidden="true"
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="fixed inset-y-0 left-0 w-64 bg-vdc-sidebar z-50 lg:hidden shadow-xl"
              aria-label="Menú lateral móvil"
            >
              <div className="flex items-center justify-between h-16 px-4 bg-vdc-navy">
                <span className="text-white font-semibold">Menú</span>
                <button
                  onClick={onClose}
                  className="text-white p-2 rounded-md hover:bg-white/10 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                {title && (
                  <div className="px-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                  </div>
                )}
                <nav className="flex-1 px-2 space-y-1">
                  {links.map((link) => (
                    <NavLink
                      key={link.name}
                      to={link.href}
                      end={link.href.split('/').length <= 3}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-2 text-sm font-medium rounded-card transition-all duration-200 ${
                          isActive
                            ? 'bg-vdc-primary text-white shadow-card'
                            : 'text-gray-700 hover:bg-white hover:shadow-card'
                        }`
                      }
                    >
                      <span className="mr-3 flex-shrink-0" aria-hidden="true">
                        {link.icon}
                      </span>
                      {link.name}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
