import fastify from "fastify";
import multipart from "@fastify/multipart";
import { fecharBanco, obterBanco } from "./database/conexao.ts";
import { executarMigracoes } from "./database/migracoes.ts";
import { pesquisasRoutes } from "./routes/pesquisas.routes.ts";
import { exportacoesRoutes } from "./routes/exportacoes.routes.ts";
import { importacaoRoutes } from "./routes/importacao.routes.ts";
import { perguntasRoutes } from "./routes/perguntas.routes.ts";
import { LIMITE_ARQUIVO } from "./importacao/validacao.ts";
import { ErroAplicacao } from "./utils/erro-aplicacao.ts";

// Separado do listen para testar a API sem abrir uma porta ou usar o banco local.
export async function criarApp(logger = true) {
  const app = fastify({ logger });
  await executarMigracoes(obterBanco());
  app.addHook("onClose", fecharBanco);
  await app.register(multipart, { limits: { fileSize: LIMITE_ARQUIVO, files: 1, fields: 0 } });
  app.setErrorHandler((erro, request, reply) => {
    if (erro instanceof ErroAplicacao) {
      return reply.status(erro.statusCode).send({ error: { message: erro.message, code: erro.code } });
    }
    const falha = erro as { statusCode?: number; code?: string; message?: string };
    const status = falha.statusCode ?? 500;
    if (status >= 500) request.log.error(erro);
    return reply.status(status).send({ error: {
      message: status >= 500 ? "Não foi possível concluir a solicitação." : (falha.message ?? "Requisição inválida."),
      code: status >= 500 ? "INTERNAL_ERROR" : (falha.code ?? "REQUEST_INVALID"),
    } });
  });
  app.setNotFoundHandler((_request, reply) => reply.status(404).send({ error: { message: "Rota não encontrada.", code: "ROUTE_NOT_FOUND" } }));
  await app.register(pesquisasRoutes);
  await app.register(exportacoesRoutes);
  await app.register(importacaoRoutes);
  await app.register(perguntasRoutes);
  app.get("/health", async () => ({ data: { status: "vivinho da silva" } }));
  return app;
}
