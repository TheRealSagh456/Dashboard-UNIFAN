import fastify from "fastify";
import dotenv from "dotenv";
import { abrirBanco } from "./database/conexao.ts";
import { executarMigracoes } from "./database/migracoes.ts";
import { pesquisasRoutes } from "./routes/pesquisas.routes.js";
import { exportacoesRoutes } from "./routes/exportacoes.routes.js";

dotenv.config();

const app = fastify({ logger: true });

const banco = abrirBanco();
const migracoes = executarMigracoes(banco);
if (migracoes.length > 0) {
  app.log.info(`Migrations aplicadas: ${migracoes.join(", ")}`);
}

app.addHook("onClose", async () => {
  banco.close();
});

app.get("/health", async () => {
  return { data: { status: "vivinho da silva" } };
});

const PORT = Number(process.env.PORT) ?? 3333;

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export default app;
