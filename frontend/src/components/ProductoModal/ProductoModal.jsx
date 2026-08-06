import { useState, useEffect, useMemo } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import { formatCOP } from '../../utils/formato';
import './ProductoModal.css';

const TASA_USD = 4200;
const formatUSD = (num) => '$' + (num / TASA_USD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductoModal({ producto, categoriaNombre, onClose, onAgregarSuccess }) {
  const { agregar } = useCarrito();
  const precioBase = producto.precio;
  const variantes = useMemo(() => producto.variantes ?? [], [producto.variantes]);

  const imagenes = producto.imagenes ?? [];

  // Cada producto tiene siempre al menos una fila en producto_variantes (aunque
  // sea sin talla/color real, ambos en null) — los selectores solo se muestran
  // si de verdad hay más de un valor entre las variantes reales.
  const tallasDisponibles = useMemo(
    () => [...new Set(variantes.map(v => v.talla).filter(Boolean))],
    [variantes]
  );
  const coloresDisponibles = useMemo(() => {
    const mapa = new Map();
    for (const v of variantes) {
      if (v.colorNombre && !mapa.has(v.colorNombre)) {
        mapa.set(v.colorNombre, { nombre: v.colorNombre, hex: v.colorHex });
      }
    }
    return [...mapa.values()];
  }, [variantes]);

  const [imgActiva, setImgActiva] = useState(0);
  const [tallaSeleccionada, setTallaSeleccionada] = useState(tallasDisponibles[0] ?? null);
  const [colorSeleccionado, setColorSeleccionado] = useState(coloresDisponibles[0] ?? null);
  const [cantidad, setCantidad] = useState(1);

  // Variante exacta (talla + color) que corresponde a la selección actual —
  // determina el stock real disponible para agregar al carrito.
  const varianteActual = variantes.find(v =>
    (v.talla ?? null) === tallaSeleccionada &&
    (v.colorNombre ?? null) === (colorSeleccionado?.nombre ?? null)
  );
  const hayStock = (varianteActual?.stock ?? 0) > 0;

  // Para deshabilitar combinaciones agotadas: dada la talla/color ya elegido,
  // ¿la otra dimensión tiene stock real en esa combinación puntual?
  const tallaTieneStock = (talla) =>
    variantes.some(v => v.talla === talla && (v.colorNombre ?? null) === (colorSeleccionado?.nombre ?? null) && v.stock > 0);
  const colorTieneStock = (colorNombre) =>
    variantes.some(v => (v.talla ?? null) === tallaSeleccionada && v.colorNombre === colorNombre && v.stock > 0);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
      },
      cantidad
    );

    onAgregarSuccess(producto.nombre);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenedor" onClick={e => e.stopPropagation()}>

        {/* Imagen + galería */}
        <div className="modal-imagen" style={{ background: producto.bg }}>
          <button className="modal-cerrar modal-cerrar-flotante" onClick={onClose} aria-label="Cerrar">✕</button>

          {imagenes.length > 0 ? (
            <img
              src={imagenes[imgActiva]}
              alt={`${producto.nombre} — imagen ${imgActiva + 1}`}
              className="modal-foto"
            />
          ) : (
            <span className="modal-emoji">{producto.emoji}</span>
          )}

          {imagenes.length > 1 && (
            <div className="modal-thumbs">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  className={`modal-thumb${i === imgActiva ? ' activo' : ''}`}
                  onClick={() => setImgActiva(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="modal-info">
          <div className="modal-info-header">
            <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <div>
            <span className="label-seccion label-rojo">{categoriaNombre}</span>
            <h2 className="modal-titulo">{producto.nombre}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
              <div className="modal-precio">
                {formatCOP(precioBase)}
                <span className="modal-precio-moneda">COP</span>
              </div>
              <div className="modal-precio-usd">
                ≈ {formatUSD(precioBase)} USD
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className={`stock-badge ${hayStock ? 'stock-disponible' : 'stock-agotado'}`}>
            <span className="stock-dot" />
            {hayStock ? 'Disponible' : 'Agotado'}
          </div>

          {/* Descripción */}
          <p className="modal-descripcion">{producto.descripcion}</p>

          {/* Colores */}
          {coloresDisponibles.length > 0 && (
            <div>
              <div className="modal-label">
                Color: <strong>{colorSeleccionado?.nombre}</strong>
              </div>
              <div className="colores-grupo">
                {coloresDisponibles.map(color => (
                  <button
                    key={color.nombre}
                    className={`color-swatch ${colorSeleccionado?.nombre === color.nombre ? 'activo' : ''}`}
                    style={{ '--swatch-color': color.hex }}
                    onClick={() => setColorSeleccionado(color)}
                    disabled={!colorTieneStock(color.nombre)}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tallas */}
          {tallasDisponibles.length > 0 && (
            <div>
              <div className="modal-label">
                Talla: <strong>{tallaSeleccionada}</strong>
              </div>
              <div className="tallas-grupo">
                {tallasDisponibles.map(talla => (
                  <button
                    key={talla}
                    className={`talla-btn ${tallaSeleccionada === talla ? 'activo' : ''}`}
                    onClick={() => setTallaSeleccionada(talla)}
                    disabled={!tallaTieneStock(talla)}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <div className="modal-label">Cantidad</div>
            <div className="cantidad-control">
              <button
                className="cantidad-btn"
                onClick={() => setCantidad(c => Math.max(1, c - 1))}
              >
                −
              </button>
              <span className="cantidad-num">{cantidad}</span>
              <button
                className="cantidad-btn"
                onClick={() => setCantidad(c => c + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Agregar al carrito */}
          <button
            className={`btn modal-btn-agregar ${hayStock ? 'btn-azul' : ''}`}
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
  );
}
