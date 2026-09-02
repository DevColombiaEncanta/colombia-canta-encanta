import './TiendaPaneles.css';

// Extraído de Tienda.jsx (2026-09-01) por el mismo motivo que TiendaHero —
// el usuario pidió reusar estos 2 paneles ("Hecho en Colombia" / "Accesorios
// destacados") también en la página de detalle de producto.
export default function TiendaPaneles() {
  return (
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
  );
}
