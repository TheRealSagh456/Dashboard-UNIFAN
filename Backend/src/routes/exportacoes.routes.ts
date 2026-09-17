import type { FastifyInstance } from "fastify";
import { exportarDadosController } from "../controllers/exportacoes.controller.js";

export async function exportacoesRoutes(app: FastifyInstance) {
  app.get("/api/exportacoes/dados", exportarDadosController);
}
