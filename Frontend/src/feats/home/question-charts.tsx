import { BoxplotChart, CartesianChart, PieChart } from "../../components";
import {
  totalRespostasValidas,
  type PerguntaDashboard,
  type TipoGrafico,
} from "./dashboard-data";

const rotulosQuantitativos: Record<string, string> = {
  q01: "Idade (anos)",
  q02: "Dispositivos",
  q03: "Horas de uso por dia",
  q04: "Horas em redes sociais por dia",
  q05: "Aplicativos instalados",
  q06: "Tempo com smartphone (anos)",
  q07: "Gasto mensal (reais)",
  q08: "Idade de início (anos)",
  q09: "Horas de sono perdidas por semana",
  q10: "Trocas de senha no ano",
};

function dadosCartesianos(pergunta: PerguntaDashboard) {
  const total = totalRespostasValidas(pergunta);
  return pergunta.distribuicao.map((item) => ({
    label: item.dados,
    value: item.fi,
    detail: `${((item.fi / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das respostas válidas`,
  }));
}

function GraficoPizza({ pergunta }: { pergunta: PerguntaDashboard }) {
  return (
    <PieChart
      data={pergunta.distribuicao.map((item) => ({
        label: item.dados,
        value: item.fi,
      }))}
      ariaLabel={`Gráfico de pizza da ${pergunta.codigo}`}
      className="py-5"
    />
  );
}

function GraficoBoxplot({ pergunta }: { pergunta: PerguntaDashboard }) {
  const resumo = pergunta.boxplot;
  if (!resumo) return null;

  return (
    <BoxplotChart
      key={pergunta.id}
      data={{
        minimum: resumo.minimo,
        firstQuartile: resumo.primeiroQuartil,
        median: resumo.mediana,
        thirdQuartile: resumo.terceiroQuartil,
        maximum: resumo.maximo,
      }}
      xLabel={rotulosQuantitativos[pergunta.id] ?? pergunta.unidade ?? "Valor"}
      ariaLabel={`Boxplot da ${pergunta.codigo}`}
    />
  );
}

export function VisualizacaoPergunta({
  pergunta,
  grafico,
}: {
  pergunta: PerguntaDashboard;
  grafico: TipoGrafico;
}) {
  if (grafico === "Pizza") return <GraficoPizza pergunta={pergunta} />;
  if (grafico === "Boxplot") return <GraficoBoxplot pergunta={pergunta} />;

  const qualitativa = pergunta.tipo === "Qualitativa";
  const eixoDados = qualitativa
    ? "Categorias"
    : rotulosQuantitativos[pergunta.id] ?? pergunta.unidade ?? "Dados";

  return (
    <CartesianChart
      key={`${pergunta.id}-${grafico}`}
      data={dadosCartesianos(pergunta)}
      variant={
        grafico === "Barras"
          ? "bars"
          : grafico === "Pontos"
            ? "line"
            : grafico === "Histograma"
              ? "histogram"
              : "columns"
      }
      xLabel={grafico === "Barras" ? "Quantidade" : eixoDados}
      yLabel={grafico === "Barras" ? "Categorias" : "Quantidade"}
      ariaLabel={`${grafico} da pergunta ${pergunta.codigo}`}
      className="pt-4"
    />
  );
}
