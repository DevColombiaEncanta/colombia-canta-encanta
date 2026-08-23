import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import '../../styles/main.css';
import './Login.css';
import './Bienvenida.css';

const MIN_PASSWORD = 8;

// ⭐ Hallazgo real (probado con un link de invitación real de Supabase, no
// asumido): el link del correo NO trae `?token_hash=...` como query param
// normal — apunta primero al propio `/auth/v1/verify` de Supabase, que
// redirige acá agregando `#access_token=...&refresh_token=...&type=invite`
// (flujo implícito). Como `HashRouter` ya usa `#/admin/bienvenida` para la
// ruta, la URL final queda con DOS símbolos `#` seguidos
// (`.../#/admin/bienvenida#access_token=...`) — `useSearchParams()` de
// react-router no ve nada de esto (no es un query string). Se parsea la URL
// cruda a mano, buscando el primer `#` o `?` que aparezca DESPUÉS de la ruta
// propia. Se soportan los dos formatos posibles (`access_token`/`refresh_token`
// del flujo implícito, confirmado real hoy; `token_hash` como respaldo, por si
// Supabase cambia de método) en vez de asumir uno solo.
function leerParamsDeAuth() {
  const href = window.location.href;
  const primerHash = href.indexOf('#');
  if (primerHash === -1) return new URLSearchParams('');
  const resto = href.slice(primerHash + 1); // ej. "/admin/bienvenida#access_token=...&type=invite"
  const marcador = resto.search(/[#?]/);
  if (marcador === -1) return new URLSearchParams('');
  return new URLSearchParams(resto.slice(marcador + 1));
}

// 5.7 · Único punto de entrada real para 2 casos, distinguidos por el `type`
// que Supabase agrega solo al link del correo (no hace falta que nosotros lo
// sepamos de antemano): `invite` (admin nuevo, sin contraseña ni MFA todavía)
// y `recovery` (alguien ya existente recuperando su contraseña — ej. rotar la
// de comunicaciones@colombiacanta.org). El cliente de Supabase de este archivo
// usa `persistSession: false` (ver config/supabaseClient.js) — la sesión que
// se abre acá vive solo en memoria mientras dura esta página, nunca en
// localStorage; al terminar se descarta con `signOut()` y la persona entra de
// nuevo por el login normal, con las cookies httpOnly reales del panel.
export default function Bienvenida() {
  const [paso, setPaso] = useState('verificando'); // verificando | error | password | mfa | listo
  const [tipo, setTipo] = useState(null); // 'invite' | 'recovery' | otro
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [factorId, setFactorId] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    async function verificar() {
      const params = leerParamsDeAuth();
      const type = params.get('type');
      const errorDescripcion = params.get('error_description');

      // ⭐ Hallazgo real (probado con un link real): dejar `access_token`/
      // `refresh_token` colgando en la URL después de leerlos no es solo
      // estético — quedan en el historial del navegador, y además
      // `ScrollToTop.jsx` intenta usar ese fragmento como selector CSS para
      // hacer scroll a un ancla y explota (`document.querySelector('#access_
      // token=...')` no es un selector válido). Se limpia la URL ni bien se
      // leyeron los parámetros, haya salido bien la verificación o no.
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/admin/bienvenida`);

      if (errorDescripcion) {
        setError('Este link ya no es válido o venció. Pedí uno nuevo.');
        setPaso('error');
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const tokenHash = params.get('token_hash');

      let verifyError;
      if (accessToken && refreshToken) {
        ({ error: verifyError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
      } else if (tokenHash && type) {
        ({ error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
      } else {
        setError('Este link está incompleto o no es válido.');
        setPaso('error');
        return;
      }

      if (verifyError) {
        setError('Este link ya no es válido o venció. Pedí uno nuevo.');
        setPaso('error');
        return;
      }

      setTipo(type);

      // ⭐ Hallazgo real (probado con un link de recuperación real, sobre una
      // cuenta con MFA ya activo — 401 real de Supabase): `"insufficient_aal:
      // AAL2 session is required to update email or password when MFA is
      // enabled"`. Un link de recuperación por sí solo solo prueba que la
      // persona tiene acceso al correo — no al segundo factor — así que
      // Supabase bloquea el cambio de contraseña hasta pasar un challenge de
      // MFA real. Es el comportamiento correcto (evita que un correo
      // interceptado alcance para desactivar el MFA de la cuenta), así que en
      // vez de pelear contra esto, se le pide a la persona su código ACTUAL
      // antes de dejarla tocar la contraseña.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        const { data: factores } = await supabase.auth.mfa.listFactors();
        const factorVerificado = factores?.totp?.find((f) => f.status === 'verified');
        if (factorVerificado) {
          setFactorId(factorVerificado.id);
          setPaso('mfa-actual');
          return;
        }
      }

      setPaso('password');
    }
    verificar();
  }, []);

  useEffect(() => {
    if (paso === 'listo') supabase.auth.signOut().catch(() => {});
  }, [paso]);

  async function iniciarEnrolamientoMfa() {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (enrollError) {
      setError(enrollError.message);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPaso('mfa');
  }

  async function guardarPassword(e) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setEnviando(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Recovery de una cuenta que ya tiene MFA activo (ej. comunicaciones@...)
      // no necesita re-inscribirlo — solo lo pasa si de verdad no tiene ninguno.
      const { data: factores } = await supabase.auth.mfa.listFactors();
      const yaTieneFactorVerificado = factores?.totp?.some((f) => f.status === 'verified');

      if (yaTieneFactorVerificado) {
        setPaso('listo');
      } else {
        await iniciarEnrolamientoMfa();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  // Un solo manejador para los 2 casos que piden un código de 6 dígitos:
  // confirmar el MFA recién inscrito (paso 'mfa', sigue a 'listo') y confirmar
  // el MFA YA existente antes de dejar cambiar la contraseña (paso
  // 'mfa-actual', sigue a 'password') — misma llamada challenge+verify, solo
  // cambia a dónde va después.
  async function confirmarCodigo(e, pasoSiguiente) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: codigo });
      if (verifyError) throw new Error('Código incorrecto, intenta de nuevo');

      setCodigo('');
      setPaso(pasoSiguiente);
    } catch (err) {
      setError(err.message);
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  }

  // ⭐ Hallazgo real (auditoría 5.7): cada paso tenía su propio `<h1>`, cada
  // uno montado/desmontado por separado — un lector de pantalla no se entera
  // cuando la página pasa de "Verificando…" a "Configura tu código", porque
  // no hay ninguna navegación de ruta real (todo pasa en la misma página, con
  // `HashRouter`) ni ninguna región viva anunciando el cambio. Un solo `<h1>`
  // persistente con `aria-live="polite"` (nunca se desmonta, solo cambia su
  // texto) sí se anuncia.
  const TITULOS = {
    verificando: 'Verificando tu link…',
    error: 'Link no válido',
    'mfa-actual': 'Confirmá tu código actual',
    password: tipo === 'recovery' ? 'Elegí tu nueva contraseña' : 'Bienvenido/a — elegí tu contraseña',
    mfa: 'Configura tu código de seguridad',
    listo: '¡Listo!',
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Colombia Canta y Encanta" className="admin-login-logo" />
        <h1 aria-live="polite">{TITULOS[paso]}</h1>

        {paso === 'error' && (
          <>
            <p className="admin-login-error" role="alert">{error}</p>
            <Link to="/admin/login" className="bienvenida-link">Ir al inicio de sesión</Link>
          </>
        )}

        {paso === 'mfa-actual' && (
          <>
            <p className="admin-login-hint">Por tu seguridad, antes de cambiar la contraseña necesitamos confirmar que todavía tenés acceso a tu app de autenticación.</p>
            <form onSubmit={(e) => confirmarCodigo(e, 'password')} className="admin-login-form" noValidate>
              <label htmlFor="bienvenida-codigo-actual">
                Código de 6 dígitos
                <input
                  id="bienvenida-codigo-actual"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </label>
              {error && <p className="admin-login-error" role="alert">{error}</p>}
              <button type="submit" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Verificando…' : 'Confirmar'}
              </button>
            </form>
            {/* ⭐ Hallazgo real (auditoría 5.7): sin esto, alguien que de
               verdad perdió el celular con su app de autenticación quedaba
               sin ninguna salida en esta pantalla — un input de código y
               nada más. */}
            <p className="admin-login-hint">¿Perdiste el acceso a tu app de autenticación? Esta pantalla no puede ayudarte — pedile a la persona que administra la cuenta de Supabase del proyecto que resetee tu MFA desde el dashboard.</p>
          </>
        )}

        {paso === 'password' && (
          <>
            <form onSubmit={guardarPassword} className="admin-login-form" noValidate>
              <label htmlFor="bienvenida-password">
                Contraseña nueva
                <input
                  id="bienvenida-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </label>
              <label htmlFor="bienvenida-confirmar">
                Confirmar contraseña
                <input
                  id="bienvenida-confirmar"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
              </label>
              {error && <p className="admin-login-error" role="alert">{error}</p>}
              <button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Continuar'}</button>
            </form>
          </>
        )}

        {paso === 'mfa' && (
          <>
            <p className="admin-login-hint">Escanea este código con una app de autenticación (Google Authenticator, Authy, o similar) en tu celular.</p>
            {qrCode && (
              <img
                className="bienvenida-qr"
                src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCode)}`}
                alt="Código QR para configurar tu segundo factor de autenticación"
              />
            )}
            <p className="admin-login-hint">¿No podés escanearlo? Escribí este código a mano en la app:</p>
            <p className="bienvenida-secreto">{secret}</p>
            <form onSubmit={(e) => confirmarCodigo(e, 'listo')} className="admin-login-form" noValidate>
              <label htmlFor="bienvenida-codigo">
                Código de 6 dígitos
                <input
                  id="bienvenida-codigo"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </label>
              {error && <p className="admin-login-error" role="alert">{error}</p>}
              <button type="submit" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Verificando…' : 'Confirmar'}
              </button>
            </form>
          </>
        )}

        {paso === 'listo' && (
          <>
            <p className="admin-login-hint">
              {tipo === 'recovery'
                ? 'Tu contraseña quedó actualizada.'
                : 'Tu cuenta quedó configurada.'} Ya podés iniciar sesión normalmente.
            </p>
            <Link to="/admin/login" className="bienvenida-link">Ir al inicio de sesión</Link>
          </>
        )}
      </div>
    </div>
  );
}
