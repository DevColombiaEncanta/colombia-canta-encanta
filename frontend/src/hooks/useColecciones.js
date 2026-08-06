import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useColecciones() {
  const [colecciones, setColecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/colecciones')
      .then((body) => { if (!cancelado) setColecciones(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { colecciones, cargando, error };
}
