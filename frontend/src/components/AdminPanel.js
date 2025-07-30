import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState({ 
    zelle_email: '', 
    consultation_price: 50.00,
    half_hour_extension: 25.00,
    full_hour_extension: 45.00
  });
  const [schedule, setSchedule] = useState({
    weekly_schedule: {},
    custom_schedules: []
  });
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  const authenticate = async () => {
    try {
      setError('');
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      
      // Test authentication with stats endpoint
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      const response = await axios.get(`${apiUrl}/admin/stats`, {
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

      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      const [appointmentsRes, statsRes, settingsRes, scheduleRes] = await Promise.all([
        axios.get(`${apiUrl}/admin/appointments`, {
          headers: { 'Authorization': `Basic ${auth}` }
        }),
        axios.get(`${apiUrl}/admin/stats`, {
          headers: { 'Authorization': `Basic ${auth}` }
        }),
        axios.get(`${apiUrl}/admin/settings`, {
          headers: { 'Authorization': `Basic ${auth}` }
        }),
        axios.get(`${apiUrl}/admin/schedule`, {
          headers: { 'Authorization': `Basic ${auth}` }
        })
      ]);

      setAppointments(appointmentsRes.data);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setSchedule(scheduleRes.data);
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
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      await axios.put(`${apiUrl}/admin/appointments/${appointmentId}/confirm-zelle`, {}, {
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
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      await axios.delete(`${apiUrl}/admin/appointments/${appointmentId}`, {
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
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      const response = await axios.get(`${apiUrl}/admin/appointments/export`, {
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
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      
      await axios.put(`${apiUrl}/admin/settings`, settings, {
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

  const updateWeeklySchedule = async () => {
    try {
      setScheduleLoading(true);
      const auth = localStorage.getItem('adminAuth');
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      
      await axios.put(`${apiUrl}/admin/schedule/weekly`, schedule.weekly_schedule, {
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Horario semanal actualizado exitosamente');
    } catch (error) {
      console.error('Error updating weekly schedule:', error);
      alert('Error al actualizar el horario semanal');
    } finally {
      setScheduleLoading(false);
    }
  };

  const updateCustomSchedule = async (date, times, isAvailable = true) => {
    try {
      const auth = localStorage.getItem('adminAuth');
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      
      await axios.put(`${apiUrl}/admin/schedule/custom`, {
        date: date,
        available_times: times,
        is_available: isAvailable
      }, {
        headers: { 
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Reload schedule data
      const scheduleRes = await axios.get(`${apiUrl}/admin/schedule`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      setSchedule(scheduleRes.data);
      
      alert(`Horario personalizado actualizado para ${date}`);
    } catch (error) {
      console.error('Error updating custom schedule:', error);
      alert('Error al actualizar el horario personalizado');
    }
  };

  const blockDate = async (date) => {
    await updateCustomSchedule(date, [], false);
  };

  const deleteCustomSchedule = async (date) => {
    try {
      const auth = localStorage.getItem('adminAuth');
      const apiUrl = backendUrl.includes('/api') ? backendUrl : `${backendUrl}/api`;
      
      await axios.delete(`${apiUrl}/admin/schedule/custom/${date}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      
      // Reload schedule data
      const scheduleRes = await axios.get(`${apiUrl}/admin/schedule`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      setSchedule(scheduleRes.data);
      
      alert(`Horario personalizado eliminado para ${date}. Reverted to default.`);
    } catch (error) {
      console.error('Error deleting custom schedule:', error);
      alert('Error al eliminar el horario personalizado');
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

        {/* Tab Navigation */}
        <div className="elegant-card rounded-3xl p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'appointments' 
                  ? 'bg-golden-brown text-white shadow-md' 
                  : 'text-golden-brown hover:bg-white'
              }`}
            >
              📅 Citas
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'schedule' 
                  ? 'bg-golden-brown text-white shadow-md' 
                  : 'text-golden-brown hover:bg-white'
              }`}
            >
              🕐 Horarios
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'settings' 
                  ? 'bg-golden-brown text-white shadow-md' 
                  : 'text-golden-brown hover:bg-white'
              }`}
            >
              ⚙️ Configuración
            </button>
          </div>
        </div>

        {/* Stats Cards - Only show for appointments tab */}
        {activeTab === 'appointments' && (
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
        )}

        {/* Content Area */}
        {activeTab === 'appointments' && (
          /* Appointments Table */
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
        )}

        {activeTab === 'schedule' && (
          /* Schedule Management Panel */
          <div className="space-y-8">
            {/* Weekly Schedule */}
            <div className="elegant-card rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-golden-brown mb-6">
                🕐 Horario Semanal por Defecto
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">ℹ️</span>
                  <p className="text-blue-800 font-medium">Configuración de Horarios</p>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Define tus horarios disponibles para cada día de la semana. Puedes crear excepciones específicas más abajo.
                </p>
              </div>

              {Object.entries(schedule.weekly_schedule || {}).map(([day, times]) => (
                <div key={day} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-golden-brown capitalize">
                      {day === 'monday' && '🌟 Lunes'}
                      {day === 'tuesday' && '🌟 Martes'}
                      {day === 'wednesday' && '🌟 Miércoles'}
                      {day === 'thursday' && '🌟 Jueves'}
                      {day === 'friday' && '🌟 Viernes'}
                      {day === 'saturday' && '🌅 Sábado'}
                      {day === 'sunday' && '🌴 Domingo'}
                    </h3>
                    <button
                      onClick={() => {
                        const newTimes = [...times, '09:00'];
                        setSchedule({
                          ...schedule,
                          weekly_schedule: {
                            ...schedule.weekly_schedule,
                            [day]: newTimes
                          }
                        });
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      + Agregar Hora
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                    {times.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => {
                            const newTimes = [...times];
                            newTimes[index] = e.target.value;
                            setSchedule({
                              ...schedule,
                              weekly_schedule: {
                                ...schedule.weekly_schedule,
                                [day]: newTimes
                              }
                            });
                          }}
                          className="form-input px-2 py-1 text-sm rounded"
                        />
                        <button
                          onClick={() => {
                            const newTimes = times.filter((_, i) => i !== index);
                            setSchedule({
                              ...schedule,
                              weekly_schedule: {
                                ...schedule.weekly_schedule,
                                [day]: newTimes
                              }
                            });
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={updateWeeklySchedule}
                disabled={scheduleLoading}
                className="btn-primary px-6 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scheduleLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  '💾 Guardar Horario Semanal'
                )}
              </button>
            </div>

            {/* Custom Schedules */}
            <div className="elegant-card rounded-3xl p-6">
              <h2 className="text-xl font-semibold text-golden-brown mb-6">
                📅 Horarios Personalizados y Días Bloqueados
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-yellow-800 font-medium">Excepciones al Horario</p>
                </div>
                <p className="text-yellow-700 text-sm mt-2">
                  Aquí puedes crear excepciones para días específicos: cambiar horarios, agregar días extra, o bloquear días por vacaciones.
                </p>
              </div>

              {/* Add Custom Schedule */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-golden-brown mb-4">
                  ➕ Crear Excepción para Fecha Específica
                </h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    id="customDate"
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input px-3 py-2 rounded"
                  />
                  <button
                    onClick={() => {
                      const date = document.getElementById('customDate').value;
                      if (date) {
                        updateCustomSchedule(date, ['09:00', '10:00', '14:00', '15:00']);
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    📝 Crear Horario Personalizado
                  </button>
                  <button
                    onClick={() => {
                      const date = document.getElementById('customDate').value;
                      if (date) {
                        blockDate(date);
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    🚫 Bloquear Día
                  </button>
                </div>
              </div>

              {/* Existing Custom Schedules */}
              <div className="space-y-4">
                {schedule.custom_schedules?.map((customSchedule) => (
                  <div key={customSchedule.date} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-golden-brown">
                        📅 {new Date(customSchedule.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customSchedule.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {customSchedule.is_available ? 'Disponible' : 'Bloqueado'}
                        </span>
                        <button
                          onClick={() => deleteCustomSchedule(customSchedule.date)}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                    
                    {customSchedule.is_available && (
                      <div className="grid grid-cols-6 gap-2">
                        {customSchedule.available_times?.map((time, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <span className="bg-golden-brown text-white px-2 py-1 rounded text-sm">
                              {time}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!customSchedule.is_available && (
                      <p className="text-red-600 italic">Día completamente bloqueado</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          /* Settings Panel */
          <div className="elegant-card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-golden-brown mb-6">
              ⚙️ Configuración de Pagos
            </h2>
            
            <div className="max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">ℹ️</span>
                  <p className="text-blue-800 font-medium">Configuración de Precios</p>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  Configura el email para Zelle, precio base de consulta y tarifas para sesiones extendidas. 
                  Los precios se aplican tanto para PayPal como para Zelle.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-golden-brown font-medium mb-2">
                    📧 Email para pagos Zelle
                  </label>
                  <input
                    type="email"
                    value={settings.zelle_email}
                    onChange={(e) => setSettings({...settings, zelle_email: e.target.value})}
                    className="form-input w-full p-4 rounded-lg"
                    placeholder="tu-email@gmail.com"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Los clientes enviarán pagos Zelle a este email
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      💰 Sesión estándar (1 hora)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.consultation_price}
                        onChange={(e) => setSettings({...settings, consultation_price: parseFloat(e.target.value) || 0})}
                        className="form-input w-full p-4 pl-8 rounded-lg"
                        placeholder="50.00"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Precio base para sesión de 60 minutos
                    </p>
                  </div>

                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      ⏰ Extensión +30 min
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.half_hour_extension}
                        onChange={(e) => setSettings({...settings, half_hour_extension: parseFloat(e.target.value) || 0})}
                        className="form-input w-full p-4 pl-8 rounded-lg"
                        placeholder="25.00"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Costo adicional por 30 minutos extra
                    </p>
                  </div>

                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      ⏰⏰ Extensión +60 min
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.full_hour_extension}
                        onChange={(e) => setSettings({...settings, full_hour_extension: parseFloat(e.target.value) || 0})}
                        className="form-input w-full p-4 pl-8 rounded-lg"
                        placeholder="45.00"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Costo adicional por 60 minutos extra
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">Vista previa de precios:</p>
                  <div className="space-y-2 text-green-700">
                    <p>• <strong>Sesión estándar (1 hora):</strong> ${settings.consultation_price?.toFixed(2) || '50.00'} USD</p>
                    <p>• <strong>Sesión extendida (1.5 horas):</strong> ${((settings.consultation_price || 50) + (settings.half_hour_extension || 25)).toFixed(2)} USD</p>
                    <p>• <strong>Sesión larga (2 horas):</strong> ${((settings.consultation_price || 50) + (settings.full_hour_extension || 45)).toFixed(2)} USD</p>
                    <p className="text-sm mt-2 text-green-600">
                      Los precios se aplican para PayPal y Zelle. Email Zelle: <strong>{settings.zelle_email || 'tu-email@gmail.com'}</strong>
                    </p>
                  </div>
                </div>

                {/* Quick Schedule Editor */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-golden-brown mb-4">
                    🕐 Horarios de Trabajo (Vista Rápida)
                  </h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">💡</span>
                      <p className="text-yellow-800 font-medium">Configuración Rápida</p>
                    </div>
                    <p className="text-yellow-700 text-sm mt-2">
                      Aquí puedes ver y modificar tus horarios básicos. Para gestión avanzada (días específicos, excepciones), usa la pestaña "🕐 Horarios".
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Weekdays */}
                    <div>
                      <h4 className="font-medium text-golden-brown mb-3">Lunes a Viernes</h4>
                      <div className="space-y-2">
                        {schedule.weekly_schedule?.monday?.map((time, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm font-medium">{time}</span>
                            <button
                              onClick={() => {
                                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                                const newSchedule = { ...schedule.weekly_schedule };
                                days.forEach(day => {
                                  newSchedule[day] = newSchedule[day]?.filter((_, i) => i !== index) || [];
                                });
                                setSchedule({ ...schedule, weekly_schedule: newSchedule });
                              }}
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        )) || []}
                        <button
                          onClick={() => {
                            const newTime = prompt('Nueva hora (formato HH:MM):', '09:00');
                            if (newTime && /^\d{2}:\d{2}$/.test(newTime)) {
                              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                              const newSchedule = { ...schedule.weekly_schedule };
                              days.forEach(day => {
                                newSchedule[day] = [...(newSchedule[day] || []), newTime].sort();
                              });
                              setSchedule({ ...schedule, weekly_schedule: newSchedule });
                            }
                          }}
                          className="w-full bg-green-100 text-green-700 p-2 rounded border border-green-300 hover:bg-green-200 text-sm"
                        >
                          + Agregar hora a días laborales
                        </button>
                      </div>
                    </div>

                    {/* Weekend */}
                    <div>
                      <h4 className="font-medium text-golden-brown mb-3">Sábado</h4>
                      <div className="space-y-2">
                        {schedule.weekly_schedule?.saturday?.map((time, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm font-medium">{time}</span>
                            <button
                              onClick={() => {
                                const newSchedule = { ...schedule.weekly_schedule };
                                newSchedule.saturday = newSchedule.saturday?.filter((_, i) => i !== index) || [];
                                setSchedule({ ...schedule, weekly_schedule: newSchedule });
                              }}
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        )) || []}
                        <button
                          onClick={() => {
                            const newTime = prompt('Nueva hora para sábado (formato HH:MM):', '09:00');
                            if (newTime && /^\d{2}:\d{2}$/.test(newTime)) {
                              const newSchedule = { ...schedule.weekly_schedule };
                              newSchedule.saturday = [...(newSchedule.saturday || []), newTime].sort();
                              setSchedule({ ...schedule, weekly_schedule: newSchedule });
                            }
                          }}
                          className="w-full bg-blue-100 text-blue-700 p-2 rounded border border-blue-300 hover:bg-blue-200 text-sm"
                        >
                          + Agregar hora al sábado
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                          <span className="text-sm font-medium text-gray-700">🌴 Domingo</span>
                          <span className="text-xs text-gray-500">
                            {schedule.weekly_schedule?.sunday?.length > 0 ? 'Disponible' : 'Cerrado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      onClick={updateWeeklySchedule}
                      disabled={scheduleLoading}
                      className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 disabled:opacity-50"
                    >
                      {scheduleLoading ? 'Guardando...' : '🕐 Guardar Horarios'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={updateSettings}
                  disabled={settingsLoading}
                  className="btn-primary px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingsLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    '💾 Guardar Configuración'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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