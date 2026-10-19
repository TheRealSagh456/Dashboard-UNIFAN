import type { FastifyInstance } from "fastify";
import { importarController, revisaoController, salvarRevisaoController, confirmarController } from "../controllers/importacao.controller.ts";

export async function importacaoRoutes(app: FastifyInstance) {
  app.post("/api/importacoes", {
    schema: { querystring: { type: "object", properties: { delimitador: { type: "string", enum: [",", ";", "\t"] } } } },
  }, importarController);
  app.get("/api/importacoes/:id", revisaoController);
  app.put("/api/importacoes/:id/colunas", {
    schema: { body: {
      type: "object", required: ["colunas"], properties: {
        separadorDecimal: { type: "string", enum: [",", "."] },
        colunas: { type: "array", minItems: 1, items: {
          type: "object", required: ["id", "papel", "tipoVariavel", "categorias"], properties: {
            id: { type: "string", minLength: 1 },
            papel: { type: "string", enum: ["pergunta", "metadado", "nao_selecionada"] },
            tipoVariavel: { anyOf: [{ type: "null" }, { type: "string", enum: ["quantitativa_discreta", "quantitativa_continua", "qualitativa_nominal", "qualitativa_ordinal"] }] },
            categorias: { type: "array", items: { type: "string" } },
            respostasMultiplas: { type: "boolean" },
          },
        } },
      },
    } },
  }, salvarRevisaoController);
  app.post("/api/importacoes/:id/confirmar", confirmarController);
}
