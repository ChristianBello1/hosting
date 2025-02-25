// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [demoToken, setDemoToken] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/api/auth/forgot-password', { email });
      setStatus({
        type: 'success',
        message: 'Se questa email è associata a un account, riceverai le istruzioni per reimpostare la password.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Si è verificato un errore. Riprova più tardi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoReset = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/api/auth/demo-forgot-password', { email: email || 'demo@example.com' });
      setStatus({
        type: 'success',
        message: 'Demo: Token di reset generato con successo.'
      });
      setDemoToken(response.data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Errore nella demo di reset password.'
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateToReset = () => {
    navigate(`/reset-password/${demoToken.resetToken}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recupera password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Inserisci la tua email per ricevere le istruzioni
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {status.message && (
              <div className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Invio in corso...' : 'Invia istruzioni'}
              </button>
            </div>

            {/* Demo Banner */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Modalità Demo: In un ambiente reale, il token di reset sarebbe inviato via email.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleDemoReset}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Demo: Genera token di reset
              </button>
            </div>

            {demoToken && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">Demo: Token di reset generato</h4>
                <p className="mt-1 text-xs text-gray-500 break-all">{demoToken.resetToken}</p>
                <button
                  type="button"
                  onClick={navigateToReset}
                  className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Vai alla pagina di reset password
                </button>
              </div>
            )}

            <div className="text-sm text-center">
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Torna al login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;