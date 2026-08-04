import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/noticias')
      .then((body) => { if (!cancelado) setNoticias(body.noticias); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { noticias, cargando, error };
}
