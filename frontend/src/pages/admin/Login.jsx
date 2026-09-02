import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { EMAIL_REGEX } from '../../utils/validacion';
import '../../styles/main.css';
import './Login.css';

function validarEmail(valor) {
  if (!valor) return 'El correo es obligatorio';
  if (!EMAIL_REGEX.test(valor)) return 'Ingresa un correo válido';
  return '';
}

function validarPassword(valor) {
  if (!valor) return 'La contraseña es obligatoria';
  return '';
}

function validarCodigo(valor) {
  if (valor.length !== 6) return 'El código debe tener 6 dígitos';
  return '';
}

export default function Login() {
  const { login, verificarMfa } = useAdminAuth();
  const navigate = useNavigate();

  const [paso, setPaso] = useState('credenciales');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [factorIds, setFactorIds] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [tocado, setTocado] = useState({ email: false, password: false, codigo: false });

  const errorEmail = validarEmail(email);
  const errorPassword = validarPassword(password);
  const errorCodigo = validarCodigo(codigo);

  function marcarTocado(campo) {
    setTocado((t) => ({ ...t, [campo]: true }));
  }

  async function manejarCredenciales(e) {
    e.preventDefault();
    setTocado({ email: true, password: true, codigo: false });
    if (errorEmail || errorPassword) return;

    setError('');
    setEnviando(true);
    try {
      const { factorIds: ids } = await login({ email, password });
      setFactorIds(ids);
      setPaso('mfa');
      setTocado({ email: false, password: false, codigo: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarMfa(e) {
    e.preventDefault();
    setTocado((t) => ({ ...t, codigo: true }));
    if (errorCodigo) return;

    setError('');
    setEnviando(true);
    try {
      await verificarMfa({ factorIds, code: codigo });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-franja" aria-hidden="true" />
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Colombia Canta y Encanta" className="admin-login-logo" />
        <span className="admin-login-eyebrow">Acceso administrativo</span>
        <h1>Panel de administración</h1>

        {paso === 'credenciales' && (
          <form onSubmit={manejarCredenciales} className="admin-login-form" noValidate>
            <label htmlFor="login-email">
              Correo
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => marcarTocado('email')}
                className={tocado.email && errorEmail ? 'invalido' : ''}
                aria-invalid={tocado.email && !!errorEmail}
                aria-describedby={tocado.email && errorEmail ? 'login-email-error' : undefined}
                autoFocus
              />
              {tocado.email && errorEmail && (
                <span id="login-email-error" className="admin-login-campo-error" role="alert">{errorEmail}</span>
              )}
            </label>
            <label htmlFor="login-password">
              Contraseña
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => marcarTocado('password')}
                className={tocado.password && errorPassword ? 'invalido' : ''}
                aria-invalid={tocado.password && !!errorPassword}
                aria-describedby={tocado.password && errorPassword ? 'login-password-error' : undefined}
              />
              {tocado.password && errorPassword && (
                <span id="login-password-error" className="admin-login-campo-error" role="alert">{errorPassword}</span>
              )}
            </label>
            {error && <p className="admin-login-error" role="alert">{error}</p>}
            <button type="submit" disabled={enviando}>
              {enviando ? 'Verificando…' : 'Continuar'}
            </button>
          </form>
        )}

        {paso === 'mfa' && (
          <form onSubmit={manejarMfa} className="admin-login-form" noValidate>
            <p className="admin-login-hint">Ingresa el código de 6 dígitos de tu app de autenticación</p>
            <label htmlFor="login-codigo">
              Código
              <input
                id="login-codigo"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                onBlur={() => marcarTocado('codigo')}
                className={tocado.codigo && errorCodigo ? 'invalido' : ''}
                aria-invalid={tocado.codigo && !!errorCodigo}
                aria-describedby={tocado.codigo && errorCodigo ? 'login-codigo-error' : undefined}
                autoFocus
              />
              {tocado.codigo && errorCodigo && (
                <span id="login-codigo-error" className="admin-login-campo-error" role="alert">{errorCodigo}</span>
              )}
            </label>
            {error && <p className="admin-login-error" role="alert">{error}</p>}
            <button type="submit" disabled={enviando || codigo.length !== 6}>
              {enviando ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
