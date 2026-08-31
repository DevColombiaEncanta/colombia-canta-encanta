import PaginaLegal from "../components/PaginaLegal/PaginaLegal";
import { terminosCondiciones } from "../data/legal/terminosCondiciones";

export default function TerminosCondiciones() {
  return <PaginaLegal documento={terminosCondiciones} ruta="/terminos-y-condiciones" />;
}
