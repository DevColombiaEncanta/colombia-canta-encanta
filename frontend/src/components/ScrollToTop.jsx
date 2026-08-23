import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Espera a que el DOM renderice la nueva página antes de hacer scroll
      const timer = setTimeout(() => {
        // ⭐ Hallazgo real (2026-08-20, probado con un link de invitación real
        // de Supabase, ver Bienvenida.jsx): con `HashRouter`, un link que trae
        // su propio fragmento después del de la ruta (ej. `#access_token=...`)
        // llega acá como si fuera un ancla a la que hacer scroll — pero no es
        // un selector CSS válido, y `querySelector` tira una excepción en vez
        // de simplemente no encontrar nada.
        try {
          const el = document.querySelector(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch {
          // No era un ancla real — nada que scrollear.
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}
