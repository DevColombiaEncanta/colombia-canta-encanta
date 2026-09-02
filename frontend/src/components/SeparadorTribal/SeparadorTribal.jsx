import './SeparadorTribal.css';

// Pedido del usuario (2026-09-02): una franja decorativa entre el Hero y
// "Quiénes Somos" — inspirada en las grecas/frisos geométricos de textiles
// indígenas colombianos (Wayuu, entre otros), como contraste con la franja
// plana de 3 colores que ya se usa en el footer y en los separadores de
// antetítulo/título. Vive fuera del Hero (que ya tiene su propia franja
// absoluta de "próximo evento" pegada a SU borde inferior) para no pisarla.
export default function SeparadorTribal() {
  return <div className="separador-tribal" aria-hidden="true" />;
}
