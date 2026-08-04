import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useHero() {
  const [slides, setSlides] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/hero')
      .then((body) => { if (!cancelado) setSlides(body.slides); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { slides, cargando, error };
}
