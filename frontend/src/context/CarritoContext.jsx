import { createContext, useContext, useState, useEffect } from 'react';

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const guardado = localStorage.getItem('colombia-canta-carrito');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('colombia-canta-carrito', JSON.stringify(items));
  }, [items]);

  // `stock` (guardado en el item por ProductoDetalle al agregar) es el techo real
  // — sin él, sumar el mismo producto varias veces desde la tienda, o darle a
  // "+" en el carrito, podía pedir más unidades de las que existen para esa
  // combinación talla/color.
  const clampCantidad = (item, cantidadDeseada) =>
    item.stock != null ? Math.min(item.stock, cantidadDeseada) : cantidadDeseada;

  const agregar = (producto, cantidad = 1) => {
    setItems(prev => {
      const existente = prev.find(item => item.id === producto.id);
      if (existente) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: clampCantidad(item, item.cantidad + cantidad) }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: clampCantidad(producto, cantidad) }];
    });
  };

  const actualizarCantidad = (id, delta) => {
    setItems(prev =>
      prev
        .map(item => item.id === id ? { ...item, cantidad: clampCantidad(item, item.cantidad + delta) } : item)
        .filter(item => item.cantidad > 0)
    );
  };

  const eliminar = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const vaciar = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ items, agregar, actualizarCantidad, eliminar, vaciar, totalItems }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);
