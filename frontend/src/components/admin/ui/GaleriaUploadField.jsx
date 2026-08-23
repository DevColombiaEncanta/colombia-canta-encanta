import { useRef, useState } from 'react';
import HelpTooltip from './HelpTooltip';
import ImageCropModal from './ImageCropModal';
import { useObjectUrls } from '../../../hooks/useObjectUrl';

// 5.3a · Subida de galería (varias fotos). `recomendado` — ver la misma nota
// en ImageUploadField.jsx (2026-08-16). `aspecto` — mismo recorte antes de
// subir que ImageUploadField, pero acá puede haber varias fotos nuevas a la
// vez: se recortan una por una, en cola (`colaRecorte`), para no forzar un
// solo recorte "para todas" que no tendría sentido si las fotos tienen
// encuadres distintos.
//
// Puntos 15/16 (5.4 tercera ronda, pedido explícito del usuario): antes,
// subir una foto nueva reemplazaba TODA la galería existente — no había forma
// de borrar una sola foto ni de agregar sin volver a mandar el resto. Ahora
// las fotos ya subidas (`valorActual`) se muestran con su propio botón de
// borrar (marca la URL en `imagenesABorrar`, el borrado real ocurre recién al
// guardar el formulario) y las fotos nuevas se SUMAN a las que quedan, no las
// reemplazan — el backend hace el mismo cálculo (ver PATCH /api/admin/productos/:id).
export default function GaleriaUploadField({ label, recomendado, aspecto, valorActual, imagenesABorrar = [], onEliminarExistente, archivos, onChange, error, max = 10 }) {
  const inputRef = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [colaRecorte, setColaRecorte] = useState([]);
  const galeriaActual = (valorActual || []).filter((url) => !imagenesABorrar.includes(url));

  // Ver hooks/useObjectUrl.js — crea y revoca las URL de vista previa en el
  // mismo efecto (no en un `useMemo` aparte), para no perder la carrera con
  // el doble-efecto de React StrictMode (hallazgo real, 2026-08-16).
  const previewUrls = useObjectUrls(archivos);

  const [avisoLimite, setAvisoLimite] = useState('');

  // ⭐ Hallazgo real (revisión crítica 5.3a, 2026-08-16): si alguien
  // seleccionaba más fotos de las que quedaban disponibles hasta `max`, las
  // que sobraban se descartaban en silencio (`.slice()` las corta sin avisar)
  // — un admin que elige "todas las fotos de la carpeta" (ej. 15) veía
  // aparecer solo 10 sin ningún indicio de por qué faltan las demás.
  function manejarArchivos(files) {
    const todos = Array.from(files || []);
    const disponibles = max - galeriaActual.length - archivos.length - colaRecorte.length;
    const nuevos = todos.slice(0, disponibles);
    setAvisoLimite(
      todos.length > nuevos.length
        ? `Se agregaron ${nuevos.length} de ${todos.length} fotos — el máximo son ${max} en total.`
        : ''
    );
    if (nuevos.length === 0) return;
    if (aspecto) setColaRecorte((cola) => [...cola, ...nuevos]);
    else onChange([...archivos, ...nuevos]);
  }

  function alConfirmarRecorte(archivoRecortado) {
    onChange([...archivos, archivoRecortado]);
    setColaRecorte((cola) => cola.slice(1));
  }

  function alCancelarRecorte() {
    setColaRecorte((cola) => cola.slice(1));
  }

  function quitarNuevo(idx) {
    onChange(archivos.filter((_, i) => i !== idx));
  }

  return (
    <div className="admin-field">
      <label className="admin-field-label">
        <span className="admin-field-label-texto">
          {label}
          <HelpTooltip
            texto="Las fotos nuevas se suman a las que ya existen — no hace falta volver a subir las que quieres conservar. Cada foto (vieja o nueva) tiene su propio botón × para borrarla individualmente."
            ejemplo="hasta 10 fotos, formato JPG, PNG o WEBP"
          />
        </span>
      </label>

      {(galeriaActual.length > 0 || archivos.length > 0) && (
        <div className="admin-galeria-actual">
          {galeriaActual.map((url, idx) => (
            <div key={url} className="admin-galeria-nueva-item">
              <img src={url} alt="" className="admin-galeria-miniatura" />
              <button
                type="button"
                className="admin-galeria-quitar"
                onClick={() => onEliminarExistente(url)}
                aria-label={`Quitar foto ${idx + 1} de la galería`}
              >
                ×
              </button>
            </div>
          ))}
          {archivos.map((archivo, idx) => (
            <div key={idx} className="admin-galeria-nueva-item">
              <img src={previewUrls[idx]} alt="" className="admin-galeria-miniatura" />
              <button
                type="button"
                className="admin-galeria-quitar"
                onClick={() => quitarNuevo(idx)}
                aria-label={`Quitar foto ${idx + 1} de la galería nueva`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mismo hallazgo de accesibilidad que ImageUploadField.jsx: el input real
         tiene `hidden` (fuera del tabulado), así que este div necesita ser el
         control alcanzable por teclado — ver comentario ahí. */}
      <div
        className={`admin-upload admin-upload-compacto${arrastrando ? ' admin-upload-arrastrando' : ''}${error ? ' invalido' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Subir fotos — ${label}`}
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
        <div className="admin-upload-vacio">
          <span>🖼️</span>
          <p>
            {archivos.length > 0
              ? `${archivos.length} foto(s) nueva(s) seleccionada(s) — clic para agregar más`
              : 'Haz clic o arrastra fotos aquí para agregarlas a la galería'}
          </p>
          <p className="admin-upload-formatos">JPG, PNG o WEBP · hasta {max} fotos{recomendado ? ` · ideal ${recomendado}` : ''}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png"
          multiple
          hidden
          onChange={(e) => { manejarArchivos(e.target.files); e.target.value = ''; }}
        />
      </div>
      {avisoLimite && <span className="admin-field-error" role="alert">{avisoLimite}</span>}
      {error && <span className="admin-field-error" role="alert">{error}</span>}

      {colaRecorte.length > 0 && (
        <ImageCropModal
          archivo={colaRecorte[0]}
          aspecto={aspecto}
          progreso={colaRecorte.length > 1 ? `1 de ${colaRecorte.length}` : undefined}
          onListo={alConfirmarRecorte}
          onCancelar={alCancelarRecorte}
        />
      )}
    </div>
  );
}
