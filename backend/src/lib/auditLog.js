import { supabase } from '../config/supabaseClient.js';

export async function logAudit({ actor, accion, entidad, entidadId, detalle }) {
  const { error } = await supabase.from('audit_log').insert({
    usuario_id: actor.userId,
    usuario_email: actor.email,
    accion,
    entidad,
    entidad_id: entidadId,
    detalle: detalle ?? null,
  });

  if (error) {
    // No bloqueamos la operación principal por un fallo de auditoría, pero sí queda
    // en el log del servidor para no perderlo silenciosamente.
    console.error('logAudit: no se pudo escribir en audit_log -', error.message);
  }
}
