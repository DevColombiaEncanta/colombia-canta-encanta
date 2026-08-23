import { useEffect, useState } from 'react';

// ⭐ Hallazgo real (2026-08-16, encontrado construyendo ImageCropModal.jsx,
// pero afectaba por igual a ImageUploadField/GaleriaUploadField desde 5.2 —
// solo se notó ahora porque el modal de recorte sí tiene un `onError` que lo
// hace visible). El patrón de siempre (`useMemo(() => URL.createObjectURL(archivo))`
// + un `useEffect` de limpieza aparte que revoca esa misma URL memoizada) se
// rompe con el doble-efecto de React StrictMode en desarrollo (mount →
// cleanup → mount, a propósito, para encontrar efectos no idempotentes):
// como las 2 pasadas leen la MISMA URL memoizada, el cleanup del mount
// fantasma revoca la URL que el mount real todavía necesita — el navegador
// intenta cargarla después y falla con `net::ERR_FILE_NOT_FOUND`. La imagen
// de portada de Hero/Noticias/Eventos podía fallar en cargar de forma
// intermitente por esto, en silencio (sin `onError`, se veía como un espacio
// vacío, fácil de no notar).
//
// Corrección: crear la URL DENTRO del mismo efecto que la revoca, no en un
// `useMemo` aparte — así cada pasada de StrictMode genera su propia URL; la
// del mount fantasma se revoca sin que nadie llegue a usarla, la del mount
// real queda intacta hasta el próximo cambio real o el desmontaje.
export function useObjectUrl(archivo) {
  const [url, setUrl] = useState(null);

  // `URL.createObjectURL` es un efecto real sobre un sistema externo (el
  // registro de blobs del navegador) — no hay forma de derivarlo durante el
  // render. Reflejar el handle resultante (o su ausencia) en estado es
  // exactamente el caso que la propia regla dice que está bien ("update...
  // calling setState... when external state changes"), no un atajo.
  useEffect(() => {
    if (!archivo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(null);
      return;
    }
    const nuevaUrl = URL.createObjectURL(archivo);
    setUrl(nuevaUrl);
    return () => URL.revokeObjectURL(nuevaUrl);
  }, [archivo]);

  return url;
}

// Misma idea, para una lista de archivos (galerías) en vez de uno solo.
export function useObjectUrls(archivos) {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const nuevas = archivos.map((a) => URL.createObjectURL(a));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(nuevas);
    return () => { nuevas.forEach((u) => URL.revokeObjectURL(u)); };
  }, [archivos]);

  return urls;
}
