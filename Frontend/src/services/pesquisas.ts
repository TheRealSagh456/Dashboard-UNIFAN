import { apiRequest, mockRequestDelay } from "./api";

type LimparPesquisaAtualResponse = {
  cleared: boolean;
};

export type PesquisaAtual = {
  id: string;
  nome: string;
  nomeArquivoOriginal: string;
  totalRespostas: number;
  totalPerguntas: number;
};

export async function obterPesquisaAtual() {
  const response = await apiRequest<PesquisaAtual>("/api/pesquisas/atual");
  return response.data;
}

export async function limparPesquisaAtual() {
  const [response] = await Promise.all([
    apiRequest<LimparPesquisaAtualResponse>("/api/pesquisas/atual", {
      method: "DELETE",
    }),
    mockRequestDelay(),
  ]);

  return response.data;
}
