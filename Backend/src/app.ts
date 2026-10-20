import fastify from "fastify";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { access } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fecharBanco, obterBanco } from "./database/conexao.ts";
import { executarMigracoes } from "./database/migracoes.ts";
import { pesquisasRoutes } from "./routes/pesquisas.routes.ts";
import { exportacoesRoutes } from "./routes/exportacoes.routes.ts";
import { importacaoRoutes } from "./routes/importacao.routes.ts";
import { perguntasRoutes } from "./routes/perguntas.routes.ts";
import { LIMITE_ARQUIVO } from "./importacao/validacao.ts";
import { ErroAplicacao } from "./utils/erro-aplicacao.ts";

// Separado do listen para testar a API sem abrir uma porta ou usar o banco local.
export async function criarApp(
  logger = true,
  diretorioFrontend = process.env.NODE_ENV === "production"
    ? fileURLToPath(new URL("../../Frontend/dist/", import.meta.url))
    : undefined,
) {
  if (diretorioFrontend) {
    try {
      await access(join(diretorioFrontend, "index.html"));
    } catch (erro) {
      throw new Error("Frontend não compilado. Execute npm --prefix Frontend run build na raiz do projeto.", { cause: erro });
    }
  }
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
  if (diretorioFrontend) {
    await app.register(fastifyStatic, {
      root: diretorioFrontend,
      index: false,
      dotfiles: "ignore",
      wildcard: false,
      // Arquivos estáticos nunca devem ocupar o namespace da API ou da saúde.
      allowedPath: (caminho) => !/^\/?(?:api(?:\/|$)|health$)/.test(caminho),
    });
    app.get("/", async (_request, reply) => reply.header("Cache-Control", "no-cache").sendFile("index.html", { cacheControl: false }));
  }
  app.setNotFoundHandler((request, reply) => {
    const caminho = new URL(request.url, "http://localhost").pathname;
    const paginaFrontend = caminho === "/" || caminho === "/import" || caminho === "/import/"
      || caminho === "/components" || caminho === "/components/"
      || caminho === "/home" || caminho.startsWith("/home/");
    if (diretorioFrontend && paginaFrontend && !extname(caminho)
      && (request.method === "GET" || request.method === "HEAD")
      && request.headers.accept?.includes("text/html")) {
      return reply.header("Cache-Control", "no-cache").sendFile("index.html", { cacheControl: false });
    }
    return reply.status(404).send({ error: { message: "Rota não encontrada.", code: "ROUTE_NOT_FOUND" } });
  });
  await app.register(pesquisasRoutes);
  await app.register(exportacoesRoutes);
  await app.register(importacaoRoutes);
  await app.register(perguntasRoutes);
  app.get("/health", async () => ({ data: { status: "vivinho da silva" } }));
  return app;
}
