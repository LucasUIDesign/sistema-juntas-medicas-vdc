import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  EnvelopeIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const PerfilMedico = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para foto de perfil
  const [profilePhoto, setProfilePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face'
  );
  
  // Estado para modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Campos editables
  const [editableData, setEditableData] = useState({
    telefono: '+507 6123-4567',
    direccion: 'Ciudad de Panamá, Panamá',
  });
  
  const [tempData, setTempData] = useState(editableData);

  // Datos del sistema (no editables)
  const systemData = {
    especialidad: 'Medicina Ocupacional',
    colegiatura: 'CMP-12345',
    fechaIngreso: '15 de Marzo, 2023',
    departamento: 'Salud Ocupacional',
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      MEDICO_INFERIOR: 'Médico',
      MEDICO_SUPERIOR: 'Médico Superior',
      RRHH: 'Recursos Humanos',
    };
    return roles[role] || role;
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string);
        toast.success('Foto actualizada correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setEditableData(tempData);
    setIsEditing(false);
    toast.success('Perfil actualizado correctamente');
  };

  const handleCancel = () => {
    setTempData(editableData);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mi Perfil</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tu información personal
          </p>
        </div>
        {!isEditing ? (
          <motion.button
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-vdc-primary border border-vdc-primary rounded-lg hover:bg-vdc-primary/5 transition-colors w-full sm:w-auto"
          >
            <PencilIcon className="w-4 h-4" />
            Editar Perfil
          </motion.button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <motion.button
              onClick={handleCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancelar
            </motion.button>
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-vdc-success rounded-lg hover:bg-vdc-success/90 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Guardar
            </motion.button>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            {/* Photo */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  src={profilePhoto}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                title="Cambiar foto"
              >
                <CameraIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{user?.nombre}</h3>
              <p className="text-gray-500 text-sm">{systemData.especialidad}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-vdc-primary/10 text-vdc-primary">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  {getRoleName(user?.role || '')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Información del Sistema (No editable) */}
          <div className="mb-8">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Información del Sistema
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Email Institucional</p>
                  <p className="text-sm text-gray-700 truncate">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IdentificationIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Colegiatura</p>
                  <p className="text-sm text-gray-700">{systemData.colegiatura}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <AcademicCapIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Especialidad</p>
                  <p className="text-sm text-gray-700">{systemData.especialidad}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BuildingOffice2Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Departamento</p>
                  <p className="text-sm text-gray-700">{systemData.departamento}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Fecha de Ingreso</p>
                  <p className="text-sm text-gray-700">{systemData.fechaIngreso}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IdentificationIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">ID de Usuario</p>
                  <p className="text-sm text-gray-700 font-mono truncate">{user?.id}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              * Esta información es gestionada por el administrador del sistema
            </p>
          </div>

          {/* Información Personal (Editable) */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Información de Contacto
              {isEditing && <span className="text-vdc-primary ml-2">(Editando)</span>}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isEditing ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <PhoneIcon className={`w-5 h-5 ${isEditing ? 'text-vdc-primary' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Teléfono</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={tempData.telefono}
                      onChange={(e) => setTempData({ ...tempData, telefono: e.target.value })}
                      className="w-full text-sm text-gray-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      placeholder="Ingresa tu teléfono"
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{editableData.telefono}</p>
                  )}
                </div>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isEditing ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <MapPinIcon className={`w-5 h-5 ${isEditing ? 'text-vdc-primary' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">Dirección</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.direccion}
                      onChange={(e) => setTempData({ ...tempData, direccion: e.target.value })}
                      className="w-full text-sm text-gray-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                      placeholder="Ingresa tu dirección"
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{editableData.direccion}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-xs text-gray-400">
              Para cambios en información del sistema, contacta al administrador
            </p>
            <button
              onClick={() => window.open('mailto:admin@vdc-internacional.com', '_blank')}
              className="text-xs text-vdc-primary hover:underline"
            >
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PerfilMedico;
