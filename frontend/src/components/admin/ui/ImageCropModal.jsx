import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { useObjectUrl } from '../../../hooks/useObjectUrl';

// 2026-08-16 · Pedido del usuario: el backend nunca recorta una imagen
// (`procesarYSubirImagen` solo redimensiona el ancho, preserva la
// proporción tal cual se subió) — el recorte final lo hace el CSS del sitio
// público con `object-fit: cover`, centrado siempre. Si la foto elegida no
// tiene la proporción ideal de esa sección, algo importante puede quedar
// cortado sin que el admin se entere hasta después. Este diálogo deja
// elegir QUÉ parte de la foto se ve (arrastrar + zoom) antes de subirla —
// todo pasa acá, en el navegador; lo que sale de "Listo" ya es la foto
// final recortada, no hace falta tocar el backend ni el sitio público.
//
// Matemática del recorte (mismo criterio que `object-fit: cover`):
// - `escalaCover` es el zoom mínimo para que la foto cubra el marco entero
//   sin dejar huecos — es el punto de partida (zoom = 1 en la UI).
// - el arrastre mueve un offset en píxeles de pantalla, siempre encerrado
//   (`clamp`) para que la foto nunca deje un hueco visible en el marco.
// - al confirmar, se traduce el marco visible (posición + tamaño en
//   pantalla) a coordenadas reales de la imagen original, y se dibuja ese
//   rectángulo en un canvas — ese es el archivo final.
const ANCHO_MARCO_MAX = 360;

// Punto 20 (5.4 tercera ronda) — bug confirmado: el marco usaba `ANCHO_MARCO`
// fijo en 360px sin ningún ajuste al viewport, así que en una pantalla angosta
// de verdad (320-375px) se cortaba contra el borde del diálogo. `MARGEN_DIALOGO`
// es la suma de paddings alrededor del marco que hay que descontar del ancho de
// pantalla disponible: `.admin-dialog-fondo` (20px de cada lado) + `.admin-dialog`
// (28px de cada lado) — si esos valores cambian en AdminUI.css, este número
// también hay que ajustarlo.
const MARGEN_DIALOGO = 2 * (20 + 28);
const ANCHO_MARCO_MIN = 220; // nunca un marco tan chico que el recorte deje de ser usable

function calcularAnchoMarco() {
  if (typeof window === 'undefined') return ANCHO_MARCO_MAX;
  return Math.max(ANCHO_MARCO_MIN, Math.min(ANCHO_MARCO_MAX, window.innerWidth - MARGEN_DIALOGO));
}

export default function ImageCropModal({ archivo, aspecto, progreso, onListo, onCancelar }) {
  const imgRef = useRef(null);
  const marcoRef = useRef(null);
  const arrastreRef = useRef(null);
  const [imagenLista, setImagenLista] = useState(false);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [anchoMarco, setAnchoMarco] = useState(calcularAnchoMarco);
  const cancelarRef = useRef(null);

  useEffect(() => {
    function onResize() { setAnchoMarco(calcularAnchoMarco()); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const altoMarco = Math.round(anchoMarco / aspecto);

  // Ver hooks/useObjectUrl.js — hallazgo real, 2026-08-16.
  const urlObjeto = useObjectUrl(archivo);

  useEffect(() => {
    cancelarRef.current?.focus();
  }, []);

  function manejarTecla(e) {
    if (e.key === 'Escape') onCancelar();
  }

  const escalaCover = natural.w > 0 ? Math.max(anchoMarco / natural.w, altoMarco / natural.h) : 1;
  const escala = escalaCover * zoom;
  const dispW = natural.w * escala;
  const dispH = natural.h * escala;

  function clamp(o, dW, dH) {
    const minX = anchoMarco - dW;
    const minY = altoMarco - dH;
    return {
      x: Math.min(0, Math.max(minX, o.x)),
      y: Math.min(0, Math.max(minY, o.y)),
    };
  }

  function onImgCargada(e) {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setNatural({ w, h });
    const coverInicial = Math.max(anchoMarco / w, altoMarco / h);
    // Centrado apenas carga, mismo resultado visual que el `object-fit:
    // cover` de hoy — el admin arranca viendo lo mismo que vería sin este
    // diálogo, y desde ahí decide si mover o hacer zoom.
    setOffset({ x: (anchoMarco - w * coverInicial) / 2, y: (altoMarco - h * coverInicial) / 2 });
    setImagenLista(true);
  }

  function iniciarArrastre(e) {
    e.preventDefault();
    // Pointer Events unifica mouse/touch/lápiz — no hace falta distinguir.
    arrastreRef.current = { startX: e.clientX, startY: e.clientY, offsetInicial: offset };
    window.addEventListener('pointermove', moverArrastre);
    window.addEventListener('pointerup', terminarArrastre);
  }

  function moverArrastre(e) {
    if (!arrastreRef.current) return;
    const dx = e.clientX - arrastreRef.current.startX;
    const dy = e.clientY - arrastreRef.current.startY;
    const nuevo = {
      x: arrastreRef.current.offsetInicial.x + dx,
      y: arrastreRef.current.offsetInicial.y + dy,
    };
    setOffset(clamp(nuevo, dispW, dispH));
  }

  function terminarArrastre() {
    arrastreRef.current = null;
    window.removeEventListener('pointermove', moverArrastre);
    window.removeEventListener('pointerup', terminarArrastre);
  }

  function cambiarZoom(nuevoZoom) {
    const nuevaEscala = escalaCover * nuevoZoom;
    const nuevoDispW = natural.w * nuevaEscala;
    const nuevoDispH = natural.h * nuevaEscala;
    setZoom(nuevoZoom);
    setOffset((o) => clamp(o, nuevoDispW, nuevoDispH));
  }

  function confirmar() {
    // El marco visible, traducido a píxeles reales de la foto original.
    const sx = -offset.x / escala;
    const sy = -offset.y / escala;
    const sw = anchoMarco / escala;
    const sh = altoMarco / escala;

    const canvas = document.createElement('canvas');
    // Se recorta a la resolución real (sin agrandar de más) — el backend ya
    // redimensiona/recomprime lo que haga falta al subir.
    const salidaAncho = Math.min(1600, Math.round(sw));
    canvas.width = salidaAncho;
    canvas.height = Math.round(salidaAncho / aspecto);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) { onListo(archivo); return; }
      const recortado = new File([blob], archivo.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
      onListo(recortado);
    }, 'image/jpeg', 0.92);
  }

  return (
    <div className="admin-dialog-fondo" onClick={onCancelar}>
      <div
        className="admin-dialog admin-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-crop-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTecla}
      >
        <h3 id="admin-crop-titulo">Ajustar foto{progreso ? ` (${progreso})` : ''}</h3>
        <p>Arrastra para mover, usa el control para acercar. Así se va a ver en el sitio.</p>

        {error ? (
          <p className="admin-page-error">No se pudo previsualizar la foto para recortar — se va a subir tal cual.</p>
        ) : (
          <div
            ref={marcoRef}
            className="admin-crop-marco"
            style={{ width: anchoMarco, height: altoMarco }}
            onPointerDown={iniciarArrastre}
          >
            {/* `urlObjeto` empieza en null hasta que el hook la crea (un
               render después de montar) — recién ahí se monta el <img>, para
               no dispararle un `onError` falso con `src` vacío. */}
            {urlObjeto && (
              <img
                ref={imgRef}
                src={urlObjeto}
                alt=""
                draggable={false}
                onLoad={onImgCargada}
                onError={() => setError(true)}
                style={imagenLista ? {
                  width: natural.w,
                  height: natural.h,
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${escala})`,
                  transformOrigin: '0 0',
                } : { opacity: 0 }}
              />
            )}
          </div>
        )}

        {imagenLista && !error && (
          <div className="admin-crop-zoom">
            <span aria-hidden="true">🔍</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => cambiarZoom(Number(e.target.value))}
            />
          </div>
        )}

        <div className="admin-dialog-acciones">
          {/* ⭐ Hallazgo real (auditoría 5.4, 2026-08-17): a estos 2 botones les
             faltaba `type="button"` — un `<button>` sin `type` explícito
             dentro de un `<form>` es `type="submit"` por defecto del
             navegador. Este diálogo se monta DENTRO del `<form>` del panel
             que lo abre (vía ImageUploadField/GaleriaUploadField, que son
             campos normales del formulario, no un portal aparte) — así que
             hacer clic en "Listo" enviaba el formulario completo de una vez,
             con lo que hubiera en ese momento (campos llenados después de
             subir la foto quedaban afuera). Pasó desapercibido antes porque
             en los flujos ya probados la foto siempre se subía última, con
             todo lo demás ya completo — acá se hizo evidente con un campo
             (stock de una variante) que se llenaba después de la foto. */}
          <Button ref={cancelarRef} type="button" variant="secundario" onClick={onCancelar}>Cancelar</Button>
          <Button type="button" onClick={error ? () => onListo(archivo) : confirmar} disabled={!imagenLista && !error}>
            {error ? 'Usar tal cual' : 'Listo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
