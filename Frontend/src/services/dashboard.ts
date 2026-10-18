import { apiRequest } from "./api";
import type { Dashboard, MedidasPergunta, PerguntaDashboard } from "../feats/home/dashboard-data";

type MedidasApi = {
  media?: number;
  mediana?: number | string | string[];
  moda?: Array<number | string>;
  primeiroQuartil?: number;
  terceiroQuartil?: number;
};
type DashboardApi = {
  pesquisa: Dashboard["pesquisa"];
  perguntas: Array<Omit<PerguntaDashboard, "medidas"> & { medidas: MedidasApi }>;
};
const formatador = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

// A API calcula as medidas. Aqui somente os números recebem formato de exibição.
function formatarMedidas(originais: MedidasApi): MedidasPergunta {
  const medidas: MedidasPergunta = {};
  for (const [nome, valor] of Object.entries(originais)) {
    const itens = Array.isArray(valor) ? valor : [valor];
    medidas[nome as keyof MedidasPergunta] = itens.length
      ? itens.map((item) => typeof item === "number" ? formatador.format(item) : item).join(" / ")
      : "Amodal";
  }
  return medidas;
}

export async function carregarDashboard(pesquisaId = "atual"): Promise<Dashboard> {
  const { data } = await apiRequest<DashboardApi>(`/api/pesquisas/${encodeURIComponent(pesquisaId)}/dashboard`);
  return {
    pesquisa: data.pesquisa,
    perguntas: data.perguntas.map((pergunta) => ({ ...pergunta, medidas: formatarMedidas(pergunta.medidas) })),
  };
}
