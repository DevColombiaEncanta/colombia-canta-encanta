import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Decidido en Fase 2 (2026-07-21): el SDK NO debe guardar la sesión en localStorage
// ni renovarla solo — la sesión real vive en las cookies httpOnly del backend
// (ver src/context/AdminAuthContext.jsx). Este cliente se usa únicamente para el
// intercambio inicial de credenciales (login + MFA) contra Supabase Auth; una vez
// obtenidos access_token/refresh_token, se mandan a POST /api/admin/session y el
// SDK no vuelve a intervenir.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
