import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/eventos')
      .then((body) => { if (!cancelado) setEventos(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { eventos, cargando, error };
}
