// src/api/axios.js
import axios from 'axios';

// Modifica: URL predefinito per la versione demo
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cliente-demo.onrender.com';

console.log('API Configuration (DEMO):', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  currentPath: window.location.pathname
});

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    console.log('Outgoing request:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: config.headers
    });

    // Add token if exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Commentiamo il test di connessione all'avvio per evitare errori inutili durante lo sviluppo
// instance.get('/api/health')
//   .then(response => console.log('API Health check successful:', response.data))
//   .catch(error => console.error('API Health check failed:', error));

export default instance;