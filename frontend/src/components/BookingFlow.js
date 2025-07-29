import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const BookingFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    payment_method: ''
  });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  // Load available times when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.get(`${backendUrl}/api/available-slots/${dateStr}`);
      setAvailableTimes(response.data.available_times);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableTimes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNextStep = () => {
    if (step === 1 && (!selectedDate || !selectedTime)) {
      alert('Por favor selecciona fecha y hora');
      return;
    }
    if (step === 2 && (!formData.full_name || !formData.email || !formData.whatsapp)) {
      alert('Por favor completa todos los campos');
      return;
    }
    if (step === 3 && !formData.payment_method) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const bookingData = {
        ...formData,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTime
      };

      if (formData.payment_method === 'paypal') {
        // Create PayPal order
        const response = await axios.post(`${backendUrl}/api/create-paypal-order`, bookingData);
        window.location.href = response.data.approval_url;
      } else if (formData.payment_method === 'zelle') {
        // Create Zelle booking
        const response = await axios.post(`${backendUrl}/api/create-zelle-booking`, bookingData);
        navigate(`/zelle-instructions/${response.data.booking_id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la reserva. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  return (
    <div className="min-h-screen bg-blush-pink floral-bg py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Profile Image */}
            <div className="mb-6">
              <img
                src="https://customer-assets.emergentagent.com/job_parra-psico/artifacts/ixqpyybc_IMG_3205.PNG"
                alt="Liz Parra - Psicóloga"
                className="w-32 h-32 rounded-full mx-auto profile-image object-cover"
              />
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-golden-brown hover:text-warm-brown mb-4 flex items-center space-x-2 mx-auto"
            >
              <span>←</span>
              <span>Volver al inicio</span>
            </button>
            <h1 className="text-3xl font-elegant font-bold text-golden-brown mb-4">
              Agendar tu Cita
            </h1>
            <div className="flex justify-center space-x-4 mb-8">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= stepNum 
                      ? 'bg-golden-brown text-white' 
                      : 'bg-white text-golden-brown border-2 border-golden-brown'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>
          </div>

          <div className="elegant-card rounded-3xl p-8">
            {/* Step 1: Date & Time Selection */}
            {step === 1 && (
              <div className="fade-in-up">
                <h2 className="text-2xl font-semibold text-golden-brown mb-6 text-center">
                  Selecciona fecha y hora
                </h2>
                
                <div className="mb-6">
                  <label className="block text-golden-brown font-medium mb-3">
                    Fecha de la cita:
                  </label>
                  <div className="flex justify-center">
                    <DatePicker
                      selected={selectedDate}
                      onChange={setSelectedDate}
                      minDate={minDate}
                      maxDate={maxDate}
                      excludeDates={[]} // Add excluded dates if needed
                      inline
                      className="border-2 border-golden-brown rounded-lg"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div className="mb-8">
                    <label className="block text-golden-brown font-medium mb-3">
                      Hora disponible:
                    </label>
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="loading-spinner"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`time-slot p-3 rounded-lg font-medium ${
                              selectedTime === time ? 'selected' : ''
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                    {availableTimes.length === 0 && !loading && (
                      <p className="text-center text-gray-600">
                        No hay horarios disponibles para esta fecha
                      </p>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={handleNextStep}
                    disabled={!selectedDate || !selectedTime}
                    className="btn-primary px-8 py-3 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="fade-in-up">
                <h2 className="text-2xl font-semibold text-golden-brown mb-6 text-center">
                  Información personal
                </h2>
                
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleFormChange}
                      className="form-input w-full p-4 rounded-lg"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="form-input w-full p-4 rounded-lg"
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-golden-brown font-medium mb-2">
                      WhatsApp *
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleFormChange}
                      className="form-input w-full p-4 rounded-lg"
                      placeholder="+58 412-123-4567"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-400"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-primary px-8 py-3 rounded-full font-semibold"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="fade-in-up">
                <h2 className="text-2xl font-semibold text-golden-brown mb-6 text-center">
                  Método de pago
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div
                    className={`payment-card p-6 rounded-xl ${
                      formData.payment_method === 'paypal' ? 'selected' : ''
                    }`}
                    onClick={() => setFormData({...formData, payment_method: 'paypal'})}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">💳</div>
                      <div>
                        <h3 className="text-xl font-semibold text-golden-brown">PayPal</h3>
                        <p className="text-gray-600">Pago inmediato y seguro</p>
                        <p className="text-lg font-semibold text-golden-brown">$50.00 USD</p>
                      </div>
                    </div>
                  </div>
                  
                  <div
                    className={`payment-card p-6 rounded-xl ${
                      formData.payment_method === 'zelle' ? 'selected' : ''
                    }`}
                    onClick={() => setFormData({...formData, payment_method: 'zelle'})}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">🏦</div>
                      <div>
                        <h3 className="text-xl font-semibold text-golden-brown">Zelle</h3>
                        <p className="text-gray-600">Transferencia bancaria</p>
                        <p className="text-lg font-semibold text-golden-brown">$50.00 USD</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-400"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-primary px-8 py-3 rounded-full font-semibold"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="fade-in-up">
                <h2 className="text-2xl font-semibold text-golden-brown mb-6 text-center">
                  Confirmar reserva
                </h2>
                
                <div className="bg-soft-pink p-6 rounded-xl mb-8">
                  <h3 className="text-xl font-semibold text-golden-brown mb-4">
                    Resumen de tu cita:
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Fecha:</strong> {selectedDate?.toLocaleDateString('es-ES')}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <p><strong>Nombre:</strong> {formData.full_name}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>WhatsApp:</strong> {formData.whatsapp}</p>
                    <p><strong>Método de pago:</strong> {formData.payment_method === 'paypal' ? 'PayPal' : 'Zelle'}</p>
                    <p><strong>Costo:</strong> $50.00 USD</p>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600 mb-8">
                  <p>Al confirmar, recibirás un email con los detalles de tu cita.</p>
                  <p>Liz se contactará contigo por WhatsApp en la hora programada.</p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-400"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary px-8 py-3 rounded-full font-semibold disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="loading-spinner"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      'Confirmar y Pagar'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;