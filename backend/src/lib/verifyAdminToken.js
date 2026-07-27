import { supabase } from '../config/supabaseClient.js';

function decodeJwtPayload(token) {
  const payload = token.split('.')[1];
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json);
}

export async function verifyAdminToken(token) {
  if (!token) {
    return { admin: null, reason: 'falta el token' };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return { admin: null, reason: 'JWT inválido o expirado' };
  }

  let payload;
  try {
    payload = decodeJwtPayload(token);
  } catch {
    return { admin: null, reason: 'no se pudo leer el contenido del JWT' };
  }

  if (payload.aal !== 'aal2') {
    return { admin: null, reason: `aal insuficiente (${payload.aal ?? 'sin claim aal'}), se requiere aal2` };
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admins')
    .select('id, rol, email, activo')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow || !adminRow.activo) {
    return { admin: null, reason: 'usuario no está en admins o no está activo' };
  }

  return {
    admin: {
      id: adminRow.id,
      userId: userData.user.id,
      rol: adminRow.rol,
      email: adminRow.email,
    },
    reason: null,
  };
}
