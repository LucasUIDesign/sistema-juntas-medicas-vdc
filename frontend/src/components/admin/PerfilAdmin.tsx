import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  KeyIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface ProfileData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  username: string;
  fotoUrl: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

const PerfilAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'password'>('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    username: '',
    fotoUrl: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const getToken = () => {
    return localStorage.getItem('vdc_token');
  };

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
          email: data.email || '',
          username: data.username || '',
          fotoUrl: data.fotoUrl || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validaciones del lado del cliente
    if (profileData.dni && profileData.dni.length !== 8) {
      setMessage({ type: 'error', text: 'El DNI debe contener exactamente 8 dígitos' });
      setLoading(false);
      return;
    }

    if (profileData.telefono && profileData.telefono.length !== 10) {
      setMessage({ type: 'error', text: 'El teléfono debe contener exactamente 10 dígitos' });
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: profileData.nombre,
          apellido: profileData.apellido,
          dni: profileData.dni,
          telefono: profileData.telefono,
          username: profileData.username,
          email: profileData.email,
          fotoUrl: profileData.fotoUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        setIsEditingProfile(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al actualizar el perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsEditingPassword(false);
      } else {
        setMessage({ type: 'error', text: data.details?.currentPassword || data.message || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, fotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-vdc-primary to-vdc-secondary px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {profileData.fotoUrl ? (
                <img
                  src={profileData.fotoUrl}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
                  <UserCircleIcon className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {profileData.nombre && profileData.apellido
                  ? `${profileData.nombre} ${profileData.apellido}`
                  : user?.nombre || 'Administrador'}
              </h1>
              <p className="text-white/80">{profileData.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('perfil'); setMessage(null); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'perfil'
                  ? 'border-vdc-primary text-vdc-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCircleIcon className="w-5 h-5 inline-block mr-2" />
              Datos del Perfil
            </button>
            <button
              onClick={() => { setActiveTab('password'); setMessage(null); }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-vdc-primary text-vdc-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyIcon className="w-5 h-5 inline-block mr-2" />
              Cambiar Contraseña
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="w-5 h-5 mr-2" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {activeTab === 'perfil' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Botón de Editar */}
              {!isEditingProfile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Editar Perfil
                  </button>
                </div>
              )}

              {/* Foto de perfil */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profileData.fotoUrl ? (
                    <img
                      src={profileData.fotoUrl}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserCircleIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {isEditingProfile && (
                    <label className="absolute bottom-0 right-0 bg-vdc-primary text-white rounded-full p-2 cursor-pointer hover:bg-vdc-primary/90 transition-colors">
                      <CameraIcon className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Foto de Perfil</h3>
                  <p className="text-sm text-gray-500">JPG, PNG o GIF. Máximo 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Ingrese su nombre de usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={profileData.nombre}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      setProfileData(prev => ({ ...prev, nombre: value }));
                    }}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Ingrese su nombre"
                    title="Solo se permiten letras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={profileData.apellido}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      setProfileData(prev => ({ ...prev, apellido: value }));
                    }}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Ingrese su apellido"
                    title="Solo se permiten letras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={profileData.dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setProfileData(prev => ({ ...prev, dni: value }));
                    }}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="12345678"
                    maxLength={8}
                    title="Debe contener exactamente 8 dígitos"
                  />
                  {isEditingProfile && <p className="mt-1 text-xs text-gray-500">Debe contener exactamente 8 dígitos</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={profileData.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileData(prev => ({ ...prev, telefono: value }));
                    }}
                    disabled={!isEditingProfile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="1234567890"
                    maxLength={10}
                    title="Debe contener exactamente 10 dígitos"
                  />
                  {isEditingProfile && <p className="mt-1 text-xs text-gray-500">Debe contener exactamente 10 dígitos</p>}
                </div>

              </div>

              {isEditingProfile && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      fetchProfile(); // Recargar datos originales
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              {/* Botón de Editar */}
              {!isEditingPassword && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingPassword(true)}
                    className="inline-flex items-center px-4 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors"
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Cambiar Contraseña
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    disabled={!isEditingPassword}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Ingrese su contraseña actual"
                    required
                  />
                  {isEditingPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    disabled={!isEditingPassword}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Ingrese la nueva contraseña"
                    required
                    minLength={8}
                  />
                  {isEditingPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
                {isEditingPassword && (
                  <p className="mt-1 text-sm text-gray-500">
                    Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    disabled={!isEditingPassword}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vdc-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    placeholder="Confirme la nueva contraseña"
                    required
                  />
                  {isEditingPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {isEditingPassword && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-vdc-primary text-white rounded-lg hover:bg-vdc-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilAdmin;
