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

// O schema SQLite já existe, mas este serviço ainda usa o mock da V5.
// TODO(membros): substituir o estado abaixo por consultas com obterBanco().
// A pesquisa atual deve vir de uma importação confirmada; definir a seleção
// em Docs/api.md antes de implementar. Roteiro: Docs/backend-guide.md, etapa 1.
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
  // TODO(membros): implementar a exclusão no SQLite em uma transação (etapa 2).
  // Preservar o contrato { cleared: true } e propagar falhas ao controller.
  estadoPesquisaAtual.possuiDados = false;

  return {
    cleared: true,
  };
}
