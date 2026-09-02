import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../../context/CarritoContext';
import { formatCOP } from '../../utils/formato';
import { scrollSuaveA } from '../../utils/scroll';
import './ProductoDetalle.css';

const TASA_USD = 4200;
const formatUSD = (num) => '$' + (num / TASA_USD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Mismo criterio que tenía ProductoModal (reemplazado por esta página propia
// — pedido del usuario, 2026-09-01: la foto se veía siempre recortada dentro
// del presupuesto de altura de un modal). La lógica de selección de
// talla/color/stock es la misma que ya se había probado y corregido ahí; acá
// solo cambia el layout (página completa, sin límite de alto) y que ahora se
// puede pasar al producto anterior/siguiente de la misma colección sin volver
// a la grilla.
function norm(valor) {
  return valor || null;
}

export default function ProductoDetalle({ producto, categoriaNombre, anterior, siguiente, onAgregarSuccess }) {
  const { agregar } = useCarrito();
  const precioBase = producto.precio;
  const variantes = useMemo(() => producto.variantes ?? [], [producto.variantes]);
  const imagenes = producto.imagenes ?? [];

  const tallasDisponibles = useMemo(
    () => [...new Set(variantes.map(v => norm(v.talla)).filter(Boolean))],
    [variantes]
  );
  const coloresDisponibles = useMemo(() => {
    const mapa = new Map();
    for (const v of variantes) {
      const nombre = norm(v.colorNombre);
      if (nombre && !mapa.has(nombre)) {
        mapa.set(nombre, { nombre, hex: v.colorHex });
      }
    }
    return [...mapa.values()];
  }, [variantes]);

  const [imgActiva, setImgActiva] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(tallasDisponibles[0] ?? null);
  const [colorSeleccionado, setColorSeleccionado] = useState(coloresDisponibles[0] ?? null);
  const [cantidad, setCantidad] = useState(1);

  const varianteActual = variantes.find(v =>
    norm(v.talla) === tallaSeleccionada &&
    norm(v.colorNombre) === (colorSeleccionado?.nombre ?? null)
  );
  const stockDisponible = varianteActual?.stock ?? 0;
  const hayStock = stockDisponible > 0;

  useEffect(() => {
    setCantidad((c) => Math.min(Math.max(c, 1), Math.max(stockDisponible, 1)));
  }, [varianteActual?.id, stockDisponible]);

  // Pedido del usuario (2026-09-02): tanto al entrar desde la Tienda como al
  // cambiar de producto (anterior/siguiente, o la sección de vecinos), la
  // idea es aterrizar directo sobre el producto, no sobre el banner
  // (TiendaHero, 100vh) que ahora vive arriba de esta página. El
  // `<ScrollToTop />` global (ver App.jsx) hace `window.scrollTo(0,0)` en
  // cada cambio de ruta — `requestAnimationFrame` corre después de ese
  // efecto en el mismo commit, así que este scroll manda al final. Este
  // componente se remonta entero por cada producto (`key={producto.id}` en
  // ProductoDetallePage), así que un efecto de solo-montaje alcanza tanto
  // para la primera carga como para cada cambio de producto.
  // El salto instantáneo se sentía brusco al cambiar de producto, así que va
  // animado — pero con `scrollSuaveA` (duración fija) en vez del
  // `behavior: 'smooth'` nativo (2026-09-02, pedido del usuario): la
  // distancia a recorrer acá siempre incluye el TiendaHero (100vh), y el
  // navegador alarga la animación nativa según la distancia, lo que se
  // sentía lento.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = document.querySelector('.pd-pagina');
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 90;
      scrollSuaveA(Math.max(y, 0));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const tallaTieneStock = (talla) =>
    variantes.some(v => norm(v.talla) === talla && v.stock > 0);
  const colorTieneStock = (colorNombre) =>
    variantes.some(v => norm(v.colorNombre) === colorNombre && v.stock > 0);

  const elegirTalla = (talla) => {
    setTallaSeleccionada(talla);
    const colorActualSigueValido = variantes.some(v =>
      norm(v.talla) === talla && norm(v.colorNombre) === (colorSeleccionado?.nombre ?? null) && v.stock > 0
    );
    if (!colorActualSigueValido) {
      const colorValido = coloresDisponibles.find(c =>
        variantes.some(v => norm(v.talla) === talla && norm(v.colorNombre) === c.nombre && v.stock > 0)
      );
      if (colorValido) setColorSeleccionado(colorValido);
    }
  };

  const elegirColor = (color) => {
    setColorSeleccionado(color);
    const tallaActualSigueValida = variantes.some(v =>
      norm(v.colorNombre) === color.nombre && norm(v.talla) === tallaSeleccionada && v.stock > 0
    );
    if (!tallaActualSigueValida) {
      const tallaValida = tallasDisponibles.find(t =>
        variantes.some(v => norm(v.colorNombre) === color.nombre && norm(v.talla) === t && v.stock > 0)
      );
      if (tallaValida) setTallaSeleccionada(tallaValida);
    }
  };

  const handleAgregar = () => {
    if (!varianteActual || !hayStock) return;

    const { variantes: _variantes, ...productoBase } = producto;
    agregar(
      {
        ...productoBase,
        id: varianteActual.id,
        talla: varianteActual.talla,
        colorNombre: varianteActual.colorNombre,
        colorHex: varianteActual.colorHex,
        categoriaNombre,
        stock: varianteActual.stock,
      },
      cantidad
    );

    onAgregarSuccess(producto.nombre);
    setCantidad(1);
  };

  return (
    <div className="pd-pagina">
      <div className="pd-container">
        {/* Ajuste pedido por el usuario (2026-09-02): un breadcrumb chico y
           discreto para volver a la tienda, arriba de todo. Lleva el id del
           producto actual como `state` — Tienda.jsx lo usa para aterrizar
           (con scroll + resalte) justo sobre esa tarjeta en vez de arriba
           de la grilla, el mismo criterio "en reversa" que el scroll
           directo al producto al entrar desde la tienda. */}
        <Link to="/tienda" state={{ volverAProductoId: producto.id }} className="pd-breadcrumb">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a la tienda
        </Link>

        {/* Pager de anterior/siguiente — reubicado arriba de la foto (pedido
           del usuario, 2026-09-02, sobre todo para tablet/mobile) en vez de
           al final de la ficha. */}
        {(anterior || siguiente) && (
          <div className="pd-vecinos">
            <span className="pd-vecinos-label">Sigue explorando esta colección</span>
            <div className="pd-vecinos-grid">
              {anterior ? (
                <Link to={`/tienda/producto/${anterior.id}`} className="pd-vecino-card">
                  <div className="pd-vecino-foto" style={{ background: anterior.bg }}>
                    {anterior.imagenes?.[0]
                      ? <img src={anterior.imagenes[0]} alt="" loading="lazy" />
                      : <span className="pd-vecino-emoji">{anterior.emoji}</span>}
                  </div>
                  <span className="pd-vecino-texto">
                    <span className="pd-vecino-eyebrow">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                      Anterior
                    </span>
                    <span className="pd-vecino-nombre">{anterior.nombre}</span>
                  </span>
                </Link>
              ) : <span className="pd-vecino-card pd-vecino-card--vacio" />}
              {siguiente ? (
                <Link to={`/tienda/producto/${siguiente.id}`} className="pd-vecino-card pd-vecino-card--siguiente">
                  <span className="pd-vecino-texto">
                    <span className="pd-vecino-eyebrow">
                      Siguiente
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </span>
                    <span className="pd-vecino-nombre">{siguiente.nombre}</span>
                  </span>
                  <div className="pd-vecino-foto" style={{ background: siguiente.bg }}>
                    {siguiente.imagenes?.[0]
                      ? <img src={siguiente.imagenes[0]} alt="" loading="lazy" />
                      : <span className="pd-vecino-emoji">{siguiente.emoji}</span>}
                  </div>
                </Link>
              ) : <span className="pd-vecino-card pd-vecino-card--vacio" />}
            </div>
          </div>
        )}

        <div className="pd-cuerpo">
          {/* Galería — a diferencia del modal, acá no compite por espacio
             vertical con la info de compra: la página entera puede crecer y
             scrollear como cualquier otra del sitio. */}
          <div className="pd-galeria">
            <div className="pd-galeria-frame" style={{ background: producto.bg }}>
              {imagenes.length > 0 ? (
                <img
                  src={imagenes[imgActiva]}
                  alt={`${producto.nombre} — imagen ${imgActiva + 1}`}
                  className="pd-galeria-foto"
                />
              ) : (
                <span className="pd-emoji">{producto.emoji}</span>
              )}
            </div>

            {imagenes.length > 1 && (
              <div className="pd-thumbs">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    className={`pd-thumb${i === imgActiva ? ' activo' : ''}`}
                    onClick={() => setImgActiva(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <img src={img} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info de compra — `.pd-info-col` es el grid item real (se estira
             por defecto a la altura de la fila, igual que la galería);
             `.pd-info` (más angosto en contenido) es quien lleva el
             `position: sticky` — mismo patrón de 2 capas que ya usa
             `compra-card-wrap`/`compra-card` en EventoDetalle.css. Sin esta
             segunda capa, sticky no tiene ningún margen dentro del cual
             moverse y se queda pegado a su posición normal (bug real
             encontrado probando esta página: la columna de info "se movía"
             igual que si no tuviera sticky). */}
          <div className="pd-info-col">
          <div className="pd-info">
            <span className="label-seccion label-rojo">{categoriaNombre}</span>
            <h1 className="pd-titulo">{producto.nombre}</h1>
            <div className="pd-precio-fila">
              <div className="pd-precio">
                {formatCOP(precioBase)}
                <span className="pd-precio-moneda">COP</span>
              </div>
              <div className="pd-precio-usd">≈ {formatUSD(precioBase)} USD</div>
            </div>

            <div className={`pd-stock-badge ${hayStock ? 'pd-stock-disponible' : 'pd-stock-agotado'}`}>
              <span className="pd-stock-dot" />
              {hayStock ? 'Disponible' : 'Agotado'}
            </div>

            <p className="pd-descripcion">{producto.descripcion}</p>

            {coloresDisponibles.length > 0 && (
              <div>
                <div className="pd-label">Color: <strong>{colorSeleccionado?.nombre}</strong></div>
                <div className="pd-colores-grupo" role="group" aria-label="Color">
                  {coloresDisponibles.map(color => (
                    <button
                      key={color.nombre}
                      className={`pd-color-swatch ${colorSeleccionado?.nombre === color.nombre ? 'activo' : ''}`}
                      style={{ '--swatch-color': color.hex }}
                      onClick={() => elegirColor(color)}
                      disabled={!colorTieneStock(color.nombre)}
                      aria-pressed={colorSeleccionado?.nombre === color.nombre}
                      aria-label={color.nombre}
                      title={color.nombre}
                    />
                  ))}
                </div>
              </div>
            )}

            {tallasDisponibles.length > 0 && (
              <div>
                <div className="pd-label">Talla: <strong>{tallaSeleccionada}</strong></div>
                <div className="pd-tallas-grupo" role="group" aria-label="Talla">
                  {tallasDisponibles.map(talla => (
                    <button
                      key={talla}
                      className={`pd-talla-btn ${tallaSeleccionada === talla ? 'activo' : ''}`}
                      onClick={() => elegirTalla(talla)}
                      disabled={!tallaTieneStock(talla)}
                      aria-pressed={tallaSeleccionada === talla}
                    >
                      {talla}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="pd-label">Cantidad</div>
              <div className="pd-cantidad-control">
                <button
                  className="pd-cantidad-btn"
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Restar cantidad"
                >−</button>
                <span className="pd-cantidad-num">{cantidad}</span>
                <button
                  className="pd-cantidad-btn"
                  onClick={() => setCantidad(c => Math.min(stockDisponible, c + 1))}
                  disabled={cantidad >= stockDisponible}
                  aria-label="Sumar cantidad"
                >+</button>
                {hayStock && stockDisponible <= 10 && (
                  <span className="pd-cantidad-max">quedan {stockDisponible}</span>
                )}
              </div>
            </div>

            <button
              className={`btn pd-btn-agregar ${hayStock ? 'btn-azul' : ''}`}
              onClick={handleAgregar}
              disabled={!hayStock}
              style={!hayStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {hayStock
                ? `Agregar al carrito · ${formatCOP(precioBase * cantidad)}`
                : 'Sin stock disponible'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
