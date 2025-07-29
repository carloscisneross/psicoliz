import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blush-pink floral-bg py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="elegant-card rounded-3xl p-12 text-center fade-in-up">
            <div className="text-6xl mb-6">⏸️</div>
            <h1 className="text-3xl font-elegant font-bold text-golden-brown mb-6">
              Pago cancelado
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Has cancelado el proceso de pago. Tu cita no ha sido reservada.
            </p>
            <p className="text-gray-600 mb-8">
              Si tuviste algún problema con el pago o tienes preguntas, 
              no dudes en contactar a Liz directamente.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/booking')}
                className="btn-primary px-8 py-3 rounded-full font-semibold w-full"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-300 text-gray-700 px-8 py-3 rounded-full font-semibold w-full hover:bg-gray-400"
              >
                Volver al inicio
              </button>
              <a
                href="https://wa.me/584127524463"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors"
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

export default PaymentCancel;