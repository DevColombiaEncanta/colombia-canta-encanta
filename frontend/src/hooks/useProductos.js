import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/productos')
      .then((body) => { if (!cancelado) setProductos(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { productos, cargando, error };
}
