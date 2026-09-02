import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TiendaHero from '../components/TiendaHero/TiendaHero';
import TiendaPaneles from '../components/TiendaPaneles/TiendaPaneles';
import ProductoDetalle from '../components/ProductoDetalle/ProductoDetalle';
import PageLoader from '../components/PageLoader/PageLoader';
import ContactoSection from '../components/Contacto/Contacto';
import Footer from '../components/Footer/Footer';
import { useProductos } from '../hooks/useProductos';
import { useCategoriasProducto } from '../hooks/useCategoriasProducto';
import { BASE_URL, OG_IMAGE } from '../utils/seo';

export default function ProductoDetallePage() {
  const { id } = useParams();
  const { productos, cargando: cargandoProductos, error: errorProductos } = useProductos();
  const { categorias, cargando: cargandoCategorias, error: errorCategorias } = useCategoriasProducto();
  const [toast, setToast] = useState(null);

  const cargando = cargandoProductos || cargandoCategorias;
  const error = errorProductos || errorCategorias;

  {/* Pedido del usuario (2026-09-02): antes se veía un "Cargando producto…"
     en texto plano, con TiendaHero recién apareciendo al terminar de
     cargar — el salto de layout se sentía como una recarga de página. Con
     el mismo banner ya puesto durante la carga, la transición es continua
     en vez de un cambio brusco de estructura. */}
  if (cargando) {
    return (
      <main>
        <TiendaHero />
        <PageLoader texto="Cargando producto…" />
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <TiendaHero />
        <div className="container">
          <div className="noticias-page-empty">
            <p>No se pudo cargar el producto. Intenta de nuevo más tarde.</p>
          </div>
        </div>
      </main>
    );
  }

  const producto = productos.find(p => p.id === id);
  if (!producto) return <Navigate to="/404" />;

  // "Anterior/siguiente" respeta la colección (drop) del producto actual —
  // pedido explícito del usuario: pasar de un producto a otro sin salir de
  // la colección que estaba mirando, no del catálogo entero.
  const mismaColeccion = productos.filter(p => p.coleccionId === producto.coleccionId);
  const idx = mismaColeccion.findIndex(p => p.id === producto.id);
  const anterior = idx > 0 ? mismaColeccion[idx - 1] : null;
  const siguiente = idx < mismaColeccion.length - 1 ? mismaColeccion[idx + 1] : null;

  const categoriaNombre = categorias.find(c => c.id === producto.categoriaId)?.nombre;

  const title = `${producto.nombre} | Colombia Canta y Encanta`;
  const description = producto.descripcion;

  const handleAgregarSuccess = (nombre) => {
    setToast(`"${nombre}" agregado al carrito`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <main>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/#/tienda/producto/${producto.id}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={producto.imagenes?.[0] ?? OG_IMAGE} />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:site_name" content="Colombia Canta y Encanta" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={producto.imagenes?.[0] ?? OG_IMAGE} />
      </Helmet>

      {/* Mismo banner de arriba de la Tienda principal — pedido del usuario
         para que la página de producto no arranque "en seco". */}
      <TiendaHero />

      {/* `key={producto.id}` fuerza un montaje nuevo por cada producto — mismo
         criterio que EventoDetallePage: navegar de un producto a otro con las
         flechas de "anterior/siguiente" es client-side (no recarga la
         página), así que sin esto el estado interno (imagen activa, talla,
         color, cantidad) quedaría pegado del producto anterior. */}
      <ProductoDetalle
        key={producto.id}
        producto={producto}
        categoriaNombre={categoriaNombre}
        anterior={anterior}
        siguiente={siguiente}
        onAgregarSuccess={handleAgregarSuccess}
      />

      {toast && (
        <div className="pd-toast" role="status">✓ {toast}</div>
      )}

      {/* Mismos paneles del final de la Tienda principal ("Hecho en
         Colombia" / "Accesorios") — mismo pedido de arriba. */}
      <TiendaPaneles />

      <ContactoSection />
      <Footer />
    </main>
  );
}
