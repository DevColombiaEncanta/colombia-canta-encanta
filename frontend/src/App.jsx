import { HashRouter as BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CarritoProvider } from './context/CarritoContext';
import { SpotifyPlayerProvider } from './context/SpotifyPlayerContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import GlobalSpotifyPlayer from './components/SpotifyWidget/GlobalSpotifyPlayer';
import RequireAuth from './components/admin/RequireAuth';
import AdminLogin from './pages/admin/Login';
import AdminBienvenida from './pages/admin/Bienvenida';
import AdminAdministradores from './pages/admin/Administradores';
import AdminHero from './pages/admin/Hero';
import AdminNoticias from './pages/admin/Noticias';
import AdminEventos from './pages/admin/Eventos';
import AdminEventosFijos from './pages/admin/EventosFijos';
import AdminProductos from './pages/admin/Productos';
import AdminCursos from './pages/admin/Cursos';
import AdminInscripciones from './pages/admin/Inscripciones';
import AdminReservas from './pages/admin/Reservas';
import AdminPedidos from './pages/admin/Pedidos';
import AdminHistorial from './pages/admin/Historial';
import Navbar from './components/Navbar/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Inicio from './pages/Inicio';
import Nosotros from './pages/Nosotros';
import Eventos from './pages/Eventos';
import EventoDetallePage from './pages/EventoDetallePage';
import Tienda from './pages/Tienda';
import Carrito from './pages/Carrito';
import Inscripciones from './pages/Inscripciones';
import Contacto from './pages/Contacto';
import Elenco from './pages/Elenco';
import NoticiasPage from './pages/Noticias';
import NoticiaDetallePage from './pages/NoticiaDetallePage';
import PagoConfirmacion from './pages/PagoConfirmacion';
import PagoCancelado from './pages/PagoCancelado';
import TerminosCondiciones from './pages/TerminosCondiciones';
import PoliticasEventosGratuitos from './pages/PoliticasEventosGratuitos';
import PoliticasEventosPago from './pages/PoliticasEventosPago';
import NotFound from './pages/NotFound';
import './styles/main.css';

// 5.2 · El panel SÍ comparte el Navbar del sitio público (decisión revisada,
// según el diseño de referencia aportado por el usuario) — "Admin" vive como
// un ítem más del Navbar (ver Navbar.jsx). Lo único que sigue sin mostrarse
// en /admin/* es el reproductor flotante de Spotify, no tiene sentido ahí.
function PlayerSitioPublico() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  return <GlobalSpotifyPlayer />;
}

export default function App() {
  return (
    <HelmetProvider>
      <CarritoProvider>
        <SpotifyPlayerProvider>
          <AdminAuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Navbar />
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:slug" element={<EventoDetallePage />} />
                <Route path="/tienda" element={<Tienda />} />
                <Route path="/tienda/carrito" element={<Carrito />} />
                <Route path="/inscripciones" element={<Inscripciones />} />
                <Route path="/elenco" element={<Elenco />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/noticias" element={<NoticiasPage />} />
                <Route path="/noticias/:slug" element={<NoticiaDetallePage />} />
                <Route path="/confirmacion" element={<PagoConfirmacion />} />
                <Route path="/pago-cancelado" element={<PagoCancelado />} />
                <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
                <Route path="/politicas-eventos-gratuitos" element={<PoliticasEventosGratuitos />} />
                <Route path="/politicas-eventos-pago" element={<PoliticasEventosPago />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/bienvenida" element={<AdminBienvenida />} />
                <Route path="/admin" element={<Navigate to="/admin/hero" replace />} />
                <Route path="/admin/hero" element={<RequireAuth><AdminHero /></RequireAuth>} />
                <Route path="/admin/noticias" element={<RequireAuth><AdminNoticias /></RequireAuth>} />
                <Route path="/admin/eventos" element={<RequireAuth><AdminEventos /></RequireAuth>} />
                <Route path="/admin/eventos-fijos" element={<RequireAuth><AdminEventosFijos /></RequireAuth>} />
                <Route path="/admin/productos" element={<RequireAuth><AdminProductos /></RequireAuth>} />
                <Route path="/admin/cursos" element={<RequireAuth><AdminCursos /></RequireAuth>} />
                <Route path="/admin/inscripciones" element={<RequireAuth><AdminInscripciones /></RequireAuth>} />
                <Route path="/admin/reservas" element={<RequireAuth><AdminReservas /></RequireAuth>} />
                <Route path="/admin/pedidos" element={<RequireAuth><AdminPedidos /></RequireAuth>} />
                <Route path="/admin/historial" element={<RequireAuth><AdminHistorial /></RequireAuth>} />
                <Route path="/admin/administradores" element={<RequireAuth><AdminAdministradores /></RequireAuth>} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <PlayerSitioPublico />
            </BrowserRouter>
          </AdminAuthProvider>
        </SpotifyPlayerProvider>
      </CarritoProvider>
    </HelmetProvider>
  );
}
