import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TiendaHero from '../components/TiendaHero/TiendaHero';
import TiendaPaneles from '../components/TiendaPaneles/TiendaPaneles';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import { useProductos } from '../hooks/useProductos';
import { useColecciones } from '../hooks/useColecciones';
import { useCategoriasProducto } from '../hooks/useCategoriasProducto';
import { formatCOP } from '../utils/formato';
import { scrollSuaveA } from '../utils/scroll';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import './Tienda.css';

const PAGE_TITLE = 'Tienda | Colombia Canta y Encanta';
const PAGE_DESC = 'Merch oficial de Colombia Canta y Encanta: camisetas, hoodies, tote bags y más. Lleva un pedacito de la cultura colombiana contigo.';

const CATEGORIA_TODOS = 'Todos';

export default function Tienda() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos();
  const { colecciones, cargando: cargandoColecciones, error: errorColecciones } = useColecciones();
  const { categorias, cargando: cargandoCategorias, error: errorCategorias } = useCategoriasProducto();

  const [coleccionActiva, setColeccionActiva] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIA_TODOS);
  const [ordenarPor, setOrdenarPor] = useState('relevancia');

  // Pedido del usuario (2026-09-02): al volver desde el detalle de un
  // producto ("Volver a la tienda"), la idea es aterrizar sobre la tarjeta
  // de ESE producto en la grilla, no arriba de todo — mismo criterio en
  // reversa que el scroll directo al producto al entrar. El id viaja como
  // `state` de router (ver el Link en ProductoDetalle.jsx), no por query
  // param, para no ensuciar la URL de la tienda.
  const volverAProductoId = location.state?.volverAProductoId ?? null;
  const [resaltadoId, setResaltadoId] = useState(null);

  useEffect(() => {
    if (!volverAProductoId || productos.length === 0) return;
    const prod = productos.find(p => p.id === volverAProductoId);
    if (!prod) return;
    // La colección/categoría activa puede no ser la del producto al que se
    // vuelve — sin esto, la tarjeta ni siquiera estaría en la grilla actual.
    setColeccionActiva(prod.coleccionId);
    setCategoriaActiva(CATEGORIA_TODOS);
    setResaltadoId(prod.id);
  }, [volverAProductoId, productos]);

  useEffect(() => {
    if (!resaltadoId) return;
    // `scrollSuaveA` (duración fija) en vez de `scrollIntoView({behavior:
    // 'smooth'})` — pedido del usuario (2026-09-02): la vuelta a un producto
    // lejos en la grilla se sentía lenta, porque el navegador alarga la
    // animación nativa según la distancia a recorrer.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(`producto-${resaltadoId}`);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + (el.offsetHeight / 2);
      scrollSuaveA(Math.max(y, 0));
    });
    const timer = setTimeout(() => setResaltadoId(null), 1800);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [resaltadoId]);

  const cargando = cargandoProductos || cargandoColecciones || cargandoCategorias;
  const error = errorProductos || errorColecciones || errorCategorias;

  // Colecciones son administrables desde el panel — se activa la primera (ya
  // viene ordenada por `orden` desde el backend) en cuanto llegan. Hallazgo de
  // la auditoría de 5.4: esto vivía en un `useEffect`, con un `setState`
  // síncrono en el cuerpo — dispara `react-hooks/set-state-in-effect`.
  // Ajustado durante el render en vez de en un efecto, mismo criterio que ya
  // usa este proyecto (ver Hero.jsx/Noticias.jsx/AdminSidebar.jsx y
  // https://react.dev/learn/you-might-not-need-an-effect) — la condición
  // `coleccionActiva === null` se vuelve falsa apenas se ejecuta, así que no
  // hay riesgo de loop.
  if (colecciones.length > 0 && coleccionActiva === null) {
    setColeccionActiva(colecciones[0].id);
  }

  const filtrados = productos
    .filter(p => p.coleccionId === coleccionActiva)
    .filter(p => categoriaActiva === CATEGORIA_TODOS || p.categoriaId === categoriaActiva)
    .sort((a, b) => {
      if (ordenarPor === 'precio-bajo') return a.precio - b.precio;
      if (ordenarPor === 'precio-alto') return b.precio - a.precio;
      return 0;
    });

  const coleccionLabel = colecciones.find(c => c.id === coleccionActiva)?.nombre ?? 'PRODUCTOS';

  return (
    <main className="tienda-layout-raiz">

      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/tienda`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESC} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      {/* 1. Hero editorial (compartido con ProductoDetalle, ver TiendaHero.jsx) */}
      <TiendaHero />

      {/* 2. Ticker de anuncios */}
      <div className="tienda-anuncios-ticker">
        <div className="ticker-track">
          {[...Array(4)].map((_, idx) => (
            <span key={idx} className="ticker-text">
              ENVÍO GRATIS DESDE $220.000 &nbsp;•&nbsp; REGÍSTRATE A NUESTRA NEWSLETTER Y OBTÉN 10% DE DESCUENTO &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* 3. Pestañas de drops/colecciones */}
      <section className="seccion-colecciones-drops">
        <div className="container-tienda">
          <div className="grid-colecciones-links">
            {colecciones.map(col => (
              <button
                key={col.id}
                onClick={() => setColeccionActiva(col.id)}
                className={`btn-drop-tab ${coleccionActiva === col.id ? 'activo' : ''}`}
              >
                {col.emoji && <span className="drop-tab-emoji">{col.emoji}</span>} {col.nombre}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Filtros por categoría + orden */}
      <section className="seccion-barra-navegacion-filtros">
        <div className="container-tienda">
          <span className="label-filtrar-por">FILTRAR POR CATEGORÍA</span>
          <div className="flex-tags-categorias">
            {[{ id: CATEGORIA_TODOS, nombre: CATEGORIA_TODOS }, ...categorias].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`btn-categoria-tag ${categoriaActiva === cat.id ? 'activo' : ''}`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          <div className="tienda-subcabecera-grid-cabecera">
            <h2 className="titulo-coleccion-actual">
              {coleccionLabel} <span className="estrella-decorativa">★</span>
            </h2>
            <div className="control-ordenar-dropdown">
              <span className="label-ordenar">ORDENAR POR</span>
              <div className="select-ordenar-wrap">
                <select value={ordenarPor} onChange={e => setOrdenarPor(e.target.value)} className="select-ordenar-native">
                  <option value="relevancia">Relevancia</option>
                  <option value="precio-bajo">Precio: Menor a Mayor</option>
                  <option value="precio-alto">Precio: Mayor a Menor</option>
                </select>
                <svg className="select-ordenar-icono" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Grid de productos — card propia del sitio */}
      <section className="seccion-grid-productos-galeria">
        <div className="container-tienda">

          {cargando && (
            <div className="tienda-grid-estado"><p>Cargando productos…</p></div>
          )}

          {!cargando && error && (
            <div className="tienda-grid-estado"><p>No se pudieron cargar los productos. Intenta de nuevo más tarde.</p></div>
          )}

          {!cargando && !error && productos.length === 0 && (
            <div className="tienda-grid-estado"><p>Aún no hay productos publicados. Vuelve pronto.</p></div>
          )}

          {!cargando && !error && productos.length > 0 && (
          <div className="productos-grid">
            {filtrados.map(prod => (
              <div
                key={prod.id}
                id={`producto-${prod.id}`}
                className={`producto-card${resaltadoId === prod.id ? ' producto-card--resaltado' : ''}`}
                onClick={() => navigate(`/tienda/producto/${prod.id}`)}
              >
                {/* Zona imagen */}
                <div className="producto-card-imagen" style={{ background: prod.bg }}>
                  {prod.tag && <span className="producto-card-badge">{prod.tag}</span>}
                  {!prod.enStock && <span className="producto-card-agotado">Agotado</span>}
                  {prod.imagenes?.[0] ? (
                    <img
                      src={prod.imagenes[0]}
                      alt={prod.nombre}
                      className="producto-card-foto"
                      loading="lazy"
                    />
                  ) : (
                    <span className="producto-card-emoji" aria-hidden="true">{prod.emoji}</span>
                  )}

                  {/* Barra hover */}
                  <div
                    className="producto-card-hover-bar"
                    onClick={(e) => { e.stopPropagation(); navigate(`/tienda/producto/${prod.id}`); }}
                  >
                    <span>Ver producto</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>

                {/* Info debajo */}
                <div className="producto-card-info">
                  <div className="producto-card-fila-top">
                    <span className="producto-card-nombre">{prod.nombre}</span>
                    <span className="producto-card-precio">{formatCOP(prod.precio)}</span>
                  </div>
                  <span className="producto-card-cat-label">
                    {categorias.find(c => c.id === prod.categoriaId)?.nombre}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* 6. Paneles inferiores (compartido con ProductoDetalle, ver TiendaPaneles.jsx) */}
      <TiendaPaneles />

      <ContactoSection />
      <Footer />
    </main>
  );
}
