import { useId, useState } from 'react';

// Icono "?" con mensaje de ayuda para campos cuyo formato no es obvio para
// alguien no técnico (ej. escribir una ruta interna como "/eventos" en vez de
// una URL completa). Se abre con mouse encima O con foco de teclado — y
// también con un toque, porque en tablet/celular (sin mouse) el hover nunca
// ocurre, así que depender solo de CSS :hover lo dejaría inaccesible ahí.
export default function HelpTooltip({ texto, ejemplo }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();

  return (
    <span className="admin-ayuda">
      <button
        type="button"
        className="admin-ayuda-icono"
        aria-describedby={id}
        aria-expanded={abierto}
        aria-label="Ayuda sobre este campo"
        onClick={() => setAbierto((v) => !v)}
        onBlur={() => setAbierto(false)}
      >
        ?
      </button>
      <span id={id} role="tooltip" className={`admin-ayuda-globo${abierto ? ' abierto' : ''}`}>
        {texto}
        {ejemplo && (
          <>
            <br />
            <strong>Ejemplo:</strong> {ejemplo}
          </>
        )}
      </span>
    </span>
  );
}
