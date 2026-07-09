import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductoModal from '../components/ProductoModal/ProductoModal';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import { coleccionesSuperiores, productos } from '../data/productos';
import { BASE_URL, OG_IMAGE } from '../utils/seo';
import './Tienda.css';

const PAGE_TITLE = 'Tienda | Colombia Canta y Encanta';
const PAGE_DESC = 'Merch oficial de Colombia Canta y Encanta: camisetas, hoodies, tote bags y más. Lleva un pedacito de la cultura colombiana contigo.';

const categorias = ['Todos', 'Camisetas', 'Hoodies', 'Bags', 'Otros'];

const parsePrecio = (precio) => parseInt(precio.replace(/\D/g, ''), 10);

const heroSlides = [
  {
    img: 'tienda-hero/sonidos-que-nos-unen.webp',
    tagline: 'SONIDOS QUE NOS UNEN',
    parrafo: 'Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.',
    cta: 'VER COLECCIÓN',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-1.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
    cta: 'COMPRAR AHORA',
  },
  {
    img: 'tienda-hero/viste-lo-que-sientes-2.webp',
    tagline: 'VISTE LO QUE SIENTES',
    parrafo: 'Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.',
    cta: 'COMPRAR AHORA',
  },
];

const visteImgs = [
  'tienda-hero/viste-lo-que-sientes-1.webp',
  'tienda-hero/viste-lo-que-sientes-2.webp',
];

export default function Tienda() {
  const [coleccionActiva, setColeccionActiva] = useState('novedades');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [ordenarPor, setOrdenarPor] = useState('relevancia');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);
  const [heroSlideActivo, setHeroSlideActivo] = useState(0);
  const [visteActivo, setVisteActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroSlideActivo(i => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVisteActivo(i => (i + 1) % visteImgs.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtrados = productos
    .filter(p => p.coleccion === coleccionActiva)
    .filter(p => categoriaActiva === 'Todos' || p.categoria === categoriaActiva)
    .sort((a, b) => {
      if (ordenarPor === 'precio-bajo') return parsePrecio(a.precio) - parsePrecio(b.precio);
      if (ordenarPor === 'precio-alto') return parsePrecio(b.precio) - parsePrecio(a.precio);
      return 0;
    });

  const coleccionLabel = coleccionesSuperiores.find(c => c.id === coleccionActiva)?.nombre ?? 'PRODUCTOS';

  const handleAgregarSuccess = (nombre) => {
    setToast(`"${nombre}" agregado al carrito`);
    setTimeout(() => setToast(null), 2500);
  };

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

      {/* 1. Hero editorial asimétrico */}
      <section className="tienda-editorial-hero">
        <div
          className="hero-col-izq"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}tienda-hero/sonidos-que-nos-unen.webp)` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">SONIDOS QUE NOS UNEN</h2>
            <p className="hero-ed-parrafo">Piezas que cuentan historias, inspiradas en lo que somos, en nuestra gente y en la música que nos mueve.</p>
            <button className="hero-ed-btn">VER COLECCIÓN</button>
          </div>
        </div>
        <div className="hero-col-der">
          {visteImgs.map((img, i) => (
            <div
              key={i}
              className="hero-col-der-bg"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${img})`,
                opacity: i === visteActivo ? 1 : 0,
              }}
            />
          ))}
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">VISTE LO QUE SIENTES</h2>
            <p className="hero-ed-parrafo">Diseños únicos para llevar contigo tu orgullo, a donde quiera que vayas.</p>
            <button className="hero-ed-btn">COMPRAR AHORA</button>
          </div>
        </div>
      </section>

      {/* 1b. Hero como carrusel único — solo tablet/mobile */}
      <section className="tienda-hero-carrusel">
        <div
          className="hero-carrusel-slide"
          style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65) 15%, transparent 60%), url(${import.meta.env.BASE_URL}${heroSlides[heroSlideActivo].img})` }}
        >
          <div className="hero-editorial-contenido">
            <h2 className="hero-ed-tagline">{heroSlides[heroSlideActivo].tagline}</h2>
            <p className="hero-ed-parrafo">{heroSlides[heroSlideActivo].parrafo}</p>
            <button className="hero-ed-btn">{heroSlides[heroSlideActivo].cta}</button>
          </div>
        </div>
        <div className="hero-carrusel-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-carrusel-dot${i === heroSlideActivo ? ' activo' : ''}`}
              onClick={() => setHeroSlideActivo(i)}
              aria-label={`Ver imagen ${i + 1}`}
            />
          ))}
        </div>
      </section>

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
            {coleccionesSuperiores.map(col => (
              <button
                key={col.id}
                onClick={() => setColeccionActiva(col.id)}
                className={`btn-drop-tab ${coleccionActiva === col.id ? 'activo' : ''}`}
              >
                <span className="drop-tab-emoji">{col.emoji}</span> {col.nombre}
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
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`btn-categoria-tag ${categoriaActiva === cat ? 'activo' : ''}`}
              >
                {cat}
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
          <div className={`productos-grid${coleccionActiva === 'novedades' ? ' fila-unica-novedades' : ''}`}>
            {filtrados.map(prod => (
              <div
                key={prod.id}
                className="producto-card"
                onClick={() => setProductoSeleccionado(prod)}
              >
                {/* Zona imagen */}
                <div className="producto-card-imagen" style={{ background: prod.bg }}>
                  {prod.tag && <span className="producto-card-badge">{prod.tag}</span>}
                  {!prod.stock && <span className="producto-card-agotado">Agotado</span>}
                  {(prod.imagenes?.[0] ?? prod.imagen) ? (
                    <img
                      src={`${import.meta.env.BASE_URL}${prod.imagenes?.[0] ?? prod.imagen}`}
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
                    onClick={(e) => { e.stopPropagation(); setProductoSeleccionado(prod); }}
                  >
                    <span>Añadir al carrito</span>
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
                    <span className="producto-card-precio">{prod.precio}</span>
                  </div>
                  <span className="producto-card-cat-label">{prod.categoria}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Paneles inferiores: siempre visibles */}
      <section className="seccion-paneles-inferiores">
        <div className="container-tienda">
          <div className="grid-paneles-dobles">
            <div
              className="panel-inferior-item hecho-en-colombia"
              style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 10%, transparent 65%), url(${import.meta.env.BASE_URL}tienda-paneles/hecho-en-colombia.webp)` }}
            >
              <div className="panel-inf-contenido">
                <h2 className="panel-inf-titulo">❤️ HECHO EN COLOMBIA</h2>
                <p className="panel-inf-texto">Diseñado y producido localmente con orgullo y propósito.</p>
              </div>
            </div>
            <div
              className="panel-inferior-item accesorios-destacados"
              style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 10%, transparent 65%), url(${import.meta.env.BASE_URL}tienda-paneles/accesorios.webp)` }}
            >
              <div className="panel-inf-contenido">
                <h2 className="panel-inf-titulo">✨ ACCESORIOS</h2>
                <p className="panel-inf-texto">Pequeños detalles que dicen grandes cosas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="tienda-toast">✓ {toast}</div>
      )}

      {/* Modal de producto */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          onAgregarSuccess={handleAgregarSuccess}
        />
      )}

      <ContactoSection />
      <Footer />
    </main>
  );
}
