import type { FastifyReply, FastifyRequest } from "fastify";
import { confirmarImportacao, importarArquivo, obterRevisao, salvarRevisao } from "../services/importacao.service.ts";
import type { ConfiguracaoColuna } from "../types/importacao.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";

type Parametros = { id: string };
export type CorpoRevisao = { colunas: ConfiguracaoColuna[]; separadorDecimal?: "," | "." };

export async function importarController(request: FastifyRequest<{ Querystring: { delimitador?: string } }>, reply: FastifyReply) {
  const arquivo = await request.file();
  if (!arquivo) throw new ErroAplicacao("Selecione um arquivo.", "IMPORT_FILE_REQUIRED");
  const buffer = await arquivo.toBuffer();
  const data = await importarArquivo(buffer, arquivo.filename, request.query.delimitador);
  return reply.status(201).send({ data });
}

export async function revisaoController(request: FastifyRequest<{ Params: Parametros }>, reply: FastifyReply) {
  return reply.send({ data: await obterRevisao(request.params.id) });
}

export async function salvarRevisaoController(request: FastifyRequest<{ Params: Parametros; Body: CorpoRevisao }>, reply: FastifyReply) {
  return reply.send({ data: await salvarRevisao(request.params.id, request.body) });
}

export async function confirmarController(request: FastifyRequest<{ Params: Parametros }>, reply: FastifyReply) {
  return reply.send({ data: await confirmarImportacao(request.params.id) });
}
