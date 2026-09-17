import type { FastifyReply, FastifyRequest } from "fastify";
import { limparDadosDaPesquisaAtual } from "../services/pesquisas.service.js";

export async function limparPesquisaAtualController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const result = limparDadosDaPesquisaAtual();
    return reply.send({ data: result });
  } catch {
    return reply.status(500).send({
      error: {
        message: "Não foi possível limpar os dados da pesquisa atual.",
        code: "PESQUISA_CLEAR_FAILED",
      },
    });
  }
}
