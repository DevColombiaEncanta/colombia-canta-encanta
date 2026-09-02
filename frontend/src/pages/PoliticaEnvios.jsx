import PaginaLegal from "../components/PaginaLegal/PaginaLegal";
import { politicaEnvios } from "../data/legal/politicaEnvios";

export default function PoliticaEnvios() {
  return <PaginaLegal documento={politicaEnvios} ruta="/politica-envios" />;
}
