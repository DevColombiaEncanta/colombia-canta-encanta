import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './GlobalSpotifyPlayer.css';
import { useSpotifyPlayer } from '../../context/SpotifyPlayerContext';
import { loadSpotifyIframeApi } from '../../utils/spotifyIframeApi';

const ARTIST_URI = 'spotify:artist:2vzvNutd40f4qwqEulaWoO';
const TRANSITION_MS = 180;
const CLOSED_KEY = 'spotify-player-closed';

export default function GlobalSpotifyPlayer() {
  const { dockNode, hasPlayed, setHasPlayed } = useSpotifyPlayer();
  const [docked, setDocked] = useState(false);
  // Persistido en localStorage: una vez cerrado, no debe reaparecer
  // flotando al navegar a otra página ni en una pestaña nueva.
  const [closed, setClosed] = useState(() => localStorage.getItem(CLOSED_KEY) === '1');
  const containerRef = useRef(null);
  const embedRef = useRef(null);
  const controllerRef = useRef(null);

  // Crea el embed una sola vez mediante la API oficial de Spotify, para
  // poder detectar cuándo el usuario le da play (y así activar el
  // reproductor flotante solo a partir de ese momento) y para poder
  // pausarlo desde el botón "Cerrar".
  useEffect(() => {
    let disposed = false;

    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (disposed || !embedRef.current) return;
      IFrameAPI.createController(
        embedRef.current,
        { uri: ARTIST_URI, width: '100%', height: '100%' },
        (ctrl) => {
          controllerRef.current = ctrl;
          ctrl.addListener('playback_update', (e) => {
            if (!e.data.isPaused) setHasPlayed(true);
          });
        }
      );
    });

    return () => {
      disposed = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [setHasPlayed]);

  // Reposiciona el mismo contenedor (sin desmontarlo): anclado sobre el
  // widget cuando está en pantalla, flotante (debajo del navbar) si ya
  // se inició la reproducción, u oculto fuera de pantalla en otro caso.
  // Una breve transición de opacidad evita el "salto" al cambiar de modo.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.style.opacity = '0';

    const timer = setTimeout(() => {
      if (dockNode) {
        setDocked(true);
        setClosed(false);
        localStorage.removeItem(CLOSED_KEY);
        // Coordenadas relativas al documento (no al viewport): con
        // position:absolute esto alcanza para que el navegador lo
        // desplace de forma nativa al hacer scroll, sin recalcular
        // en cada evento (eso era lo que causaba el jitter).
        const update = () => {
          const rect = dockNode.getBoundingClientRect();
          container.style.top = `${rect.top + window.scrollY}px`;
          container.style.left = `${rect.left + window.scrollX}px`;
          container.style.width = `${rect.width}px`;
          container.style.height = `${rect.height}px`;
        };
        update();
        container.style.opacity = '1';

        window.addEventListener('resize', update);
        const ro = new ResizeObserver(update);
        ro.observe(dockNode);

        container._cleanupDock = () => {
          window.removeEventListener('resize', update);
          ro.disconnect();
        };
        return;
      }

      setDocked(false);
      container.style.top = '';
      container.style.left = '';
      container.style.width = '';
      container.style.height = '';

      if (hasPlayed && !closed) container.style.opacity = '1';
    }, TRANSITION_MS);

    return () => {
      clearTimeout(timer);
      if (container._cleanupDock) {
        container._cleanupDock();
        container._cleanupDock = null;
      }
    };
  }, [dockNode, hasPlayed, closed]);

  const floating = !docked && hasPlayed && !closed;
  const mode = docked ? 'is-docked' : floating ? 'is-floating' : 'is-hidden';

  return createPortal(
    <>
      <div ref={containerRef} className={`global-spotify-player ${mode}`}>
        <div ref={embedRef} className="global-spotify-embed" />
      </div>
      <button
        type="button"
        className={`global-spotify-close ${mode}`}
        onClick={() => {
          controllerRef.current?.pause();
          setClosed(true);
          localStorage.setItem(CLOSED_KEY, '1');
        }}
        aria-label="Cerrar reproductor de Spotify"
      >
        Cerrar
      </button>
    </>,
    document.body
  );
}
