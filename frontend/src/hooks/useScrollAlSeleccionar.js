import { useEffect, useRef } from 'react';

// Punto 21 (5.4 tercera ronda, pedido explícito del usuario): en mobile la
// lista y el formulario quedan apilados en 1 columna (mismo breakpoint que ya
// usa el CSS de estos 3 paneles — Productos.css/Eventos.css/Noticias.css,
// `@media (max-width: 1024px)`) — al crear o elegir un ítem para editar, el
// formulario aparece MÁS ABAJO de la lista, fuera de la pantalla, sin ningún
// indicio visual de que ya se abrió. Este hook hace scroll automático al
// panel del formulario cuando cambia la selección, pero solo en mobile/tablet
// (en desktop los 2 paneles ya están uno al lado del otro — scrollear ahí
// sería un salto raro e innecesario).
// ⭐ Hallazgo real (5.5, 2026-08-19, reproducido con Playwright): el panel del
// formulario vive detrás de `{!cargando && (...)}` en las 5 pantallas que usan
// este hook — si se selecciona algo (ej. "+ Nuevo curso") ANTES de que termine
// de cargar la lista, `panelRef.current` todavía es `null` (el panel ni existe
// en el DOM) y el scroll no hace nada, en silencio, sin volver a intentarlo
// cuando el panel por fin aparece. `listo` (default `true`, aditivo — no rompe
// nada para quien no lo pase) deja que quien llama avise cuándo el panel ya
// está montado de verdad, para que el efecto reintente en ese momento.
export function useScrollAlSeleccionar(seleccionadoId, listo = true) {
  const panelRef = useRef(null);
  const primerRenderRef = useRef(true);

  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false;
      return;
    }
    if (seleccionadoId === undefined || !listo) return; // volvió al estado vacío, o el panel todavía no existe
    if (window.matchMedia('(max-width: 1024px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [seleccionadoId, listo]);

  return panelRef;
}
