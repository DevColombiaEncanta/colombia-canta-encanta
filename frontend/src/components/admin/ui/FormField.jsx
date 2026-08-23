import HelpTooltip from './HelpTooltip';

// Envoltorio genérico: etiqueta en mayúscula chica arriba + lo que sea que se
// le pase adentro (input, textarea, select...) + mensaje de error opcional.
// La etiqueta ENVUELVE el control (asociación implícita, sin necesitar que
// cada campo declare su propio id) — un solo componente para todos los tipos
// de campo, en vez de uno por tipo. `ayuda`/`ayudaEjemplo` son opcionales
// (aditivo, no cambia nada para los usos ya existentes que no los pasan) —
// agregan el mismo ícono "?" que ya usan pills/zonas/testimonios, para no
// repetir ese `<HelpTooltip>` a mano en cada campo que lo necesite.
export default function FormField({ label, hint, ayuda, ayudaEjemplo, error, children, className = '' }) {
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
        {children}
      </label>
      {error && <span className="admin-field-error" role="alert">{error}</span>}
    </div>
  );
}
