type EstadoPesquisaAtual = {
  possuiDados: boolean;
};

// O backend ainda não possui o esquema SQLite da importação. Este estado mantém
// o contrato da V5 no servidor e será substituído pelo repositório SQLite nesta
// mesma camada, sem exigir mudanças no controller ou no frontend.
const estadoPesquisaAtual: EstadoPesquisaAtual = {
  possuiDados: true,
};

export function limparDadosDaPesquisaAtual() {
  estadoPesquisaAtual.possuiDados = false;

  return {
    cleared: true,
  };
}
