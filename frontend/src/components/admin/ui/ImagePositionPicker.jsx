import { useRef, useState } from 'react';

// 2026-08-31 · Pedido del usuario: distinto de `ImageCropModal.jsx` (que
// recorta la foto de verdad antes de subirla, para secciones que usan
// `object-fit: cover`) — Hero usa `object-fit: contain` (nunca recorta,
// muestra la foto completa con barras) a propósito, así que acá no hace
// falta cortar nada, solo dejar elegir qué parte de la foto queda centrada
// dentro del espacio disponible (equivalente a `object-position`). Se guarda
// como 2 números (0-100) en la fila, no en el archivo — se puede reajustar
// después sin volver a subir la imagen.
const ANCHO_PREVIEW = 320;
const ALTO_PREVIEW = 140; // aproxima la proporción real del carrusel (clamp 360-620px de alto sobre ~50% del ancho)
const PASO_TECLADO = 5;
const PASO_TECLADO_SHIFT = 20;

function clamp01a100(v) {
  return Math.min(100, Math.max(0, v));
}

export default function ImagePositionPicker({ imagenUrl, x, y, onChange }) {
  const marcoRef = useRef(null);
  const arrastreRef = useRef(null);
  // ⭐ Hallazgo real (probado con Playwright, no a simple vista): al soltar el
  // mouse justo después de arrastrar, el navegador podía sintetizar un click
  // sobre "Centrar" (el control más cercano al marco) aunque el cursor nunca
  // lo hubiera tocado — reproducido de forma consistente arrastrando y
  // confirmando con un stack trace real que el onClick de "Centrar" se
  // disparaba en el mismo mouseup del arrastre. En vez de perseguir la causa
  // exacta del navegador, se lo bloquea directamente: mientras hay un
  // arrastre en curso (o recién termina), "Centrar" queda deshabilitado.
  const [arrastrando, setArrastrando] = useState(false);

  if (!imagenUrl) return null;

  function iniciarArrastre(e) {
    e.preventDefault();
    // Mismo hallazgo real que ImageCropModal.jsx (2026-08-28): preventDefault
    // en pointerdown también le impide al navegador dar foco por default.
    marcoRef.current?.focus();
    setArrastrando(true);
    arrastreRef.current = { startX: e.clientX, startY: e.clientY, xInicial: x, yInicial: y };
    window.addEventListener('pointermove', moverArrastre);
    window.addEventListener('pointerup', terminarArrastre);
  }

  function moverArrastre(e) {
    if (!arrastreRef.current) return;
    const { startX, startY, xInicial, yInicial } = arrastreRef.current;
    const dx = ((e.clientX - startX) / ANCHO_PREVIEW) * 100;
    const dy = ((e.clientY - startY) / ALTO_PREVIEW) * 100;
    onChange(clamp01a100(xInicial + dx), clamp01a100(yInicial + dy));
  }

  function terminarArrastre() {
    arrastreRef.current = null;
    window.removeEventListener('pointermove', moverArrastre);
    window.removeEventListener('pointerup', terminarArrastre);
    // Un tick después del mouseup real (no en el mismo evento) — es
    // justo esa ventana la que el navegador podía usar para el click
    // fantasma sobre "Centrar".
    setTimeout(() => setArrastrando(false), 0);
  }

  // Accesibilidad (mismo criterio que ImageCropModal.jsx, 2026-08-28): las
  // flechas mueven la foto en la misma dirección que arrastrarla a mano, con
  // Shift para un paso más grande.
  function manejarTecla(e) {
    const paso = e.shiftKey ? PASO_TECLADO_SHIFT : PASO_TECLADO;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -paso;
    else if (e.key === 'ArrowRight') dx = paso;
    else if (e.key === 'ArrowUp') dy = -paso;
    else if (e.key === 'ArrowDown') dy = paso;
    else return;
    e.preventDefault();
    onChange(clamp01a100(x + dx), clamp01a100(y + dy));
  }

  return (
    <div className="admin-posicion-picker">
      <div
        ref={marcoRef}
        className="admin-posicion-marco"
        style={{ width: ANCHO_PREVIEW, height: ALTO_PREVIEW }}
        onPointerDown={iniciarArrastre}
        tabIndex={0}
        role="group"
        aria-label="Posición de la foto dentro del carrusel. Usa las flechas del teclado para moverla."
        onKeyDown={manejarTecla}
      >
        <img
          src={imagenUrl}
          alt=""
          draggable={false}
          className="admin-posicion-img"
          style={{ objectPosition: `${x}% ${y}%` }}
        />
      </div>
      <button type="button" className="admin-posicion-centrar" onClick={() => onChange(50, 50)} disabled={arrastrando}>
        Centrar
      </button>
    </div>
  );
}
