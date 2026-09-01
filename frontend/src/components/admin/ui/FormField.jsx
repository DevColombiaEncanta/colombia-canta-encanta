import { cloneElement, isValidElement, useId } from 'react';
import HelpTooltip from './HelpTooltip';

// Envoltorio genérico: etiqueta en mayúscula chica arriba + lo que sea que se
// le pase adentro (input, textarea, select...) + mensaje de error opcional.
// La etiqueta ENVUELVE el control (asociación implícita, sin necesitar que
// cada campo declare su propio id) — un solo componente para todos los tipos
// de campo, en vez de uno por tipo. `ayuda`/`ayudaEjemplo` son opcionales
// (aditivo, no cambia nada para los usos ya existentes que no los pasan) —
// agregan el mismo ícono "?" que ya usan pills/zonas/testimonios, para no
// repetir ese `<HelpTooltip>` a mano en cada campo que lo necesite.
//
// ⭐ Hallazgo real (auditoría general de Fase 5, 2026-08-31): el mensaje de
// error se anunciaba una vez (`role="alert"`) pero sin `aria-invalid`/
// `aria-describedby` que lo asociaran al campo — un lector de pantalla que
// vuelve a enfocar el input después no se entera de que sigue inválido ni por
// qué. Se resuelve acá, en el componente compartido, en vez de repetirlo a
// mano en las 78 llamadas que ya existen en el panel: cuando `children` es un
// único elemento nativo (input/select/textarea — no un componente propio ni
// un `<div>` envolviendo varios controles, ver `isValidElement`+`typeof
// children.type === 'string'`), se le inyectan esos 2 atributos sin que el
// llamador tenga que hacer nada. Si `children` no cumple esa forma simple
// (ej. un wrapper con 2 controles adentro), se deja tal cual como antes —
// preferible no envolver mal a arriesgar romper un caso raro.
export default function FormField({ label, hint, ayuda, ayudaEjemplo, error, children, className = '' }) {
  const errorId = useId();
  const puedeConectarAria = isValidElement(children) && typeof children.type === 'string';
  const control = puedeConectarAria
    ? cloneElement(children, {
        'aria-invalid': !!error,
        'aria-describedby': error ? errorId : children.props['aria-describedby'],
      })
    : children;

  return (
    <div className={`admin-field ${className}`.trim()}>
      <label className="admin-field-label">
        {label && (
          <span className="admin-field-label-texto">
            {label}
            {hint && <span className="admin-field-hint"> ({hint})</span>}
            {ayuda && <HelpTooltip texto={ayuda} ejemplo={ayudaEjemplo} />}
          </span>
        )}
        {control}
      </label>
      {error && <span id={errorId} className="admin-field-error" role="alert">{error}</span>}
    </div>
  );
}
