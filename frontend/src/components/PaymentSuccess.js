import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentId = searchParams.get('paymentId');
        const payerId = searchParams.get('PayerID');
        const bookingId = searchParams.get('booking_id');

        if (paymentId && payerId && bookingId) {
          await axios.post(`${backendUrl}/api/confirm-paypal-payment`, {
            payment_id: paymentId,
            payer_id: payerId,
            booking_id: bookingId
          });
          setSuccess(true);
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [searchParams, backendUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blush-pink floral-bg flex items-center justify-center">
        <div className="elegant-card rounded-3xl p-12 text-center max-w-md">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-golden-brown font-semibold">
            Confirmando tu pago...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blush-pink floral-bg py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="elegant-card rounded-3xl p-12 text-center fade-in-up">
            {success ? (
              <>
                <div className="text-6xl mb-6">✅</div>
                <h1 className="text-3xl font-elegant font-bold text-golden-brown mb-6">
                  ¡Cita confirmada!
                </h1>
                <div className="bg-soft-pink p-6 rounded-xl mb-8">
                  <p className="text-lg text-gray-700 mb-4">
                    Tu pago ha sido procesado exitosamente y tu cita ha sido confirmada.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Recibirás un email de confirmación con todos los detalles de tu cita.
                  </p>
                  <p className="text-golden-brown font-semibold">
                    📱 Liz se contactará contigo por WhatsApp en la hora de tu cita.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary px-8 py-3 rounded-full font-semibold w-full"
                  >
                    Volver al inicio
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">❌</div>
                <h1 className="text-3xl font-elegant font-bold text-red-600 mb-6">
                  Error en el pago
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                  Hubo un problema al confirmar tu pago. Por favor, intenta nuevamente o 
                  contacta a Liz directamente por WhatsApp.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/booking')}
                    className="btn-primary px-8 py-3 rounded-full font-semibold w-full"
                  >
                    Intentar de nuevo
                  </button>
                  <a
                    href="https://wa.me/584127524463"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors"
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;