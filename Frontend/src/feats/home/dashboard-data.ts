export type CategoriaPergunta = "Discreta" | "Contínua" | "Nominal" | "Ordinal";
export type TipoPergunta = "Quantitativa" | "Qualitativa";
export type TipoGrafico = "Barras" | "Boxplot" | "Colunas" | "Histograma" | "Pizza" | "Pontos";
export type MedidasPergunta = {
  media?: string;
  mediana?: string;
  moda?: string;
  primeiroQuartil?: string;
  terceiroQuartil?: string;
};
export type ResumoBoxplot = {
  minimo: number;
  primeiroQuartil: number;
  mediana: number;
  terceiroQuartil: number;
  maximo: number;
};
export type ClasseHistograma = {
  limiteInferior: number;
  limiteSuperior: number;
  densidade: number;
};
export type ClasseFrequencia = {
  classe: number;
  dados: string;
  valor?: number;
  fi: number;
  fiAcumulada: number;
  fr: number;
  frAcumulada: number;
  frPercentual: number;
  frPercentualAcumulada: number;
  histograma?: ClasseHistograma;
};
export type PerguntaDashboard = {
  id: string;
  codigo: string;
  enunciado: string;
  tipo: TipoPergunta;
  categoria: CategoriaPergunta;
  unidade?: string;
  totalRespostas: number;
  respostasValidas: number;
  respostasAusentes: number;
  percentualAusentes: number;
  distribuicao: ClasseFrequencia[];
  medidas: MedidasPergunta;
  graficos: TipoGrafico[];
  graficoRecomendado: TipoGrafico;
  boxplot?: ResumoBoxplot;
};
export type PesquisaDashboard = {
  id: string;
  nome: string;
  nomeArquivoOriginal: string;
  importadoEm: string;
  totalRespostas: number;
  totalPerguntas: number;
  totalAusencias: number;
  percentualAusencias: number;
  distribuicaoTipos: Array<{ label: CategoriaPergunta; value: number; percentual: number }>;
};
export type Dashboard = { pesquisa: PesquisaDashboard; perguntas: PerguntaDashboard[] };
