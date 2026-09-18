import type { FastifyReply, FastifyRequest } from "fastify";
import {
  limparDadosDaPesquisaAtual,
  obterPesquisaAtual,
} from "../services/pesquisas.service.js";

export async function obterPesquisaAtualController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const pesquisa = obterPesquisaAtual();
    if (!pesquisa) {
      return reply.status(404).send({
        error: {
          message: "Nenhuma pesquisa importada foi encontrada.",
          code: "PESQUISA_NOT_FOUND",
        },
      });
    }

    return reply.send({ data: pesquisa });
  } catch {
    return reply.status(500).send({
      error: {
        message: "Não foi possível consultar a pesquisa atual.",
        code: "PESQUISA_READ_FAILED",
      },
    });
  }
}

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
