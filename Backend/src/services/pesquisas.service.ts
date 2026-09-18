type EstadoPesquisaAtual = {
  possuiDados: boolean;
  pesquisa: {
    id: string;
    nome: string;
    nomeArquivoOriginal: string;
    totalRespostas: number;
    totalPerguntas: number;
  };
};

// O backend ainda não possui o esquema SQLite da importação. Este estado mantém
// o contrato da V5 no servidor e será substituído pelo repositório SQLite nesta
// mesma camada, sem exigir mudanças no controller ou no frontend.
const estadoPesquisaAtual: EstadoPesquisaAtual = {
  possuiDados: true,
  pesquisa: {
    id: "pesquisa-tecnologia-2026",
    nome: "Pesquisa sobre tecnologia",
    nomeArquivoOriginal: "pesquisa_tecnologia-2026.xlsx",
    totalRespostas: 1000,
    totalPerguntas: 25,
  },
};

export function obterPesquisaAtual() {
  return estadoPesquisaAtual.possuiDados ? estadoPesquisaAtual.pesquisa : null;
}

export function limparDadosDaPesquisaAtual() {
  estadoPesquisaAtual.possuiDados = false;

  return {
    cleared: true,
  };
}
