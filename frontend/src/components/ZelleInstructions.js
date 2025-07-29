import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ZelleInstructions = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [zelleConfig, setZelleConfig] = useState({ zelle_email: 'psicolizparra@gmail.com', amount: '$50.00' });

  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  // Load Zelle configuration
  useEffect(() => {
    const loadZelleConfig = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/zelle-config`);
        setZelleConfig(response.data);
      } catch (error) {
        console.error('Error loading Zelle config:', error);
        // Use default values if API fails
      }
    };
    loadZelleConfig();
  }, [backendUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen (JPG, PNG, etc.)');
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Máximo 5MB.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Por favor selecciona una imagen del comprobante');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('file', file);

      await axios.post(`${backendUrl}/api/upload-zelle-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo. Por favor intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-blush-pink floral-bg py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="elegant-card rounded-3xl p-12 text-center fade-in-up">
              <div className="text-6xl mb-6">✅</div>
              <h1 className="text-3xl font-elegant font-bold text-golden-brown mb-6">
                ¡Comprobante recibido!
              </h1>
              <div className="bg-soft-pink p-6 rounded-xl mb-8">
                <p className="text-lg text-gray-700 mb-4">
                  Tu comprobante de pago ha sido enviado exitosamente.
                </p>
                <p className="text-gray-700 mb-4">
                  Recibirás un email de confirmación con todos los detalles de tu cita.
                </p>
                <p className="text-golden-brown font-semibold">
                  📱 Liz se contactará contigo por WhatsApp en la hora de tu cita.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="btn-primary px-8 py-3 rounded-full font-semibold w-full"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush-pink floral-bg py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="elegant-card rounded-3xl p-8 fade-in-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-elegant font-bold text-golden-brown mb-4">
                Instrucciones de Pago Zelle
              </h1>
              <p className="text-gray-600">
                Completa tu pago siguiendo estos pasos:
              </p>
            </div>

            {/* Step 1: Payment Instructions */}
            <div className="bg-soft-pink p-6 rounded-xl mb-8">
              <h2 className="text-xl font-semibold text-golden-brown mb-4 flex items-center">
                <span className="bg-golden-brown text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
                Realiza el pago por Zelle
              </h2>
              <div className="ml-11 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="bg-white px-3 py-1 rounded-lg border font-mono">
                    {zelleConfig.zelle_email}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">Monto:</span>
                  <span className="bg-white px-3 py-1 rounded-lg border font-bold text-golden-brown">
                    {zelleConfig.amount} USD
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-700">Concepto:</span>
                  <span className="bg-white px-3 py-1 rounded-lg border">
                    Consulta psicológica - {bookingId?.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Upload Proof */}
            <div className="bg-white p-6 rounded-xl border-2 border-golden-brown border-opacity-20 mb-8">
              <h2 className="text-xl font-semibold text-golden-brown mb-4 flex items-center">
                <span className="bg-golden-brown text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
                Sube tu comprobante
              </h2>
              <div className="ml-11">
                <p className="text-gray-600 mb-4">
                  Toma una captura de pantalla o foto del comprobante de tu transferencia Zelle
                </p>
                <div className="border-2 border-dashed border-golden-brown border-opacity-30 rounded-xl p-6 text-center">
                  {file ? (
                    <div className="space-y-4">
                      <div className="text-green-600 text-lg">
                        ✓ Archivo seleccionado: {file.name}
                      </div>
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="max-w-full max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Cambiar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-4xl">📷</div>
                      <div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <span className="bg-golden-brown text-white px-6 py-3 rounded-full font-semibold hover:bg-warm-brown transition-colors">
                            Seleccionar imagen
                          </span>
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">
                        JPG, PNG, GIF hasta 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-primary px-8 py-4 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Subiendo comprobante...</span>
                  </div>
                ) : (
                  'Enviar comprobante y confirmar cita'
                )}
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 text-center text-sm text-gray-600">
              <p className="mb-2">¿Tienes problemas con el pago?</p>
              <a
                href="https://wa.me/584127524463"
                target="_blank"
                rel="noopener noreferrer"
                className="text-golden-brown hover:text-warm-brown font-semibold"
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZelleInstructions;