import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  console.error('DEBUG MAIN: Inizio caricamento');
  
  const root = document.getElementById('root');
  console.error('DEBUG MAIN: Root element', root);
  
  if (!root) {
    throw new Error('Elemento root non trovato');
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.error('DEBUG MAIN: Rendering completato');
} catch (error) {
  console.error('ERRORE CRITICO MAIN:', error);
  alert(`Errore critico: ${error.message}`);
}