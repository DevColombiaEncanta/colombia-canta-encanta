import { useEffect, useRef } from 'react';
import Button from './Button';

// ⭐ Hallazgo real (revisión crítica 5.2, 2026-08-15): un `alertdialog` que se
// abre para confirmar una acción DESTRUCTIVA (borrar) sin mover el foco hacia
// adentro deja a alguien navegando por teclado exactamente donde estaba —
// tendría que tabular manualmente a través de todo el resto del formulario
// para encontrar los botones del diálogo. Se enfoca "Cancelar" (la opción
// seguridad) apenas se abre, y Escape lo cierra — mismo criterio que
// cualquier diálogo modal estándar (WAI-ARIA Dialog Pattern).
// `advertencia` (opcional, 2026-08-17): para borrados con consecuencias más
// amplias que "esta fila puntual" (ej. borrar una colección que varios
// productos podrían estar usando) — un banner con ícono, más notorio que el
// texto plano del mensaje normal. Aditivo: sin este prop, el diálogo se ve
// exactamente igual que antes.
// `textoConfirmar`/`textoConfirmando` (opcional, 5.7): este diálogo nació para
// borrados ("Sí, borrar"/"Borrando…" fijos), pero 5.7 lo reutiliza para
// acciones que no borran nada (desactivar/reactivar un admin, resetear su
// MFA) — mostrar "Sí, borrar" ahí sería confuso y directamente incorrecto.
// Default igual al de siempre, así los ~15 usos existentes no cambian.
export default function ConfirmDialog({
  abierto, titulo, mensaje, advertencia, onConfirmar, onCancelar, confirmando,
  textoConfirmar = 'Sí, borrar', textoConfirmando = 'Borrando…',
}) {
  const cancelarRef = useRef(null);

  useEffect(() => {
    if (abierto) cancelarRef.current?.focus();
  }, [abierto]);

  if (!abierto) return null;

  function manejarTecla(e) {
    if (e.key === 'Escape' && !confirmando) onCancelar();
  }

  return (
    <div className="admin-dialog-fondo" onClick={onCancelar}>
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTecla}
      >
        <h3 id="admin-dialog-titulo">{titulo}</h3>
        {advertencia && (
          <p className="admin-dialog-advertencia" role="alert">
            <span aria-hidden="true">⚠️</span> {advertencia}
          </p>
        )}
        <p>{mensaje}</p>
        <div className="admin-dialog-acciones">
          <Button ref={cancelarRef} type="button" variant="secundario" onClick={onCancelar} disabled={confirmando}>Cancelar</Button>
          <Button type="button" variant="peligro" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? textoConfirmando : textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
