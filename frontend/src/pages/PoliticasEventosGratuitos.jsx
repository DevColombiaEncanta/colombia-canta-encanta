import PaginaLegal from "../components/PaginaLegal/PaginaLegal";
import { politicasEventosGratuitos } from "../data/legal/politicasEventosGratuitos";

export default function PoliticasEventosGratuitos() {
  return <PaginaLegal documento={politicasEventosGratuitos} ruta="/politicas-eventos-gratuitos" />;
}
