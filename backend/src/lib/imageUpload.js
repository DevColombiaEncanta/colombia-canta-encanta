import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabaseClient.js';
import { errorGenerico } from './errores.js';

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

// Formatos que un admin real puede llegar a subir desde su celular/computador —
// procesarYSubirImagen() los convierte todos a webp con sharp, así que no hace
// falta exigir webp de entrada (5.2, 2026-08-14: la versión original sí lo exigía,
// algo que ningún admin no técnico sabría hacer a mano antes de subir una foto).
const MIMES_IMAGEN_ACEPTADOS = ['image/webp', 'image/jpeg', 'image/png'];

// ⭐ Pedido del usuario (2026-08-15): algunos admins suben fotos directo de la
// cámara en formato RAW (Canon .CR2/.CR3, y equivalentes de otras marcas —
// casi todos usan un contenedor TIFF por dentro). `sharp`/libvips (lo que
// procesa las imágenes acá) no sabe decodificar RAW — haría falta una
// librería nativa completamente distinta (LibRaw), con mal soporte en el
// hosting actual. No se implementó soporte real; en cambio, cuando el
// archivo rechazado *parece* un RAW de cámara, el mensaje lo explica y
// sugiere exportar a JPG desde la cámara/celular antes de subir, en vez de
// solo decir genéricamente "no es una imagen válida".
const EXTENSIONES_RAW_CONOCIDAS = new Set(['cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'rw2', 'dng', 'tif', 'tiff']);

export function pareceRawDeCamara(tipoReal) {
  return !!tipoReal && EXTENSIONES_RAW_CONOCIDAS.has(tipoReal.ext);
}

// Confirma que el archivo sea una imagen real (magic bytes, no la extensión del
// nombre ni el Content-Type declarado por el navegador). Separado de
// procesarYSubirImagen para poder validar TODOS los archivos de una petición
// (ej. img + banner de Noticias) antes de subir ninguno — si se subiera uno y el otro
// fallara después, el primero quedaría huérfano en Storage sin ninguna fila que lo referencie.
export async function validarImagenReal(buffer) {
  const tipoReal = await fileTypeFromBuffer(buffer);
  if (!tipoReal || !MIMES_IMAGEN_ACEPTADOS.includes(tipoReal.mime)) {
    const mensaje = pareceRawDeCamara(tipoReal)
      ? 'Esa foto parece estar en formato RAW de cámara (no lo podemos procesar todavía). Expórtala como JPG desde la cámara o el celular y vuelve a subirla.'
      : 'El archivo debe ser una imagen real (.webp, .jpg o .png)';
    const err = new Error(mensaje);
    err.status = 400;
    throw err;
  }
}

// Recomprime/redimensiona y sube a Storage. Devuelve la URL pública guardable en la fila.
// Asume que el buffer ya pasó validarImagenReal — no lo valida de nuevo.
export async function procesarYSubirImagen(buffer, carpeta) {
  const comprimida = await comprimir(buffer, MAX_WIDTH);
  const path = `${carpeta}/${randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, comprimida, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    throw errorGenerico(uploadError, 'procesarYSubirImagen (Storage upload)', 500);
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
