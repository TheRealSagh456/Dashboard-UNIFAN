import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { criarBanco, type Banco } from "./conexao.ts";
import { executarMigracoes } from "./migracoes.ts";

let banco: Banco;
let diretorioTemporario: string;

before(async () => {
  diretorioTemporario = await mkdtemp(join(tmpdir(), "dashboard-unifan-db-"));
  banco = criarBanco(join(diretorioTemporario, "teste.db"));
});

after(async () => {
  await banco.destroy();
  await rm(diretorioTemporario, { recursive: true, force: true });
});

test("aplica as migrations em ordem e não as repete", async () => {
  assert.deepEqual(await executarMigracoes(banco), [
    "001_initial.sql",
    "002_integridade-importacao.sql",
  ]);
  assert.deepEqual(await executarMigracoes(banco), []);

  const migracoes = await banco("schema_migrations")
    .select("id", "checksum")
    .orderBy("id");
  assert.equal(migracoes.length, 2);
  assert.ok(migracoes.every((migracao) => migracao.checksum));
});

test("atualiza um banco legado sem perder os dados existentes", async () => {
  const bancoLegado = criarBanco(join(diretorioTemporario, "legado.db"));

  try {
    const conexao = await bancoLegado.client.acquireConnection();
    try {
      conexao.exec(
        await readFile(new URL("./sql/001_initial.sql", import.meta.url), "utf8"),
      );
      conexao.exec(`
        CREATE TABLE schema_migrations (
          id TEXT PRIMARY KEY,
          aplicada_em TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO schema_migrations (id) VALUES ('001_initial.sql');
        INSERT INTO importacao (
          id, nome_arquivo, formato, delimitador
        ) VALUES (
          'importacao-legada', 'legado.csv', 'csv', '\\t'
        );
        INSERT INTO coluna (
          id, importacao_id, posicao_original, cabecalho_original,
          papel, tipo_variavel
        ) VALUES (
          'coluna-legada', 'importacao-legada', 0, 'Idade',
          'pergunta', 'quantitativa_discreta'
        );
        INSERT INTO participante (
          id, importacao_id, indice_linha
        ) VALUES (
          'participante-legado', 'importacao-legada', 2
        );
        INSERT INTO resposta (
          id, participante_id, coluna_id, valor_bruto, valor_numerico
        ) VALUES (
          'resposta-legada', 'participante-legado', 'coluna-legada', '0', 0
        );
      `);
    } finally {
      await bancoLegado.client.releaseConnection(conexao);
    }

    assert.deepEqual(await executarMigracoes(bancoLegado), [
      "002_integridade-importacao.sql",
    ]);

    const importacao = await bancoLegado("importacao")
      .select("delimitador")
      .where({ id: "importacao-legada" })
      .first();
    assert.equal(importacao?.delimitador, "\t");
    assert.equal(
      await bancoLegado("resposta")
        .where({ id: "resposta-legada" })
        .first("valor_bruto")
        .then((resposta) => resposta?.valor_bruto),
      "0",
    );
  } finally {
    await bancoLegado.destroy();
  }
});

test("aceita TAB real como delimitador e preserva zero", async () => {
  await banco("importacao").insert({
    id: "importacao-tab",
    nome_arquivo: "respostas.tsv",
    formato: "csv",
    delimitador: "\t",
  });
  await banco("coluna").insert({
    id: "coluna-zero",
    importacao_id: "importacao-tab",
    posicao_original: 0,
    cabecalho_original: "Quantidade",
    papel: "pergunta",
    tipo_variavel: "quantitativa_discreta",
  });
  await banco("participante").insert({
    id: "participante-zero",
    importacao_id: "importacao-tab",
    indice_linha: 2,
  });
  await banco("resposta").insert({
    id: "resposta-zero",
    participante_id: "participante-zero",
    coluna_id: "coluna-zero",
    valor_bruto: "0",
    valor_numerico: 0,
  });

  const resposta = await banco("resposta")
    .select("valor_bruto", "valor_numerico")
    .where({ id: "resposta-zero" })
    .first();
  assert.deepEqual(resposta, { valor_bruto: "0", valor_numerico: 0 });
});

test("rejeita referências entre importações diferentes", async () => {
  await banco("importacao").insert([
    { id: "importacao-a", nome_arquivo: "a.csv", formato: "csv" },
    { id: "importacao-b", nome_arquivo: "b.csv", formato: "csv" },
  ]);
  await banco("coluna").insert({
    id: "coluna-a",
    importacao_id: "importacao-a",
    posicao_original: 0,
    cabecalho_original: "Categoria",
    papel: "pergunta",
    tipo_variavel: "qualitativa_nominal",
  });
  await banco("participante").insert({
    id: "participante-b",
    importacao_id: "importacao-b",
    indice_linha: 2,
  });

  await assert.rejects(
    banco("resposta").insert({
      id: "resposta-cruzada",
      participante_id: "participante-b",
      coluna_id: "coluna-a",
      valor_bruto: "A",
      valor_categoria: "A",
    }),
    /mesma importação/,
  );
});

test("exige tipo e categorias ordinais antes da confirmação", async () => {
  await banco("importacao").insert({
    id: "importacao-revisao",
    nome_arquivo: "revisao.csv",
    formato: "csv",
    status: "revisao",
  });
  await banco("coluna").insert({
    id: "coluna-ordinal",
    importacao_id: "importacao-revisao",
    posicao_original: 0,
    cabecalho_original: "Satisfação",
    papel: "pergunta",
    tipo_variavel: "qualitativa_ordinal",
  });

  await assert.rejects(
    banco("importacao")
      .where({ id: "importacao-revisao" })
      .update({ status: "confirmada" }),
    /categorias ordenadas/,
  );

  await banco("coluna")
    .where({ id: "coluna-ordinal" })
    .update({ categorias_confirmadas: JSON.stringify(["Baixa", "Alta"]) });
  assert.equal(
    await banco("importacao")
      .where({ id: "importacao-revisao" })
      .update({ status: "confirmada" }),
    1,
  );
});

test("exclusão da importação remove os dados dependentes", async () => {
  await banco("importacao").where({ id: "importacao-tab" }).delete();

  assert.equal(
    await banco("participante").where({ id: "participante-zero" }).first(),
    undefined,
  );
  assert.equal(
    await banco("resposta").where({ id: "resposta-zero" }).first(),
    undefined,
  );
});
