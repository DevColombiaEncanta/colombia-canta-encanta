import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 2.7: métodos como auth.refreshSession()/signInWithPassword() mutan el estado interno
// de sesión del cliente que los llama — si se usan sobre el `supabase` compartido de
// arriba, las consultas siguientes en ESE MISMO cliente (ej. a `admins`) empiezan a
// correr como el usuario logueado en vez de `service_role`, rompiendo el GRANT.
// Esta función crea un cliente nuevo y descartable, para aislar esa mutación y no
// contaminar al cliente compartido (importante en un servidor con peticiones concurrentes).
export function createScopedAuthClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
