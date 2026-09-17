export type CategoriaPergunta =
  | "Discreta"
  | "Contínua"
  | "Nominal"
  | "Ordinal";

export type TipoPergunta = "Quantitativa" | "Qualitativa";

export type TipoGrafico =
  | "Barras"
  | "Boxplot"
  | "Colunas"
  | "Histograma"
  | "Pizza"
  | "Pontos";

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

export type PerguntaDashboard = {
  id: string;
  codigo: string;
  enunciado: string;
  tipo: TipoPergunta;
  categoria: CategoriaPergunta;
  unidade?: string;
  distribuicao: Array<{ dados: string; fi: number }>;
  medidas: MedidasPergunta;
  graficos: TipoGrafico[];
  boxplot?: ResumoBoxplot;
};

export const pesquisaDemo = {
  id: "pesquisa-tecnologia-2026",
  nome: "Pesquisa sobre tecnologia",
  totalRespostas: 1000,
  importadoEm: "16 de setembro de 2026",
};

export function totalRespostasValidas(pergunta: PerguntaDashboard) {
  return pergunta.distribuicao.reduce((total, item) => total + item.fi, 0);
}

const graficosPorCategoria: Record<CategoriaPergunta, TipoGrafico[]> = {
  Discreta: ["Colunas", "Pontos", "Boxplot"],
  Contínua: ["Histograma", "Boxplot", "Pontos"],
  Nominal: ["Barras", "Pizza"],
  Ordinal: ["Colunas", "Pontos"],
};

function criarPergunta(
  codigo: string,
  enunciado: string,
  categoria: CategoriaPergunta,
  distribuicao: Array<[string, number]>,
  medidas: MedidasPergunta,
  unidade?: string,
  boxplot?: ResumoBoxplot,
): PerguntaDashboard {
  return {
    id: codigo.toLocaleLowerCase("pt-BR"),
    codigo,
    enunciado,
    tipo:
      categoria === "Discreta" || categoria === "Contínua"
        ? "Quantitativa"
        : "Qualitativa",
    categoria,
    unidade,
    distribuicao: distribuicao.map(([dados, fi]) => ({ dados, fi })),
    medidas,
    graficos: graficosPorCategoria[categoria],
    boxplot,
  };
}

export const perguntasDashboard: PerguntaDashboard[] = [
  criarPergunta(
    "Q01",
    "Qual é a sua idade?",
    "Discreta",
    [["16–17", 120], ["18–20", 210], ["21–25", 245], ["26–30", 185], ["31–40", 120], ["41–50", 70], ["51 ou mais", 49]],
    { media: "26,4", mediana: "24", moda: "21–25", primeiroQuartil: "19", terceiroQuartil: "31" },
    "anos",
    { minimo: 16, primeiroQuartil: 19, mediana: 24, terceiroQuartil: 31, maximo: 64 },
  ),
  criarPergunta(
    "Q02",
    "Quantos dispositivos eletrônicos você possui?",
    "Discreta",
    [["0", 65], ["1", 185], ["2", 280], ["3", 225], ["4", 145], ["5", 72], ["6 ou mais", 27]],
    { media: "2,4", mediana: "2", moda: "2", primeiroQuartil: "1", terceiroQuartil: "3" },
    "dispositivos",
    { minimo: 0, primeiroQuartil: 1, mediana: 2, terceiroQuartil: 3, maximo: 8 },
  ),
  criarPergunta(
    "Q03",
    "Quantas horas por dia você usa a internet?",
    "Contínua",
    [["0–2", 92], ["2–4", 180], ["4–6", 226], ["6–8", 208], ["8–10", 150], ["10–12", 78], ["12–16", 65]],
    { media: "6,1", mediana: "5,8", moda: "4–6", primeiroQuartil: "3,7", terceiroQuartil: "8,2" },
    "horas/dia",
    { minimo: 0.5, primeiroQuartil: 3.7, mediana: 5.8, terceiroQuartil: 8.2, maximo: 15.5 },
  ),
  criarPergunta(
    "Q04",
    "Quantas horas por dia você passa em redes sociais?",
    "Contínua",
    [["0–1", 170], ["1–2", 242], ["2–3", 228], ["3–4", 160], ["4–5", 96], ["5–6", 54], ["6 ou mais", 49]],
    { media: "2,6", mediana: "2,3", moda: "1–2", primeiroQuartil: "1,2", terceiroQuartil: "3,5" },
    "horas/dia",
    { minimo: 0, primeiroQuartil: 1.2, mediana: 2.3, terceiroQuartil: 3.5, maximo: 9 },
  ),
  criarPergunta(
    "Q05",
    "Quantos aplicativos de redes sociais você tem instalados no celular?",
    "Discreta",
    [["0–1", 145], ["2–3", 230], ["4–5", 258], ["6–7", 190], ["8–9", 105], ["10 ou mais", 71]],
    { media: "4,7", mediana: "4", moda: "4–5", primeiroQuartil: "2", terceiroQuartil: "7" },
    "aplicativos",
    { minimo: 0, primeiroQuartil: 2, mediana: 4, terceiroQuartil: 7, maximo: 16 },
  ),
  criarPergunta(
    "Q06",
    "Há quantos anos você possui um smartphone?",
    "Discreta",
    [["0–2", 80], ["3–4", 150], ["5–6", 218], ["7–8", 230], ["9–10", 165], ["11–12", 95], ["13 ou mais", 61]],
    { media: "7,2", mediana: "7", moda: "7–8", primeiroQuartil: "5", terceiroQuartil: "10" },
    "anos",
    { minimo: 0, primeiroQuartil: 5, mediana: 7, terceiroQuartil: 10, maximo: 18 },
  ),
  criarPergunta(
    "Q07",
    "Quanto você gasta, em média por mês, com assinaturas ou serviços de tecnologia?",
    "Contínua",
    [["R$ 0–50", 360], ["R$ 50–100", 245], ["R$ 100–150", 170], ["R$ 150–200", 105], ["R$ 200–300", 62], ["Acima de R$ 300", 57]],
    { media: "R$ 104,30", mediana: "R$ 82,00", moda: "R$ 0–50", primeiroQuartil: "R$ 38,00", terceiroQuartil: "R$ 146,00" },
    "reais/mês",
    { minimo: 0, primeiroQuartil: 38, mediana: 82, terceiroQuartil: 146, maximo: 480 },
  ),
  criarPergunta(
    "Q08",
    "Com que idade você começou a usar a internet?",
    "Discreta",
    [["Até 6", 55], ["7–9", 158], ["10–12", 265], ["13–15", 242], ["16–18", 145], ["19–21", 77], ["22 ou mais", 57]],
    { media: "13,1", mediana: "13", moda: "10–12", primeiroQuartil: "10", terceiroQuartil: "16" },
    "anos",
    { minimo: 4, primeiroQuartil: 10, mediana: 13, terceiroQuartil: 16, maximo: 35 },
  ),
  criarPergunta(
    "Q09",
    "Quantas horas de sono você perde por semana devido ao uso de tecnologia à noite?",
    "Contínua",
    [["0–1", 310], ["1–2", 255], ["2–3", 178], ["3–4", 112], ["4–5", 64], ["5–6", 35], ["6 ou mais", 45]],
    { media: "2,1", mediana: "1,7", moda: "0–1", primeiroQuartil: "0,8", terceiroQuartil: "2,9" },
    "horas/semana",
    { minimo: 0, primeiroQuartil: 0.8, mediana: 1.7, terceiroQuartil: 2.9, maximo: 10 },
  ),
  criarPergunta(
    "Q10",
    "Quantas vezes você trocou sua senha no último ano?",
    "Discreta",
    [["0", 420], ["1", 285], ["2", 142], ["3", 72], ["4", 38], ["5 ou mais", 42]],
    { media: "1,1", mediana: "1", moda: "0", primeiroQuartil: "0", terceiroQuartil: "2" },
    "vezes/ano",
    { minimo: 0, primeiroQuartil: 0, mediana: 1, terceiroQuartil: 2, maximo: 9 },
  ),
  criarPergunta("Q11", "Qual é o seu gênero?", "Nominal", [["Feminino", 480], ["Masculino", 452], ["Outro", 29], ["Prefiro não dizer", 38]], { moda: "Feminino" }),
  criarPergunta("Q12", "Qual é a sua escolaridade?", "Ordinal", [["Ensino Fundamental", 55], ["Ensino Médio", 335], ["Superior incompleto", 220], ["Superior completo", 250], ["Pós-graduação", 139]], { mediana: "Superior incompleto", moda: "Ensino Médio" }),
  criarPergunta("Q13", "Você utiliza alguma ferramenta de inteligência artificial?", "Nominal", [["Sim", 742], ["Não", 257]], { moda: "Sim" }),
  criarPergunta("Q14", "Qual ferramenta de IA você mais utiliza?", "Nominal", [["ChatGPT", 522], ["Gemini", 164], ["Copilot", 108], ["Outra", 77], ["Não uso", 128]], { moda: "ChatGPT" }),
  criarPergunta("Q15", "Com que frequência você utiliza ferramentas de IA?", "Ordinal", [["Nunca", 85], ["Raramente", 122], ["Às vezes", 245], ["Frequentemente", 322], ["Sempre", 225]], { mediana: "Frequentemente", moda: "Frequentemente" }),
  criarPergunta("Q16", "Para qual finalidade você mais utiliza IA?", "Nominal", [["Trabalho", 235], ["Estudo", 418], ["Lazer", 146], ["Outro", 78], ["Não uso", 122]], { moda: "Estudo" }),
  criarPergunta("Q17", "Você confia nas informações geradas por ferramentas de IA?", "Ordinal", [["Discordo totalmente", 82], ["Discordo", 148], ["Neutro", 262], ["Concordo", 330], ["Concordo totalmente", 177]], { mediana: "Concordo", moda: "Concordo" }),
  criarPergunta("Q18", "Você acredita que a IA substituirá empregos humanos no futuro?", "Ordinal", [["Discordo totalmente", 59], ["Discordo", 118], ["Neutro", 205], ["Concordo", 369], ["Concordo totalmente", 248]], { mediana: "Concordo", moda: "Concordo" }),
  criarPergunta("Q19", "Você sente que depende da tecnologia para realizar tarefas do dia a dia?", "Ordinal", [["Discordo totalmente", 54], ["Discordo", 120], ["Neutro", 268], ["Concordo", 352], ["Concordo totalmente", 205]], { mediana: "Concordo", moda: "Concordo" }),
  criarPergunta("Q20", "Você já usou tecnologia para enganar ou prejudicar alguém?", "Nominal", [["Sim", 96], ["Não", 903]], { moda: "Não" }),
  criarPergunta("Q21", "Você já foi vítima de algum golpe ou fraude digital?", "Nominal", [["Sim", 238], ["Não", 762]], { moda: "Não" }),
  criarPergunta("Q22", "Você utiliza autenticação de dois fatores nas suas contas?", "Nominal", [["Sim", 715], ["Não", 285]], { moda: "Sim" }),
  criarPergunta("Q23", "Você já compartilhou informações sem verificar se eram verdadeiras?", "Nominal", [["Sim", 322], ["Não", 678]], { moda: "Não" }),
  criarPergunta("Q24", "Qual sistema operacional de celular você utiliza?", "Nominal", [["Android", 687], ["iOS", 258], ["Outro", 55]], { moda: "Android" }),
  criarPergunta("Q25", "Você acredita que a tecnologia trouxe mais benefícios do que malefícios?", "Ordinal", [["Discordo totalmente", 51], ["Discordo", 96], ["Neutro", 186], ["Concordo", 382], ["Concordo totalmente", 285]], { mediana: "Concordo", moda: "Concordo" }),
];
