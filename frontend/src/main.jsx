import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Elimina el splash del DOM tras que termina la animación de fade-out (1.6s + 0.6s)
setTimeout(() => {
  const splash = document.getElementById('splash');
  if (splash) splash.remove();
}, 2300);
