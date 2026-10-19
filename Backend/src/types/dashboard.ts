import type { TipoVariavel } from "./importacao.ts";

export type ValorEstatistico = number | string;
export type TipoGrafico = "Colunas" | "Barras" | "Pontos" | "Pizza" | "Histograma" | "Boxplot";
export type CategoriaPergunta = "Discreta" | "Contínua" | "Nominal" | "Ordinal";
export type Medidas = {
  media?: number;
  mediana?: ValorEstatistico | string[];
  moda?: ValorEstatistico[];
  primeiroQuartil?: number;
  terceiroQuartil?: number;
};
export type ClasseFrequencia = {
  classe: number;
  dados: string;
  valor?: number;
  fi: number;
  fiAcumulada: number | null;
  fr: number;
  frAcumulada: number | null;
  frPercentual: number;
  frPercentualAcumulada: number | null;
  histograma?: { limiteInferior: number; limiteSuperior: number; densidade: number };
};
export type ResumoBoxplot = {
  minimo: number;
  primeiroQuartil: number;
  mediana: number;
  terceiroQuartil: number;
  maximo: number;
};
export type AnalisePergunta = {
  id: string;
  codigo: string;
  enunciado: string;
  tipoVariavel: TipoVariavel;
  tipo: "Quantitativa" | "Qualitativa";
  categoria: CategoriaPergunta;
  totalRespostas: number;
  respostasValidas: number;
  respostasAusentes: number;
  percentualAusentes: number;
  respostasMultiplas: boolean;
  totalMarcacoes: number;
  medidas: Medidas;
  distribuicao: ClasseFrequencia[];
  graficos: TipoGrafico[];
  graficoRecomendado: TipoGrafico;
  boxplot?: ResumoBoxplot;
};
