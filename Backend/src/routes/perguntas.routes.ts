import type { FastifyInstance } from "fastify";
import { dashboardController, listarPerguntasController, obterPerguntaController } from "../controllers/perguntas.controller.ts";

export async function perguntasRoutes(app: FastifyInstance) {
  app.get("/api/pesquisas/:pesquisaId/dashboard", dashboardController);
  app.get("/api/pesquisas/:pesquisaId/perguntas", listarPerguntasController);
  app.get("/api/pesquisas/:pesquisaId/perguntas/:perguntaId", {
    schema: { querystring: { type: "object", properties: { pagina: { type: "integer", minimum: 1, default: 1 } } } },
  }, obterPerguntaController);
}
