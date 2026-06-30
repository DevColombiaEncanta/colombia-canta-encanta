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

  const agregar = (producto, cantidad = 1) => {
    setItems(prev => {
      const existente = prev.find(item => item.id === producto.id);
      if (existente) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
  };

  const actualizarCantidad = (id, delta) => {
    setItems(prev =>
      prev
        .map(item => item.id === id ? { ...item, cantidad: item.cantidad + delta } : item)
        .filter(item => item.cantidad > 0)
    );
  };

  const eliminar = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ items, agregar, actualizarCantidad, eliminar, totalItems }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);
