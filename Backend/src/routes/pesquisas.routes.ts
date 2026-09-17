import type { FastifyInstance } from "fastify";
import { limparPesquisaAtualController } from "../controllers/pesquisas.controller.js";

export async function pesquisasRoutes(app: FastifyInstance) {
  app.delete("/api/pesquisas/atual", limparPesquisaAtualController);
}
