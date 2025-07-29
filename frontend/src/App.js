import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import BookingFlow from './components/BookingFlow';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import ZelleInstructions from './components/ZelleInstructions';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-blush-pink">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/booking" element={<BookingFlow />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/zelle-instructions/:bookingId" element={<ZelleInstructions />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;