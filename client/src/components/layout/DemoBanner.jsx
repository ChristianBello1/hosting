// src/components/layout/DemoBanner.jsx
import { useState } from 'react';

const DemoBanner = () => {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className={`fixed ${minimized ? 'bottom-0 right-0 w-auto' : 'bottom-0 left-0 right-0 w-full'} bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-2 px-4 z-50 transition-all duration-300`}>
      {minimized ? (
        <button 
          onClick={() => setMinimized(false)}
          className="flex items-center text-sm font-medium"
        >
          <span className="bg-white text-indigo-600 rounded-full h-6 w-6 flex items-center justify-center mr-1">
            i
          </span>
          Demo
        </button>
      ) : (
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <span className="bg-white text-indigo-600 rounded-full h-6 w-6 flex items-center justify-center mr-2">
              i
            </span>
            <div>
              <p className="font-medium">
                Modalità Demo - I dati vengono resettati ogni 24 ore
              </p>
              <p className="text-sm">
                Accedi con: <span className="font-bold">demo@example.com</span> / <span className="font-bold">demo123</span> | 
                <span className="ml-2">Per testare il reset password, usa l'opzione "Demo" nella pagina Recupero Password</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMinimized(true)}
            className="ml-4 bg-white bg-opacity-20 rounded-full h-6 w-6 flex items-center justify-center"
          >
            −
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;