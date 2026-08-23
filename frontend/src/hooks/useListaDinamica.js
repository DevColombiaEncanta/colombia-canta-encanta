import { useState } from 'react';

// Estado + operaciones para listas dinámicas de "agregar/editar/quitar fila"
// (CTAs de Hero, párrafos de Noticias, y ahora pills/zonas/testimonios/programa
// de Eventos, 5.3a) — mismo patrón repetido a mano 2 veces antes de esto; con
// una pantalla que necesita 4 listas de este tipo a la vez, vale la pena
// extraerlo en vez de repetir el mismo trío de funciones 4 veces más.
export function useListaDinamica(inicial = []) {
  const [items, setItems] = useState(inicial);

  // Para listas de objetos ({icono, texto}, {nombre, precio}...): actualiza un campo puntual.
  function actualizar(idx, campo, valor) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [campo]: valor } : item)));
  }

  // Para listas de strings simples (ej. `programa`): reemplaza el ítem completo.
  function actualizarSimple(idx, valor) {
    setItems((prev) => prev.map((item, i) => (i === idx ? valor : item)));
  }

  function agregar(itemVacio) {
    setItems((prev) => [...prev, itemVacio]);
  }

  function quitar(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return { items, setItems, actualizar, actualizarSimple, agregar, quitar };
}
