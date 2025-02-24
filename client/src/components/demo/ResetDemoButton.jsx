// src/components/demo/ResetDemoButton.jsx
import { useState } from 'react';
import api from '../../api/axios';

const ResetDemoButton = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);

  const handleReset = async () => {
    if (!confirm('Sei sicuro di voler ripristinare i dati demo? Questa azione cancellerà tutti i clienti e gli alert.')) {
      return;
    }
    
    setIsResetting(true);
    setResetStatus(null);
    
    try {
      const response = await api.post('/api/reset-demo');
      setResetStatus({
        success: true,
        message: 'I dati demo sono stati ripristinati con successo!'
      });
      
      // Aggiorna la pagina dopo 2 secondi
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setResetStatus({
        success: false,
        message: 'Errore durante il ripristino dei dati demo.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleReset}
        disabled={isResetting}
        className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isResetting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ripristino in corso...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ripristina dati demo
          </>
        )}
      </button>
      
      {resetStatus && (
        <div className={`mt-2 p-2 text-sm rounded ${resetStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {resetStatus.message}
        </div>
      )}
    </div>
  );
};

export default ResetDemoButton;