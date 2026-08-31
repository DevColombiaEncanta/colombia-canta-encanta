import PaginaLegal from "../components/PaginaLegal/PaginaLegal";
import { politicasEventosPago } from "../data/legal/politicasEventosPago";

export default function PoliticasEventosPago() {
  return <PaginaLegal documento={politicasEventosPago} ruta="/politicas-eventos-pago" />;
}
