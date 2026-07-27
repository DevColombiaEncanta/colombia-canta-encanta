import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabaseClient.js';

const BUCKET = 'sitio-imagenes';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // tope de subida en crudo, antes de recomprimir
const MAX_OUTPUT_BYTES = 1024 * 1024; // tope final deseado (~1MB)
const MAX_WIDTH = 1920;
const CALIDADES = [80, 65, 50]; // intentos de recompresión, de mejor a peor calidad

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// sharp no copia metadata (EXIF) al buffer de salida salvo que se llame .withMetadata() —
// por eso reprocesar con sharp ya limpia el EXIF sin código extra.
async function comprimir(buffer, anchoInicial) {
  let ancho = anchoInicial;
  for (let pase = 0; pase < 2; pase++) {
    for (const calidad of CALIDADES) {
      const salida = await sharp(buffer)
        .resize({ width: ancho, withoutEnlargement: true })
        .webp({ quality: calidad })
        .toBuffer();
      if (salida.byteLength <= MAX_OUTPUT_BYTES) return salida;
    }
    ancho = Math.round(ancho / 2);
  }
  return sharp(buffer)
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: CALIDADES[CALIDADES.length - 1] })
    .toBuffer();
}

function pathDesdeUrl(url) {
  const marcador = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marcador);
  if (idx === -1) return null;
  return url.slice(idx + marcador.length);
}

// Confirma que el archivo sea un .webp real (magic bytes, no la extensión del nombre).
// Separado de procesarYSubirImagen para poder validar TODOS los archivos de una petición
// (ej. img + banner de Noticias) antes de subir ninguno — si se subiera uno y el otro
// fallara después, el primero quedaría huérfano en Storage sin ninguna fila que lo referencie.
export async function validarWebpReal(buffer) {
  const tipoReal = await fileTypeFromBuffer(buffer);
  if (!tipoReal || tipoReal.mime !== 'image/webp') {
    const err = new Error('El archivo debe ser una imagen .webp real');
    err.status = 400;
    throw err;
  }
}

// Recomprime/redimensiona y sube a Storage. Devuelve la URL pública guardable en la fila.
// Asume que el buffer ya pasó validarWebpReal — no lo valida de nuevo.
export async function procesarYSubirImagen(buffer, carpeta) {
  const comprimida = await comprimir(buffer, MAX_WIDTH);
  const path = `${carpeta}/${randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, comprimida, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    const err = new Error(uploadError.message);
    err.status = 500;
    throw err;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// No lanza si falla — igual que auditLog, un fallo al borrar el archivo viejo
// no debe tumbar la respuesta de un update/delete que ya se guardó bien en la tabla.
export async function borrarImagenPorUrl(url) {
  const path = pathDesdeUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error('No se pudo borrar imagen de Storage:', path, '-', error.message);
  }
}
