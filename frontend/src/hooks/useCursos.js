import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function useCursos() {
  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch('/api/cursos')
      .then((body) => { if (!cancelado) setCursos(body.data); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, []);

  return { cursos, cargando, error };
}
