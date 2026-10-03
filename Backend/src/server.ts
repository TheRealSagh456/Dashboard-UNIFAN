import fastify from "fastify";
import dotenv from "dotenv";
import { fecharBanco, obterBanco } from "./database/conexao.ts";
import { executarMigracoes } from "./database/migracoes.ts";
import { pesquisasRoutes } from "./routes/pesquisas.routes.ts";
import { exportacoesRoutes } from "./routes/exportacoes.routes.ts";

dotenv.config();

const app = fastify({ logger: true });

const banco = obterBanco();
const migracoes = await executarMigracoes(banco);
if (migracoes.length > 0) {
  app.log.info(`Migrations aplicadas: ${migracoes.join(", ")}`);
}

await app.register(pesquisasRoutes);
await app.register(exportacoesRoutes);

app.addHook("onClose", async () => {
  await fecharBanco();
});

app.get("/health", async () => {
  return { data: { status: "vivinho da silva" } };
});

const portaConfigurada = Number.parseInt(process.env.PORT ?? "", 10);
const PORT = Number.isInteger(portaConfigurada) ? portaConfigurada : 3333;

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export default app;
