import { useState, useEffect } from 'react';
import { useCarrito } from '../../context/CarritoContext';
import './ProductoModal.css';

const TASA_USD = 4200;
const parseCOP = (precio) => parseInt(precio.replace(/\D/g, ''), 10);
const formatCOP = (num) => '$' + num.toLocaleString('es-CO');
const formatUSD = (num) => '$' + (num / TASA_USD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ProductoModal({ producto, onClose, onAgregarSuccess }) {
  const { agregar } = useCarrito();
  const precioBase = parseCOP(producto.precio);

  const [tallaSeleccionada, setTallaSeleccionada] = useState(
    producto.tallas.length > 0 ? producto.tallas[0] : null
  );
  const [colorSeleccionado, setColorSeleccionado] = useState(
    producto.colores.length > 0 ? producto.colores[0] : null
  );
  const [cantidad, setCantidad] = useState(1);

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
    const varianteId = [
      producto.id,
      tallaSeleccionada || 'unico',
      colorSeleccionado?.nombre || 'unico',
    ].join('-');

    agregar(
      {
        ...producto,
        id: varianteId,
        talla: tallaSeleccionada,
        color: colorSeleccionado,
      },
      cantidad
    );

    onAgregarSuccess(producto.nombre);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenedor" onClick={e => e.stopPropagation()}>

        {/* Imagen */}
        <div className="modal-imagen" style={{ background: producto.bg }}>
          <button className="modal-cerrar modal-cerrar-flotante" onClick={onClose} aria-label="Cerrar">✕</button>
          {producto.imagen ? (
            <img
              src={`${import.meta.env.BASE_URL}${producto.imagen}`}
              alt={producto.nombre}
              className="modal-foto"
            />
          ) : (
            <span className="modal-emoji">{producto.emoji}</span>
          )}
        </div>

        {/* Info */}
        <div className="modal-info">
          <div className="modal-info-header">
            <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <div>
            <span className="label-seccion label-rojo">{producto.categoria}</span>
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
          <div className={`stock-badge ${producto.stock ? 'stock-disponible' : 'stock-agotado'}`}>
            <span className="stock-dot" />
            {producto.stock ? 'Disponible' : 'Agotado'}
          </div>

          {/* Descripción */}
          <p className="modal-descripcion">{producto.descripcion}</p>

          {/* Colores */}
          {producto.colores.length > 0 && (
            <div>
              <div className="modal-label">
                Color: <strong>{colorSeleccionado?.nombre}</strong>
              </div>
              <div className="colores-grupo">
                {producto.colores.map(color => (
                  <button
                    key={color.nombre}
                    className={`color-swatch ${colorSeleccionado?.nombre === color.nombre ? 'activo' : ''}`}
                    style={{ '--swatch-color': color.hex }}
                    onClick={() => setColorSeleccionado(color)}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tallas */}
          {producto.tallas.length > 0 && (
            <div>
              <div className="modal-label">
                Talla: <strong>{tallaSeleccionada}</strong>
              </div>
              <div className="tallas-grupo">
                {producto.tallas.map(talla => (
                  <button
                    key={talla}
                    className={`talla-btn ${tallaSeleccionada === talla ? 'activo' : ''}`}
                    onClick={() => setTallaSeleccionada(talla)}
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
            className={`btn modal-btn-agregar ${producto.stock ? 'btn-azul' : ''}`}
            onClick={handleAgregar}
            disabled={!producto.stock}
            style={!producto.stock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {producto.stock
              ? `Agregar al carrito · ${formatCOP(precioBase * cantidad)}`
              : 'Sin stock disponible'}
          </button>
        </div>
      </div>
    </div>
  );
}
