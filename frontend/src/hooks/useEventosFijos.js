import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useEventosFijos() {
  const [eventosFijos, setEventosFijos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/eventos-fijos')
      .then((body) => { if (!cancelado) setEventosFijos(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { eventosFijos, cargando, error };
}
