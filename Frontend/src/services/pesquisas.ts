import { apiRequest, mockRequestDelay } from "./api";

type LimparPesquisaAtualResponse = {
  cleared: boolean;
};

export async function limparPesquisaAtual() {
  const [response] = await Promise.all([
    apiRequest<LimparPesquisaAtualResponse>("/api/pesquisas/atual", {
      method: "DELETE",
    }),
    mockRequestDelay(),
  ]);

  return response.data;
}
