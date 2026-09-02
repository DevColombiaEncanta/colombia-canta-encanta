// El `behavior: 'smooth'` nativo de `scrollTo`/`scrollIntoView` no tiene una
// duración fija — el navegador la calcula en función de la distancia a
// recorrer. Sobre esta página, donde hay que saltar el TiendaHero (100vh) y a
// veces bastante más (volver a un producto lejos en la grilla), eso se sentía
// lento (pedido del usuario, 2026-09-02). Esta versión anima con una duración
// fija y corta, así el salto siempre se siente igual de ágil sin importar la
// distancia.
export function scrollSuaveA(targetY, duration = 380) {
  const startY = window.scrollY;
  const distancia = targetY - startY;
  if (Math.abs(distancia) < 1) return;

  const inicio = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function paso(ahora) {
    const t = Math.min((ahora - inicio) / duration, 1);
    window.scrollTo(0, startY + distancia * easeOutCubic(t));
    if (t < 1) requestAnimationFrame(paso);
  }

  requestAnimationFrame(paso);
}
