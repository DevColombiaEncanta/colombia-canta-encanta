import { createContext, useContext, useState, useCallback } from 'react';

const SpotifyPlayerContext = createContext(null);

export function SpotifyPlayerProvider({ children }) {
  const [dockNode, setDockNodeState] = useState(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const setDockNode = useCallback((node) => {
    setDockNodeState(node);
  }, []);

  return (
    <SpotifyPlayerContext.Provider value={{ dockNode, hasPlayed, setDockNode, setHasPlayed }}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  return useContext(SpotifyPlayerContext);
}
