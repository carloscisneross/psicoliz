import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blush-pink floral-bg">
      {/* Header */}
      <header className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center fade-in-up">
            {/* Profile Image */}
            <div className="mb-8">
              <img
                src="https://customer-assets.emergentagent.com/job_parra-psico/artifacts/ixqpyybc_IMG_3205.PNG"
                alt="Liz Parra - Psicóloga"
                className="w-48 h-48 rounded-full mx-auto profile-image object-cover"
              />
            </div>

            {/* Title and Info */}
            <div className="mb-12">
              <h1 className="text-5xl font-elegant font-bold text-golden-brown mb-4 floral-accent">
                Atención Psicológica
              </h1>
              <h2 className="text-4xl font-elegant font-semibold text-golden-brown mb-2">
                Liz Parra
              </h2>
              <p className="text-lg text-warm-brown font-medium mb-8">
                FPV: 16.491
              </p>
              
              {/* Main CTA Button */}
              <button
                onClick={() => navigate('/booking')}
                className="btn-primary btn-elegant px-12 py-4 rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300"
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="elegant-card rounded-3xl p-12 fade-in-up">
              <h3 className="text-3xl font-elegant font-bold text-golden-brown mb-8 text-center">
                Bienvenido a tu espacio de bienestar
              </h3>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Como psicóloga profesional con experiencia en diversas áreas de la salud mental, 
                    mi compromiso es brindarte un espacio seguro y confidencial donde puedas 
                    explorar tus emociones y encontrar herramientas para tu crecimiento personal.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Mi enfoque terapéutico se basa en la comprensión integral del ser humano, 
                    adaptándome a las necesidades específicas de cada persona.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-soft-pink rounded-2xl p-8">
                    <h4 className="text-2xl font-semibold text-golden-brown mb-4">
                      Especialidades
                    </h4>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Terapia individual</li>
                      <li>• Manejo de ansiedad y estrés</li>
                      <li>• Procesos de duelo</li>
                      <li>• Desarrollo personal</li>
                      <li>• Terapia de pareja</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-elegant font-bold text-golden-brown mb-12 text-center">
              ¿Cómo funciona?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="elegant-card rounded-2xl p-8 text-center fade-in-up">
                <div className="text-5xl mb-4">📅</div>
                <h4 className="text-xl font-semibold text-golden-brown mb-4">
                  1. Agenda tu cita
                </h4>
                <p className="text-gray-700">
                  Selecciona la fecha y hora que mejor se adapte a tu disponibilidad
                </p>
              </div>
              <div className="elegant-card rounded-2xl p-8 text-center fade-in-up">
                <div className="text-5xl mb-4">💳</div>
                <h4 className="text-xl font-semibold text-golden-brown mb-4">
                  2. Realiza el pago
                </h4>
                <p className="text-gray-700">
                  Paga de forma segura con PayPal o Zelle
                </p>
              </div>
              <div className="elegant-card rounded-2xl p-8 text-center fade-in-up">
                <div className="text-5xl mb-4">💬</div>
                <h4 className="text-xl font-semibold text-golden-brown mb-4">
                  3. Nos conectamos
                </h4>
                <p className="text-gray-700">
                  Te contactaré por WhatsApp en la hora de tu cita
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-golden-brown text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h4 className="text-2xl font-elegant font-bold mb-8">Mantente conectado</h4>
            <div className="flex justify-center space-x-8 mb-8">
              <a
                href="https://instagram.com/psico.liz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white bg-opacity-20 px-6 py-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
              >
                <span className="text-2xl">📱</span>
                <span className="font-medium">@psico.liz</span>
              </a>
              <a
                href="https://wa.me/584127524463"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-white bg-opacity-20 px-6 py-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
              >
                <span className="text-2xl">💬</span>
                <span className="font-medium">+58 412-752-4463</span>
              </a>
            </div>
            <p className="text-white text-opacity-80">
              © 2024 Liz Parra - Psicóloga. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;