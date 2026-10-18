import type { FastifyRequest, FastifyReply } from "fastify";
import { listarPerguntas, obterPergunta } from "../services/perguntas.service.ts";
import { obterDashboard } from "../services/dashboard.service.ts";

export async function dashboardController(request: FastifyRequest<{ Params: { pesquisaId: string } }>, reply: FastifyReply) {
  return reply.send({ data: await obterDashboard(request.params.pesquisaId) });
}

export async function listarPerguntasController(request: FastifyRequest<{ Params: { pesquisaId: string } }>, reply: FastifyReply) {
  return reply.send({ data: await listarPerguntas(request.params.pesquisaId) });
}

export async function obterPerguntaController(request: FastifyRequest<{ Params: { pesquisaId: string; perguntaId: string }; Querystring: { pagina?: number } }>, reply: FastifyReply) {
  return reply.send({ data: await obterPergunta(request.params.pesquisaId, request.params.perguntaId, request.query.pagina) });
}
