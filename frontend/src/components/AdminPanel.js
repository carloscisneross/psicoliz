import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({ zelle_email: '', consultation_price: 50.00 });
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  const authenticate = async () => {
    try {
      setError('');
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      
      // Test authentication with stats endpoint
      const response = await axios.get(`${backendUrl}/api/admin/stats`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      // Store credentials for future requests
      localStorage.setItem('adminAuth', auth);
      setAuthenticated(true);
      loadData();
    } catch (error) {
      setError('Credenciales incorrectas');
      console.error('Authentication failed:', error);
    }
  };

  const loadData = async () => {
    try {
      const auth = localStorage.getItem('adminAuth');
      if (!auth) {
        setAuthenticated(false);
        return;
      }

      const [appointmentsRes, statsRes, settingsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/admin/appointments`, {
          headers: { 'Authorization': `Basic ${auth}` }
        }),
        axios.get(`${backendUrl}/api/admin/stats`, {
          headers: { 'Authorization': `Basic ${auth}` }
        }),
        axios.get(`${backendUrl}/api/admin/settings`, {
          headers: { 'Authorization': `Basic ${auth}` }
        })
      ]);

      setAppointments(appointmentsRes.data);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminAuth');
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmZellePayment = async (appointmentId) => {
    try {
      const auth = localStorage.getItem('adminAuth');
      await axios.put(`${backendUrl}/api/admin/appointments/${appointmentId}/confirm-zelle`, {}, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      
      alert('Pago Zelle confirmado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error confirming Zelle payment:', error);
      alert('Error al confirmar el pago');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      return;
    }

    try {
      const auth = localStorage.getItem('adminAuth');
      await axios.delete(`${backendUrl}/api/admin/appointments/${appointmentId}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      
      alert('Cita eliminada exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error al eliminar la cita');
    }
  };

  const exportAppointments = async () => {
    try {
      const auth = localStorage.getItem('adminAuth');
      const response = await axios.get(`${backendUrl}/api/admin/appointments/export`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      
      const csvData = response.data.csv_data;
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citas_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting appointments:', error);
      alert('Error al exportar las citas');
    }
  };

  const updateSettings = async () => {
    try {
      setSettingsLoading(true);
      const auth = localStorage.getItem('adminAuth');
      
      await axios.put(`${backendUrl}/api/admin/settings`, settings, {
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error al actualizar la configuración');
    } finally {
      setSettingsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setAuthenticated(false);
    setCredentials({ username: '', password: '' });
  };

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth) {
      setAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'awaiting_payment_proof': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'confirmed': 'Confirmada',
      'pending': 'Pendiente',
      'awaiting_payment_proof': 'Esperando comprobante',
      'cancelled': 'Cancelada'
    };
    return texts[status] || status;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-blush-pink floral-bg py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="elegant-card rounded-3xl p-8">
              <div className="text-center mb-8">
                <img
                  src="https://customer-assets.emergentagent.com/job_parra-psico/artifacts/ixqpyybc_IMG_3205.PNG"
                  alt="Liz Parra - Psicóloga"
                  className="w-24 h-24 rounded-full mx-auto profile-image object-cover mb-4"
                />
                <h1 className="text-2xl font-elegant font-bold text-golden-brown mb-2">
                  Panel de Administración
                </h1>
                <p className="text-gray-600">Liz Parra - Psicóloga</p>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-golden-brown font-medium mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="form-input w-full p-3 rounded-lg"
                    placeholder="Ingresa tu usuario"
                  />
                </div>
                
                <div>
                  <label className="block text-golden-brown font-medium mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="form-input w-full p-3 rounded-lg"
                    placeholder="Ingresa tu contraseña"
                    onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                  />
                </div>
                
                <button
                  onClick={authenticate}
                  className="btn-primary w-full px-6 py-3 rounded-full font-semibold"
                >
                  Iniciar Sesión
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-400"
                >
                  Volver al sitio web
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blush-pink floral-bg flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush-pink floral-bg py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="elegant-card rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src="https://customer-assets.emergentagent.com/job_parra-psico/artifacts/ixqpyybc_IMG_3205.PNG"
                alt="Liz Parra - Psicóloga"
                className="w-16 h-16 rounded-full profile-image object-cover"
              />
              <div>
                <h1 className="text-2xl font-elegant font-bold text-golden-brown">
                  Panel de Administración
                </h1>
                <p className="text-gray-600">Gestión de Citas - Liz Parra</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={exportAppointments}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                📊 Exportar CSV
              </button>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="elegant-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-golden-brown">{stats.total_appointments || 0}</div>
            <div className="text-sm text-gray-600">Total Citas</div>
          </div>
          <div className="elegant-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed_appointments || 0}</div>
            <div className="text-sm text-gray-600">Confirmadas</div>
          </div>
          <div className="elegant-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_appointments || 0}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="elegant-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.paypal_appointments || 0}</div>
            <div className="text-sm text-gray-600">PayPal</div>
          </div>
          <div className="elegant-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.zelle_appointments || 0}</div>
            <div className="text-sm text-gray-600">Zelle</div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="elegant-card rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-golden-brown mb-6">
            Lista de Citas ({appointments.length})
          </h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay citas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-golden-brown border-opacity-20">
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Fecha</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Hora</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Cliente</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">WhatsApp</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Pago</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Estado</th>
                    <th className="text-left py-3 px-2 font-semibold text-golden-brown">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-gray-200">
                      <td className="py-3 px-2">{appointment.appointment_date}</td>
                      <td className="py-3 px-2">{appointment.appointment_time}</td>
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{appointment.full_name}</div>
                          <div className="text-sm text-gray-500">{appointment.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <a 
                          href={`https://wa.me/${appointment.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                        >
                          {appointment.whatsapp}
                        </a>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.payment_method === 'paypal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {appointment.payment_method === 'paypal' ? 'PayPal' : 'Zelle'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          {appointment.payment_method === 'zelle' && appointment.status !== 'confirmed' && (
                            <button
                              onClick={() => confirmZellePayment(appointment.id)}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                              title="Confirmar pago Zelle"
                            >
                              ✓
                            </button>
                          )}
                          {appointment.zelle_receipt && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `data:image/jpeg;base64,${appointment.zelle_receipt}`;
                                link.download = `comprobante_${appointment.id}.jpg`;
                                link.click();
                              }}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                              title="Descargar comprobante"
                            >
                              📄
                            </button>
                          )}
                          <button
                            onClick={() => deleteAppointment(appointment.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            title="Eliminar cita"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-400"
          >
            Volver al sitio web
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;