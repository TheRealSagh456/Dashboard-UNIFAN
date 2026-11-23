import { apiRequest } from "./api";
import type { ClasseFrequencia, Dashboard, MedidasPergunta, PerguntaDashboard } from "../feats/home/dashboard-data";
import { formatarLimiteDeClasse } from "../utils/chart-layout";

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

function formatarClasse(classe: ClasseFrequencia): ClasseFrequencia {
  if (!classe.histograma) return classe;
  const { limiteInferior, limiteSuperior } = classe.histograma;
  const separador = classe.dados.includes("|-|") ? "|-|" : "|-";
  return {
    ...classe,
    dados: `${formatarLimiteDeClasse(limiteInferior)} ${separador} ${formatarLimiteDeClasse(limiteSuperior)}`,
  };
}

// A API calcula as medidas. Aqui somente os números recebem formato de exibição.
function formatarMedidas(originais: MedidasApi): MedidasPergunta {
  const medidas: MedidasPergunta = {};
  for (const [nome, valor] of Object.entries(originais)) {
    const itens = Array.isArray(valor) ? valor : [valor];
    if (nome === "moda") {
      const modas = itens.map((item) => typeof item === "number" ? formatador.format(item) : String(item));
      medidas.moda = modas.length > 1 ? modas : modas[0] ?? "Amodal";
      continue;
    }
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
    perguntas: data.perguntas.map((pergunta) => ({
      ...pergunta,
      distribuicao: pergunta.distribuicao.map(formatarClasse),
      ...(pergunta.distribuicaoAgrupada && {
        distribuicaoAgrupada: pergunta.distribuicaoAgrupada.map(formatarClasse),
      }),
      medidas: formatarMedidas(pergunta.medidas),
    })),
  };
}
