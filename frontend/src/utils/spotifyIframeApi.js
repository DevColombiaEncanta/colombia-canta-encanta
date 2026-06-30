let apiPromise = null;

/**
 * Carga (una sola vez) la API oficial de Spotify para embeds y devuelve
 * una promesa que resuelve con el objeto `IFrameAPI`.
 */
export function loadSpotifyIframeApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      if (window.Spotify?.Iframe) {
        resolve(window.Spotify.Iframe);
        return;
      }

      const previous = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        previous?.(IFrameAPI);
        resolve(IFrameAPI);
      };

      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      document.body.appendChild(script);
    });
  }

  return apiPromise;
}
