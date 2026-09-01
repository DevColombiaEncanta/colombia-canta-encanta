import { useRef, useState } from 'react';
import ImageCropModal from './ImageCropModal';
import ImagePositionModal from './ImagePositionModal';
import Button from './Button';
import { useObjectUrl } from '../../../hooks/useObjectUrl';

// 5.2 · Subida de imagen con vista previa — reemplaza el campo "URL" del
// diseño de referencia porque el backend exige el archivo real (valida los
// bytes, no una URL pegada). Acepta jpg/png/webp (ver validarImagenReal en el
// backend) y muestra la imagen ya existente si estamos editando algo que ya
// tiene una.
// `recomendado` (ej. "1200×675px, 16:9") es opcional y aditivo — pedido del
// usuario (2026-08-16) para que el admin sepa qué tamaño/proporción le
// conviene subir en CADA sección, en vez de adivinar y terminar con una foto
// recortada de forma rara por el `object-fit: cover` del sitio público. El
// valor real de cada sección se investigó contra el CSS público real (no
// inventado) — ver la nota en `readme_guia.md` con el resumen por sección;
// cualquier campo de imagen nuevo que se agregue debería traer el suyo.
// `aspecto` (número, ancho/alto — ej. 16/9) es opcional: cuando está
// presente, antes de aceptar la foto se abre `ImageCropModal` para elegir
// qué parte se ve, en vez de dejar que el recorte lo decida el `object-fit:
// cover` del sitio público sin que el admin lo vea venir (pedido del
// usuario, 2026-08-16). Sin `aspecto` (ej. el Hero, que nunca recorta) se
// mantiene el comportamiento de siempre.
// `pedirPosicion` (booleano, 2026-08-31, pedido del usuario): mismo formato
// de ventana modal que `aspecto`, pero sin recortar — para Hero, que guarda
// la posición como 2 números aparte (`posicionX`/`posicionY`) en vez de
// transformar el archivo. Mutuamente excluyente con `aspecto` en la
// práctica (ninguna sección hoy necesita las dos cosas a la vez). A
// diferencia del recorte, acá `onChange(archivo)` se llama de inmediato al
// elegir la foto (el centrado 50/50 por defecto ya es válido) — el modal solo
// AJUSTA la posición, cancelarlo no descarta la foto elegida. También se
// puede reabrir en cualquier momento con el botón "Ajustar posición de la
// foto", incluso sobre una imagen ya guardada, sin volver a subir nada.
export default function ImageUploadField({
  label, hint, recomendado, aspecto, valorActual, archivo, onChange, error, requerido,
  pedirPosicion, posicionX, posicionY, onPosicionChange,
}) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [archivoParaRecortar, setArchivoParaRecortar] = useState(null);
  const [ajustandoPosicion, setAjustandoPosicion] = useState(false);
  const previewUrl = useObjectUrl(archivo);

  const imagenAMostrar = previewUrl || valorActual;

  function manejarArchivos(files) {
    const nuevo = files?.[0];
    if (!nuevo) return;
    if (aspecto) {
      setArchivoParaRecortar(nuevo);
    } else {
      onChange(nuevo);
      if (pedirPosicion) setAjustandoPosicion(true);
    }
  }

  return (
    <div className="admin-field">
      <label className="admin-field-label">
        <span className="admin-field-label-texto">
          {label}
          {hint && <span className="admin-field-hint"> ({hint})</span>}
        </span>
      </label>

      {/* ⭐ Hallazgo real (revisión crítica 5.3a, 2026-08-16): esta zona de
         subida es un `<div>` con `onClick` — el `<input type="file">` de
         adentro tiene `hidden` (no solo oculto visualmente: `hidden` lo saca
         por completo del orden de tabulación y del árbol de accesibilidad),
         así que alguien navegando solo con teclado no tenía NINGUNA forma de
         llegar a abrir el selector de archivos. Se agrega `role="button"` +
         `tabIndex` + Enter/Espacio para que el propio div sea el control
         real alcanzable por teclado. */}
      <div
        className={`admin-upload${arrastrando ? ' admin-upload-arrastrando' : ''}${error ? ' invalido' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Subir foto — ${label}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          manejarArchivos(e.dataTransfer.files);
        }}
      >
        {imagenAMostrar ? (
          <img src={imagenAMostrar} alt="" className="admin-upload-preview" />
        ) : (
          <div className="admin-upload-vacio">
            <span>📷</span>
            <p>Haz clic o arrastra una foto aquí</p>
            <p className="admin-upload-formatos">JPG, PNG o WEBP{recomendado ? ` · ideal ${recomendado}` : ''}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png"
          hidden
          onChange={(e) => manejarArchivos(e.target.files)}
        />
      </div>
      {archivo && <p className="admin-upload-nombre">Nueva foto seleccionada: {archivo.name}</p>}
      {!archivo && !valorActual && requerido && <p className="admin-upload-nombre">Todavía no se ha subido ninguna foto</p>}
      {error && <span className="admin-field-error" role="alert">{error}</span>}

      {pedirPosicion && imagenAMostrar && (
        <Button type="button" variant="secundario" className="admin-upload-ajustar-posicion" onClick={() => setAjustandoPosicion(true)}>
          Ajustar posición de la foto
        </Button>
      )}

      {archivoParaRecortar && (
        <ImageCropModal
          archivo={archivoParaRecortar}
          aspecto={aspecto}
          onListo={(recortado) => { onChange(recortado); setArchivoParaRecortar(null); }}
          onCancelar={() => setArchivoParaRecortar(null)}
        />
      )}

      {ajustandoPosicion && (
        <ImagePositionModal
          archivo={archivo}
          imagenUrl={valorActual}
          x={posicionX}
          y={posicionY}
          onListo={(x, y) => { onPosicionChange(x, y); setAjustandoPosicion(false); }}
          onCancelar={() => setAjustandoPosicion(false)}
        />
      )}
    </div>
  );
}
