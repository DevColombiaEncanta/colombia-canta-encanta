import { useEffect, useRef } from 'react';
import './SpotifyWidget.css';
import { useSpotifyPlayer } from '../../context/SpotifyPlayerContext';

const ARTIST_URL = 'https://open.spotify.com/intl-es/artist/2vzvNutd40f4qwqEulaWoO';

export default function SpotifyWidget() {
  const placeholderRef = useRef(null);
  const { setDockNode } = useSpotifyPlayer();

  useEffect(() => {
    setDockNode(placeholderRef.current);
    return () => setDockNode(null);
  }, [setDockNode]);

  return (
    <div className="spotify-widget">

      {/* Header */}
      <div className="spotify-widget-header">
        <div className="spotify-widget-header-top">
          <span className="spotify-por">Escúchanos en</span>
          <span className="spotify-logo-text">Spotify</span>
        </div>
        <a href={ARTIST_URL} target="_blank" rel="noopener noreferrer" className="spotify-handle-link">
          Colombia Canta y Encanta
        </a>
      </div>

      {/* Espacio donde se ancla el reproductor global */}
      <div ref={placeholderRef} className="spotify-embed-placeholder" />

      {/* Footer */}
      <div className="spotify-footer">
        <a href={ARTIST_URL} target="_blank" rel="noopener noreferrer" className="spotify-ver-link">
          ver en spotify
        </a>
      </div>

    </div>
  );
}
