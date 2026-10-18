import dotenv from "dotenv";
import { criarApp } from "./app.ts";

dotenv.config();

const app = await criarApp();

const portaConfigurada = Number.parseInt(process.env.PORT ?? "", 10);
const PORT = Number.isInteger(portaConfigurada) ? portaConfigurada : 3333;

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export default app;
