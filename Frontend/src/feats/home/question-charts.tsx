import { BoxplotChart, CartesianChart, PieChart, Text } from "../../components";
import {
  type PerguntaDashboard,
  type TipoGrafico,
} from "./dashboard-data";

function dadosCartesianos(pergunta: PerguntaDashboard) {
  return pergunta.distribuicao.map((item) => ({
    label: item.dados,
    xValue: item.valor,
    value: item.fi,
    detail: `${item.frPercentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ${pergunta.respostasMultiplas ? "dos participantes que responderam" : "das respostas válidas"}`,
    histogram: item.histograma && {
      lowerBound: item.histograma.limiteInferior,
      upperBound: item.histograma.limiteSuperior,
      density: item.histograma.densidade,
    },
  }));
}

function GraficoPizza({ pergunta }: { pergunta: PerguntaDashboard }) {
  return (
    <PieChart
      data={pergunta.distribuicao.map((item) => ({
        label: item.dados,
        value: item.fi,
        percentual: item.frPercentual,
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
      xLabel={pergunta.unidade ?? "Valor"}
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
  if (!pergunta.respostasValidas) return <Text tone="muted" className="py-8 text-center">Não há respostas válidas para esta pergunta.</Text>;
  if (pergunta.respostasMultiplas) grafico = "Barras";
  if (grafico === "Pizza") return <GraficoPizza pergunta={pergunta} />;
  if (grafico === "Boxplot") return <GraficoBoxplot pergunta={pergunta} />;

  const qualitativa = pergunta.tipo === "Qualitativa";
  const eixoDados = qualitativa
    ? "Categorias"
    : pergunta.unidade ?? "Dados";

  return (
    <>
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
        yLabel={
          grafico === "Barras"
            ? "Categorias"
            : grafico === "Histograma"
              ? "Densidade de frequência"
              : "Quantidade"
        }
        ariaLabel={`${grafico} da pergunta ${pergunta.codigo}`}
        className="pt-4"
      />
      {grafico === "Histograma" && (
        <Text variant="caption" tone="muted" className="mt-2">
          A área de cada barra representa a quantidade de respostas. Consulte o intervalo e a frequência no tooltip.
        </Text>
      )}
    </>
  );
}
