import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;
const CSRF_HEADER = 'x-csrf-token';

// 5.1 · Decidido con el usuario (2026-08-14): la sesión sobrevive a recargas de
// página, pero 1 hora sin actividad real en el panel obliga a volver a iniciar
// sesión — sin importar que el refresh_token del backend siga siendo válido por
// mucho más tiempo (30 días, ver sessionCookies.js). Por eso este chequeo vive acá,
// del lado del cliente, y no se delega solo a la expiración natural de los tokens.
const IDLE_LIMIT_MS = 60 * 60 * 1000;
const ULTIMA_ACTIVIDAD_KEY = 'cc_admin_ultima_actividad';

function marcarActividad() {
  localStorage.setItem(ULTIMA_ACTIVIDAD_KEY, String(Date.now()));
}

function tiempoInactivoSuperaElLimite() {
  const guardado = localStorage.getItem(ULTIMA_ACTIVIDAD_KEY);
  if (!guardado) return true;
  return Date.now() - Number(guardado) > IDLE_LIMIT_MS;
}

// ⭐ Hallazgo real (revisión crítica, 2026-08-14): csrfTokenRef solo se llenaba
// a partir de una respuesta JSON exitosa (login/refresh/GET session). Tras una
// recarga completa de página, el Provider se monta de cero y ese ref vuelve a
// `null` — si el primer GET /api/admin/session falla (access_token vencido) y
// hace falta refrescar, el refresh se mandaba sin CSRF y requireCsrf lo
// rechazaba (403), aunque la cookie `csrf_token` real siguiera ahí en el
// navegador (no es httpOnly justamente para poder leerla). Se lee directo de
// document.cookie como respaldo en vez de depender solo de una respuesta previa.
function leerCsrfDeCookie() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [cargando, setCargando] = useState(true);
  const csrfTokenRef = useRef(null);
  const refrescoEnCursoRef = useRef(null);

  const limpiarSesionLocal = useCallback(() => {
    csrfTokenRef.current = null;
    setAdmin(null);
    localStorage.removeItem(ULTIMA_ACTIVIDAD_KEY);
  }, []);

  // ⭐ Hallazgo real (revisión crítica, 2026-08-14, reproducido con Playwright):
  // React StrictMode duplica a propósito los efectos en desarrollo — Dashboard
  // podía disparar 2 adminFetch casi simultáneos al montar, y si ambos
  // necesitaban refrescar a la vez, el segundo mandaba el header CSRF viejo
  // (capturado antes de que el primero rotara la cookie al completar), y
  // requireCsrf lo rechazaba con 403 — el refresh_token de Supabase además es
  // de un solo uso, así que dos refrescos concurrentes nunca pueden ser
  // correctos los dos. Se deduplica: si ya hay un refresh en curso, todos los
  // que lleguen mientras tanto esperan esa MISMA promesa en vez de lanzar otra.
  // ⭐ Hallazgo real (2026-08-14, uso real del panel): esta función devolvía un
  // simple booleano, así que un 429 (límite de peticiones, ver
  // middleware/rateLimiters.js) se veía indistinguible de un refresh_token
  // realmente inválido — ambos casos terminaban en limpiarSesionLocal() y
  // expulsaban al admin del panel, aunque su sesión siguiera siendo válida en
  // el backend. Ahora se devuelve un resultado de 3 valores para que quien
  // llama pueda decidir: 'ok' (refrescó), 'invalido' (401/403, sí hay que
  // cerrar sesión) o 'error' (429/5xx/red, transitorio — no tocar la sesión).
  const intentarRefrescar = useCallback(() => {
    if (refrescoEnCursoRef.current) return refrescoEnCursoRef.current;

    const promesa = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/session/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { [CSRF_HEADER]: csrfTokenRef.current || leerCsrfDeCookie() || '' },
        });
        if (!res.ok) return res.status === 401 || res.status === 403 ? 'invalido' : 'error';
        const data = await res.json();
        csrfTokenRef.current = data.csrfToken;
        setAdmin(data.admin);
        return 'ok';
      } catch {
        return 'error';
      } finally {
        refrescoEnCursoRef.current = null;
      }
    })();

    refrescoEnCursoRef.current = promesa;
    return promesa;
  }, []);

  // Llamada autenticada para todo el panel: agrega credentials/CSRF, chequea
  // inactividad antes de gastar una petición de red, y reintenta una sola vez
  // si el access_token ya venció (reactivo, no hay refresh en segundo plano).
  //
  // 5.2 · `body` puede ser un `FormData` (formularios con imagen, Hero/Noticias) —
  // en ese caso NO se fija `Content-Type` a mano: el navegador arma el
  // `multipart/form-data; boundary=...` correcto solo, y si lo pisáramos con
  // `application/json` el backend (multer) no podría parsear la petición.
  const adminFetch = useCallback(async (path, { method = 'GET', body } = {}) => {
    if (tiempoInactivoSuperaElLimite()) {
      limpiarSesionLocal();
      throw new Error('Sesión expirada por inactividad');
    }

    const esFormData = body instanceof FormData;

    const hacerPeticion = () => fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body && !esFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { [CSRF_HEADER]: csrfTokenRef.current || leerCsrfDeCookie() || '' } : {}),
      },
      body: body ? (esFormData ? body : JSON.stringify(body)) : undefined,
    });

    let res = await hacerPeticion();

    if (res.status === 401) {
      const resultado = await intentarRefrescar();
      if (resultado === 'invalido') {
        limpiarSesionLocal();
        throw new Error('Sesión expirada, inicia sesión de nuevo');
      }
      if (resultado === 'error') {
        throw new Error('No se pudo conectar con el servidor, intenta de nuevo');
      }
      res = await hacerPeticion();
    }

    const responseBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(responseBody.error || `Error ${res.status} al conectar con la API`);
    }

    marcarActividad();
    return responseBody;
  }, [intentarRefrescar, limpiarSesionLocal]);

  // Al montar (carga inicial o recarga de página): si ya pasó la hora de
  // inactividad, ni se intenta preguntarle al backend — se manda directo a
  // "sin sesión". Si no, se confirma contra GET /api/admin/session que las
  // cookies httpOnly siguen siendo válidas de verdad.
  //
  // ⭐ Hallazgo real (revisión crítica, 2026-08-14): el access_token dura 1 hora,
  // el mismo tamaño que la ventana de inactividad — así que un admin activo que
  // simplemente recarga la página justo después de que el access_token venció
  // (pero sin haber estado inactivo) se encontraba expulsado sin necesidad,
  // porque este chequeo no intentaba refrescar antes de rendirse. Corregido:
  // si el primer intento da 401, se intenta refrescar una vez antes de concluir
  // que no hay sesión — mismo criterio reactivo que ya usa adminFetch.
  //
  // ⭐ Segundo hallazgo (mismo día, al probar el fix de arriba): intentar
  // refrescar SIEMPRE que falla el chequeo generaba un 403 innecesario incluso
  // en el caso normal de "nunca inició sesión" (sin refresh_token que renovar).
  // Se usa la cookie `csrf_token` (la única legible por JS) como señal barata de
  // "alguna vez hubo sesión" antes de gastar el viaje de red del refresh.
  useEffect(() => {
    async function restaurar() {
      if (tiempoInactivoSuperaElLimite()) {
        limpiarSesionLocal();
        setCargando(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/admin/session`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          csrfTokenRef.current = data.csrfToken;
          setAdmin(data.admin);
          marcarActividad();
        } else if (res.status !== 401 && res.status !== 403) {
          // 429/5xx: falla transitoria del servidor, no una sesión inválida —
          // no se borra nada, se deja que el admin reintente (recargar) en vez
          // de expulsarlo a /admin/login sin motivo real.
        } else if (leerCsrfDeCookie()) {
          const resultado = await intentarRefrescar();
          if (resultado === 'ok') marcarActividad();
          else if (resultado === 'invalido') limpiarSesionLocal();
        } else {
          limpiarSesionLocal();
        }
      } catch {
        // Falla de red: igual que el 429, es transitoria — no se borra la sesión local.
      } finally {
        setCargando(false);
      }
    }
    restaurar();
  }, [limpiarSesionLocal, intentarRefrescar]);

  // Paso 1 del login: correo + contraseña directo contra Supabase (Opción A,
  // Fase 2). Devuelve si hace falta el paso de MFA y con qué factores.
  const login = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Correo o contraseña incorrectos');

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factores, error: errorFactores } = await supabase.auth.mfa.listFactors();
      if (errorFactores || !factores.totp?.length) {
        throw new Error('Esta cuenta no tiene un segundo factor configurado');
      }
      // ⭐ Hallazgo real (revisión crítica, 2026-08-14): manual_administradores.md
      // recomienda explícitamente inscribir un segundo dispositivo de MFA de
      // respaldo — pero antes solo se desafiaba el primer factor de la lista, así
      // que un código válido del dispositivo de respaldo simplemente fallaba
      // siempre. Ahora se guardan todos los factores inscritos, no solo el primero.
      return { requiereMfa: true, factorIds: factores.totp.map((f) => f.id) };
    }

    // Cuenta sin MFA todavía (no debería pasar con las 5 cuentas reales, pero
    // no se asume): no hay tokens de sesión aal2 que mandarle al backend.
    throw new Error('Esta cuenta necesita completar la configuración de MFA');
  }, []);

  // Paso 2 del login: código TOTP. Se prueba contra cada factor inscrito (por si
  // el código viene de un dispositivo de respaldo, no del principal) hasta que
  // uno lo acepte — recién con los tokens ya en aal2 se abre la sesión real
  // (cookies httpOnly) vía backend.
  const verificarMfa = useCallback(async ({ factorIds, code }) => {
    let sesionMfa = null;
    for (const factorId of factorIds) {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (!error) {
        sesionMfa = data;
        break;
      }
    }
    if (!sesionMfa) throw new Error('Código incorrecto o vencido');

    const res = await fetch(`${API_URL}/api/admin/session`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: sesionMfa.access_token, refresh_token: sesionMfa.refresh_token }),
    });
    if (!res.ok) throw new Error('No se pudo abrir la sesión en el servidor');

    const sesion = await res.json();
    csrfTokenRef.current = sesion.csrfToken;
    setAdmin(sesion.admin);
    marcarActividad();
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/admin/session`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { [CSRF_HEADER]: csrfTokenRef.current || leerCsrfDeCookie() || '' },
      });
    } finally {
      limpiarSesionLocal();
    }
  }, [limpiarSesionLocal]);

  return (
    <AdminAuthContext.Provider value={{ admin, cargando, login, verificarMfa, logout, adminFetch }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
  return ctx;
}
