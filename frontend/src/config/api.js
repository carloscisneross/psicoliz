// API Configuration for Psicoliz
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "https://psicoliz.onrender.com";

// Ensure API URLs are properly formatted
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure we have /api prefix for backend routes
  if (!cleanEndpoint.startsWith('api/')) {
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export the base URL for direct use if needed
export { API_BASE_URL };

// Common API endpoints
export const API_ENDPOINTS = {
  HEALTH: 'health',
  AVAILABLE_SLOTS: 'available-slots',
  PRICING_CONFIG: 'pricing-config',
  ZELLE_CONFIG: 'zelle-config',
  CREATE_PAYPAL_ORDER: 'create-paypal-order',
  CREATE_ZELLE_BOOKING: 'create-zelle-booking',
  UPLOAD_ZELLE_PROOF: 'upload-zelle-proof',
  CONFIRM_PAYPAL_PAYMENT: 'confirm-paypal-payment',
  ADMIN: {
    STATS: 'admin/stats',
    APPOINTMENTS: 'admin/appointments',
    SETTINGS: 'admin/settings',
    SCHEDULE: 'admin/schedule',
    SCHEDULE_WEEKLY: 'admin/schedule/weekly',
    SCHEDULE_CUSTOM: 'admin/schedule/custom'
  }
};