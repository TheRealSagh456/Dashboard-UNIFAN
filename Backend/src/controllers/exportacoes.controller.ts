import type { FastifyReply, FastifyRequest } from "fastify";
import {
  ErroExportacao,
  gerarExportacaoDados,
} from "../services/exportacoes.service.js";

type ExportacaoQuery = {
  format?: string;
  scope?: string;
  questionId?: string;
};

export async function exportarDadosController(
  request: FastifyRequest<{ Querystring: ExportacaoQuery }>,
  reply: FastifyReply,
) {
  try {
    const resultado = await gerarExportacaoDados(request.query);

    return reply
      .header("Content-Type", resultado.mimeType)
      .header(
        "Content-Disposition",
        `attachment; filename="${resultado.nomeArquivo}"`,
      )
      .send(resultado.conteudo);
  } catch (error) {
    if (error instanceof ErroExportacao) {
      return reply.status(error.statusCode).send({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: {
        message: "Não foi possível gerar a exportação de dados.",
        code: "EXPORT_GENERATION_FAILED",
      },
    });
  }
}
