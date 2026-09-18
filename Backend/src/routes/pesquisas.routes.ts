import type { FastifyInstance } from "fastify";
import {
  limparPesquisaAtualController,
  obterPesquisaAtualController,
} from "../controllers/pesquisas.controller.js";

export async function pesquisasRoutes(app: FastifyInstance) {
  app.get("/api/pesquisas/atual", obterPesquisaAtualController);
  app.delete("/api/pesquisas/atual", limparPesquisaAtualController);
}
