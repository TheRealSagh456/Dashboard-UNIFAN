import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarApp } from "./app.ts";

let app: Awaited<ReturnType<typeof criarApp>>;
let temporario: string;
const bancoAnterior = process.env.DATABASE_PATH;
const html = '<!doctype html><html><body><div id="root">UNIFAN</div></body></html>';

before(async () => {
  temporario = await mkdtemp(join(tmpdir(), "unifan-frontend-"));
  process.env.DATABASE_PATH = join(temporario, "teste.db");
  const frontend = join(temporario, "frontend");
  await mkdir(join(frontend, "assets"), { recursive: true });
  await mkdir(join(frontend, "api"));
  await writeFile(join(frontend, "index.html"), html);
  await writeFile(join(frontend, "assets", "app.js"), 'console.log("UNIFAN");');
  await writeFile(join(frontend, "api", "nao-publicar.txt"), "não é uma rota da API");
  await writeFile(join(frontend, ".env"), "ARQUIVO_NAO_PUBLICO=true");
  app = await criarApp(false, frontend);
});

after(async () => {
  await app?.close();
  if (bancoAnterior === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = bancoAnterior;
  if (temporario) await rm(temporario, { recursive: true, force: true });
});

test("entrega as páginas React e aceita atualizar uma pergunta diretamente", async () => {
  for (const url of ["/", "/import", "/components", "/home", "/home/pesquisa/perguntas/q01?tema=dark"]) {
    const resposta = await app.inject({ url, headers: { accept: "text/html" } });
    assert.equal(resposta.statusCode, 200, url);
    assert.equal(resposta.body, html);
    assert.match(resposta.headers["content-type"] ?? "", /text\/html/);
    assert.equal(resposta.headers["cache-control"], "no-cache");
  }
  const head = await app.inject({ method: "HEAD", url: "/home/pesquisa", headers: { accept: "text/html" } });
  assert.equal(head.statusCode, 200);
  assert.equal(head.body, "");
});

test("entrega assets sem transformar arquivos ausentes em HTML", async () => {
  const asset = await app.inject("/assets/app.js");
  assert.equal(asset.statusCode, 200);
  assert.match(asset.headers["content-type"] ?? "", /javascript/);
  assert.equal(asset.body, 'console.log("UNIFAN");');
  for (const url of ["/assets/ausente.js", "/home/ausente.js", "/.env"]) {
    const resposta = await app.inject({ url, headers: { accept: "text/html" } });
    assert.equal(resposta.statusCode, 404, url);
    assert.equal(resposta.json().error.code, "ROUTE_NOT_FOUND");
  }
});

test("preserva respostas da API e do health mesmo quando o navegador aceita HTML", async () => {
  assert.equal((await app.inject("/health")).json().data.status, "vivinho da silva");
  const pesquisa = await app.inject({ url: "/api/pesquisas/atual", headers: { accept: "text/html" } });
  assert.equal(pesquisa.statusCode, 404);
  assert.equal(pesquisa.json().error.code, "PESQUISA_NOT_FOUND");
  for (const url of ["/api", "/api/inexistente", "/api/nao-publicar.txt", "/%61pi/nao-publicar.txt"]) {
    const resposta = await app.inject({ url, headers: { accept: "text/html" } });
    assert.equal(resposta.statusCode, 404, url);
    assert.equal(resposta.json().error.code, "ROUTE_NOT_FOUND");
  }
  const post = await app.inject({ method: "POST", url: "/home", headers: { accept: "text/html" } });
  assert.equal(post.statusCode, 404);
  const json = await app.inject({ url: "/home", headers: { accept: "application/json" } });
  assert.equal(json.statusCode, 404);
});

test("recusa iniciar a publicação sem o build do frontend", async () => {
  await assert.rejects(criarApp(false, join(temporario, "nao-compilado")), /Frontend não compilado/);
});

test("desenvolvimento continua expondo somente a API", async () => {
  await app.close();
  const ambienteAnterior = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    app = await criarApp(false);
    const resposta = await app.inject({ url: "/home", headers: { accept: "text/html" } });
    assert.equal(resposta.statusCode, 404);
    assert.equal(resposta.json().error.code, "ROUTE_NOT_FOUND");
    assert.equal((await app.inject("/health")).statusCode, 200);
  } finally {
    if (ambienteAnterior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = ambienteAnterior;
  }
});
