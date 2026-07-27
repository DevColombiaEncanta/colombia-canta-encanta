import { supabase } from '../config/supabaseClient.js';

const DIACRITICOS = /[̀-ͯ]/g;

export function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(DIACRITICOS, '') // quita tildes/acentos (tras normalize('NFD'))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Genera un slug a partir del título y garantiza que sea único en la tabla dada,
// agregando -2, -3... si hace falta. Reutilizable por cualquier entidad con `slug`
// (Noticias, y más adelante Eventos/Eventos Fijos).
export async function generarSlugUnico(tabla, titulo) {
  const base = slugify(titulo);
  let candidato = base;
  let intento = 1;

  for (;;) {
    const { data } = await supabase.from(tabla).select('id').eq('slug', candidato).maybeSingle();
    if (!data) return candidato;
    intento += 1;
    candidato = `${base}-${intento}`;
  }
}
