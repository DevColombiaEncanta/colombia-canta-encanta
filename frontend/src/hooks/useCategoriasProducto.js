import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useCategoriasProducto() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/categorias-producto')
      .then((body) => { if (!cancelado) setCategorias(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { categorias, cargando, error };
}
