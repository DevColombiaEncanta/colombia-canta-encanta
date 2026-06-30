import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CarritoProvider } from './context/CarritoContext';
import { SpotifyPlayerProvider } from './context/SpotifyPlayerContext';
import GlobalSpotifyPlayer from './components/SpotifyWidget/GlobalSpotifyPlayer';
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
import NotFound from './pages/NotFound';
import './styles/main.css';

export default function App() {
  return (
    <HelmetProvider>
      <CarritoProvider>
        <SpotifyPlayerProvider>
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
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalSpotifyPlayer />
          </BrowserRouter>
        </SpotifyPlayerProvider>
      </CarritoProvider>
    </HelmetProvider>
  );
}
