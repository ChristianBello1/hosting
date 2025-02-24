// src/pages/AdminRegistrationPage.jsx
import { useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';

const validateForm = (formData) => {
  const errors = [];
  
  if (formData.name.length < 2 || formData.name.length > 50) {
    errors.push('Il nome deve essere tra 2 e 50 caratteri');
  }

  if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Email non valida');
  }

  if (formData.password.length < 6) {
    errors.push('La password deve essere di almeno 6 caratteri');
  }

  if (!formData.password.match(/^(?=.*[A-Za-z])(?=.*\d)/)) {
    errors.push('La password deve contenere almeno una lettera e un numero');
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push('Le password non corrispondono');
  }

  return errors;
};

const AdminRegistrationPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validazione
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Mostra il primo errore
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Non autorizzato: effettua il login');
        return;
      }

      console.log('Attempting registration with data:', {
        name: formData.name,
        email: formData.email,
        passwordLength: formData.password.length
      });

      const response = await api.post(
        '/api/auth/admin/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Registration response:', response.data);
      setSuccess('Admin registrato con successo');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Registration error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      setError(
        err.response?.data?.message || 
        'Errore durante la registrazione. Verifica i dati inseriti.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Registra Nuovo Admin</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  La password deve:
                  <ul className="list-disc list-inside">
                    <li>Essere di almeno 6 caratteri</li>
                    <li>Contenere almeno una lettera e un numero</li>
                  </ul>
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Conferma Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Registrazione...' : 'Registra Nuovo Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminRegistrationPage;