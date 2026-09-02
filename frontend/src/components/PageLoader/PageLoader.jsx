import './PageLoader.css';

// Pedido del usuario (2026-09-02): antes de mostrar la ficha de producto se
// veía brevemente un "Cargando producto…" en texto plano, que se sentía
// como una recarga de página rota en vez de una transición cuidada dentro
// de la SPA. Mismo lenguaje visual que el splash inicial (index.html —
// línea animada creciendo) pero adaptado para vivir DENTRO de una página ya
// montada (con el Navbar arriba, no a pantalla completa) y en loop, porque
// acá no hay una duración fija conocida como en el splash inicial.
export default function PageLoader({ texto = 'Cargando…' }) {
  return (
    <div className="page-loader">
      <div className="page-loader-linea" />
      <span className="page-loader-texto">{texto}</span>
    </div>
  );
}
