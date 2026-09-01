import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import ImagePositionPicker from './ImagePositionPicker';
import { useObjectUrl } from '../../../hooks/useObjectUrl';

// 2026-08-31 · Pedido del usuario: mismo formato de "ventana" que ya usa
// `ImageCropModal` para el resto de las secciones (consistencia visual en
// todo el panel), pero SIN recortar — Hero usa `object-fit: contain` a
// propósito (ver nota en ImagePositionPicker.jsx, que es lo que este diálogo
// usa por dentro sin cambiarle nada). Acá solo se agrega el marco de diálogo
// modal y un borrador local de x/y: "Cancelar" descarta cualquier ajuste
// hecho en esta apertura sin tocar la posición ya guardada, "Listo" recién
// ahí lo confirma hacia el formulario que lo abrió.
//
// Acepta `archivo` (File recién elegido) O `imagenUrl` (la ya guardada) —
// igual que `ImageUploadField` calcula `imagenAMostrar` — para poder abrirse
// tanto justo después de elegir una foto nueva como para reajustar más tarde
// la que ya está guardada, sin volver a subir nada.
export default function ImagePositionModal({ archivo, imagenUrl, x, y, onListo, onCancelar }) {
  const [draftX, setDraftX] = useState(x);
  const [draftY, setDraftY] = useState(y);
  const cancelarRef = useRef(null);
  const urlPropia = useObjectUrl(archivo);
  const urlFinal = urlPropia || imagenUrl;

  useEffect(() => {
    cancelarRef.current?.focus();
  }, []);

  function manejarTecla(e) {
    if (e.key === 'Escape') onCancelar();
  }

  return (
    <div className="admin-dialog-fondo" onClick={onCancelar}>
      <div
        className="admin-dialog admin-posicion-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-posicion-titulo"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={manejarTecla}
      >
        <h3 id="admin-posicion-titulo">Ajustar posición de la foto</h3>
        <p>Arrastra (o usa las flechas del teclado) para elegir qué parte queda centrada — la foto completa se sube igual, sin recortar.</p>

        {urlFinal && (
          <ImagePositionPicker
            imagenUrl={urlFinal}
            x={draftX}
            y={draftY}
            onChange={(nx, ny) => { setDraftX(nx); setDraftY(ny); }}
          />
        )}

        <div className="admin-dialog-acciones">
          <Button ref={cancelarRef} type="button" variant="secundario" onClick={onCancelar}>Cancelar</Button>
          <Button type="button" onClick={() => onListo(draftX, draftY)}>Listo</Button>
        </div>
      </div>
    </div>
  );
}
