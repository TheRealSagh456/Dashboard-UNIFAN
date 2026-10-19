import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarApp } from "../app.ts";
import { obterBanco } from "../database/conexao.ts";
import { importarArquivo, confirmarImportacao, salvarRevisao } from "../services/importacao.service.ts";
import { XLSX, lerExcel } from "./leitores/excel.ts";
import { lerCsv } from "./leitores/csv.ts";
import type { AnalisePergunta } from "../types/dashboard.ts";
import type { RevisaoImportacao } from "../types/importacao.ts";

let app: Awaited<ReturnType<typeof criarApp>>;
let temporario: string;
const caminhoAnterior = process.env.DATABASE_PATH;

before(async () => {
  temporario = await mkdtemp(join(tmpdir(), "unifan-importacao-"));
  process.env.DATABASE_PATH = join(temporario, "teste.db");
  app = await criarApp(false);
});

after(async () => {
  await app?.close();
  if (caminhoAnterior === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = caminhoAnterior;
  await rm(temporario, { recursive: true, force: true });
});

const csv = '\uFEFF"Carimbo de data/hora";" ID ";"Idade";"Horas";"Opinião"\r\n"2026/10/18 2:40:10 PM GMT-3";"00123";0;1,5;"Concordo"\r\n"2026/10/18 2:49:16 PM GMT-3";"00124";18;;"Neutro"';

async function upload(conteudo: Buffer, nome = "respostas.csv") {
  const boundary = "unifan-teste-boundary";
  return app.inject({
    method: "POST", url: "/api/importacoes",
    headers: { "content-type": "multipart/form-data; boundary=" + boundary },
    payload: Buffer.concat([
      Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="arquivo"; filename="' + nome + '"\r\nContent-Type: application/octet-stream\r\n\r\n'),
      conteudo, Buffer.from("\r\n--" + boundary + "--\r\n"),
    ]),
  });
}

test("CSV respeita BOM, delimitadores, aspas e quebras dentro das respostas", () => {
  const leitura = lerCsv(Buffer.from('"Pergunta","Outra"\r\n"Texto, com vírgula e ""aspas""","linha 1\nlinha 2"'));
  assert.equal(leitura.delimitador, ",");
  assert.deepEqual(leitura.matriz[1], ['Texto, com vírgula e "aspas"', "linha 1\nlinha 2"]);
  assert.equal(lerCsv(Buffer.from("Idade\tCategoria\n0\tSim")).delimitador, "\t");
});

test("upload, revisão e confirmação armazenam zero, decimal, categorias e ausências", async () => {
  assert.equal((await app.inject("/api/pesquisas/atual")).statusCode, 404);
  assert.equal((await app.inject("/api/pesquisas/atual/dashboard")).statusCode, 404);
  const resposta = await upload(Buffer.from(csv));
  assert.equal(resposta.statusCode, 201, resposta.body);
  const revisao = resposta.json().data as RevisaoImportacao;
  assert.equal(revisao.totalRespostas, 2);
  assert.equal(revisao.colunas.length, 5);
  assert.equal(revisao.colunas[0]?.papel, "metadado");
  assert.equal(revisao.colunas[1]?.cabecalhoOriginal, " ID ");
  assert.equal(revisao.colunas[1]?.papel, "metadado");
  assert.equal(revisao.separadorDecimal, ",");
  const salvar = await app.inject({ method: "PUT", url: "/api/importacoes/" + revisao.id + "/colunas", payload: { colunas: revisao.colunas } });
  assert.equal(salvar.statusCode, 200, salvar.body);
  const confirmar = await app.inject({ method: "POST", url: "/api/importacoes/" + revisao.id + "/confirmar" });
  assert.equal(confirmar.statusCode, 200, confirmar.body);
  assert.equal(confirmar.json().data.status, "confirmada");
  const pesquisa = (await app.inject("/api/pesquisas/atual")).json().data;
  assert.equal(pesquisa.id, revisao.id);
  assert.equal(pesquisa.totalPerguntas, 3);
  const perguntas = (await app.inject("/api/pesquisas/" + revisao.id + "/perguntas")).json().data;
  assert.equal(perguntas.length, 3);
  const idade = (await app.inject("/api/pesquisas/" + revisao.id + "/perguntas/" + revisao.colunas[2]!.id)).json().data;
  assert.equal(idade.respostas[0].valorNumerico, 0);
  assert.equal(idade.respostas[0].valorBruto, "0");
  const horas = (await app.inject("/api/pesquisas/" + revisao.id + "/perguntas/" + revisao.colunas[3]!.id)).json().data;
  assert.equal(horas.respostas[0].valorNumerico, 1.5);
  assert.equal(horas.respostas[1].valorNumerico, null);
  assert.equal(horas.respostasAusentes, 1);
  const exportacao = await app.inject("/api/exportacoes/dados?format=xlsx&scope=all");
  assert.equal(exportacao.statusCode, 200);
  const linhas = lerExcel(exportacao.rawPayload);
  assert.equal(linhas[1]?.[1], "00123");
  assert.equal(linhas[1]?.[0], "2026/10/18 2:40:10 PM GMT-3");
  const completa = await app.inject("/api/exportacoes/dados?format=xlsx&scope=all&questionId=" + revisao.colunas[2]!.id);
  assert.equal(lerExcel(completa.rawPayload)[0]?.length, 5);
  const semPergunta = await app.inject("/api/exportacoes/dados?format=csv&scope=question");
  assert.equal(semPergunta.statusCode, 400);
  const csvPergunta = await app.inject("/api/exportacoes/dados?format=csv&scope=question&questionId=" + revisao.colunas[2]!.id);
  assert.equal(csvPergunta.statusCode, 200);
  assert.equal(lerCsv(csvPergunta.rawPayload).matriz[1]?.[1], "0");
  assert.equal((await app.inject({ method: "PUT", url: "/api/importacoes/" + revisao.id + "/colunas", payload: { colunas: revisao.colunas } })).statusCode, 409);
  assert.equal((await app.inject({ method: "POST", url: "/api/importacoes/" + revisao.id + "/confirmar" })).statusCode, 200);
});

test("Excel importa a primeira aba não vazia e mantém datas, zero e decimais", async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), "Vazia");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["Carimbo de data/hora", "Idade", "Horas"], [new Date("2026-10-18T14:40:10Z"), 0, 1.5], [null, 19, null],
  ], { UTC: true }), "Respostas");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Ignorar"], [99]]), "Outra");
  for (const bookType of ["xlsx", "biff8"] as const) {
    const arquivo = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType, cellDates: true }));
    const resposta = await upload(arquivo, bookType === "xlsx" ? "respostas.xlsx" : "respostas.xls");
    assert.equal(resposta.statusCode, 201, resposta.body);
    const revisao = resposta.json().data as RevisaoImportacao;
    assert.equal(revisao.colunas.length, 3);
    assert.equal(revisao.totalRespostas, 2);
    await confirmarImportacao(revisao.id);
    const valores = await obterBanco()("resposta").where({ coluna_id: revisao.colunas[2]!.id }).select("valor_numerico");
    assert.deepEqual(valores.map((r) => r.valor_numerico), [1.5, null]);
    assert.match(revisao.colunas[0]!.exemplos[0]!, /^2026-10-18T14:40:10/);
  }
});

test("classificação pode ser corrigida, preservando IDs e valores originais", async () => {
  const revisao = await importarArquivo(Buffer.from('Código,Faixa\n00123,Alta\n00124,Baixa'), "revisar.csv");
  const colunas = revisao.colunas.map((coluna, indice) => ({
    ...coluna, tipoVariavel: indice === 0 ? "qualitativa_nominal" as const : "qualitativa_ordinal" as const,
    categorias: indice === 0 ? [] : ["Baixa", "Alta"],
  }));
  await salvarRevisao(revisao.id, { colunas });
  const confirmada = await confirmarImportacao(revisao.id);
  assert.equal(confirmada.colunas[0]!.id, revisao.colunas[0]!.id);
  assert.deepEqual(confirmada.colunas[1]!.categorias, ["Baixa", "Alta"]);
  const codigo = await obterBanco()("resposta").where({ coluna_id: revisao.colunas[0]!.id }).first();
  assert.equal(codigo.valor_bruto, "00123");
  assert.equal(codigo.valor_categoria, "00123");
});

test("conversões inválidas ficam na revisão, sem arredondar nem apagar o original", async () => {
  const revisao = await importarArquivo(Buffer.from('Idade\n18.5\n0'), "invalido.csv");
  const colunas = revisao.colunas.map((coluna) => ({ ...coluna, tipoVariavel: "quantitativa_discreta" as const }));
  await salvarRevisao(revisao.id, { colunas });
  await assert.rejects(confirmarImportacao(revisao.id), { code: "IMPORT_VALUES_INVALID" });
  const revisada = (await app.inject("/api/importacoes/" + revisao.id)).json().data;
  assert.equal(revisada.status, "revisao");
  assert.equal(revisada.problemas[0].valorBruto, "18.5");
  await salvarRevisao(revisao.id, { colunas: colunas.map((coluna) => ({ ...coluna, tipoVariavel: "quantitativa_continua" })) });
  assert.equal((await confirmarImportacao(revisao.id)).status, "confirmada");
});

test("seleção de 1 e 30 perguntas é aceita e a 31ª é recusada", async () => {
  const revisao = await importarArquivo(Buffer.from(Array.from({ length: 31 }, (_, i) => "P" + i).join(",") + "\n" + Array(31).fill("0").join(",")), "limite.csv");
  await assert.rejects(confirmarImportacao(revisao.id), { code: "IMPORT_QUESTION_LIMIT" });
  const trinta = revisao.colunas.map((coluna, i) => ({ ...coluna, papel: i < 30 ? "pergunta" as const : "nao_selecionada" as const }));
  await salvarRevisao(revisao.id, { colunas: trinta });
  assert.equal((await confirmarImportacao(revisao.id)).status, "confirmada");
});

test("falha no meio de uma importação desfaz toda a transação", async () => {
  const banco = obterBanco();
  const antes = await banco("importacao").count({ total: "id" }).first();
  await banco.raw("CREATE TRIGGER falhar_teste BEFORE INSERT ON resposta WHEN NEW.valor_bruto = 'FALHAR' BEGIN SELECT RAISE(ABORT, 'falha de teste'); END;");
  try {
    await assert.rejects(importarArquivo(Buffer.from("Resposta\nOK\nFALHAR"), "rollback.csv"), /falha de teste/);
  } finally {
    await banco.raw("DROP TRIGGER falhar_teste");
  }
  assert.deepEqual(await banco("importacao").count({ total: "id" }).first(), antes);
  assert.equal(await banco("importacao").where({ nome_arquivo: "rollback.csv" }).first(), undefined);
});

test("mocks CSV e XLSX importam 1.000 respostas, 25 perguntas e 20 ausências", async () => {
  let anteriores: unknown[] | undefined;
  let analisesAnteriores: unknown[] | undefined;
  for (const extensao of ["csv", "xlsx"]) {
    const buffer = await readFile(new URL("../../../Mocks/forms/pesquisa-tecnologia.mock." + extensao, import.meta.url));
    const revisao = await importarArquivo(buffer, "mock." + extensao);
    assert.equal(revisao.totalRespostas, 1000);
    assert.equal(revisao.colunas.length, 28);
    assert.equal(revisao.colunas.filter((c) => c.papel === "metadado").length, 3);
    assert.equal(revisao.colunas.filter((c) => c.papel === "pergunta").length, 25);
    await confirmarImportacao(revisao.id);
    const total = await obterBanco()("resposta as r").join("coluna as c", "c.id", "r.coluna_id")
      .where({ "c.importacao_id": revisao.id, "c.papel": "pergunta" })
      .whereNull("r.valor_numerico").whereNull("r.valor_categoria").count({ total: "r.id" }).first();
    assert.equal(Number(total?.total), 20);
    const normalizadas = await obterBanco()("resposta as r")
      .join("coluna as c", "c.id", "r.coluna_id")
      .join("participante as p", "p.id", "r.participante_id")
      .where({ "c.importacao_id": revisao.id, "c.papel": "pergunta" })
      .orderBy("p.indice_linha").orderBy("c.posicao_original")
      .select("r.valor_numerico", "r.valor_categoria");
    assert.ok(normalizadas.some((r) => r.valor_categoria === "Perplexity"));
    assert.ok(normalizadas.some((r) => r.valor_numerico === 0));
    if (anteriores) assert.deepEqual(normalizadas, anteriores);
    anteriores = normalizadas;
    const resultado = await app.inject("/api/pesquisas/" + revisao.id + "/dashboard");
    assert.equal(resultado.statusCode, 200, resultado.body);
    const dashboard = resultado.json().data;
    assert.equal(dashboard.pesquisa.totalRespostas, 1000);
    assert.equal(dashboard.pesquisa.totalPerguntas, 25);
    assert.equal(dashboard.pesquisa.totalAusencias, 20);
    assert.equal(dashboard.pesquisa.percentualAusencias, 0.08);
    const analises = (dashboard.perguntas as AnalisePergunta[]).map(({ id: _id, ...pergunta }) => pergunta);
    for (const pergunta of analises) {
      assert.equal(pergunta.distribuicao.reduce((total, classe) => total + classe.fi, 0), pergunta.respostasValidas);
      assert.equal(pergunta.respostasValidas + pergunta.respostasAusentes, 1000);
    }
    if (analisesAnteriores) assert.deepEqual(analises, analisesAnteriores);
    analisesAnteriores = analises;
  }
});

test("dados persistidos continuam disponíveis após reabrir a aplicação", async () => {
  const antes = (await app.inject("/api/pesquisas/atual")).json().data;
  await app.close();
  app = await criarApp(false);
  const depois = (await app.inject("/api/pesquisas/atual")).json().data;
  assert.deepEqual(depois, antes);
});

test("API retorna erros padronizados para arquivo inválido e payload incorreto", async () => {
  const formato = await upload(Buffer.from("texto"), "respostas.txt");
  assert.equal(formato.statusCode, 400);
  assert.equal(formato.json().error.code, "IMPORT_FORMAT_INVALID");
  const corpo = await app.inject({ method: "PUT", url: "/api/importacoes/inexistente/colunas", payload: {} });
  assert.equal(corpo.statusCode, 400);
  assert.ok(corpo.json().error.message);
  const grande = await upload(Buffer.alloc(10 * 1024 * 1024 + 1, 65));
  assert.equal(grande.statusCode, 413);
  assert.ok(grande.json().error.code);
});

test("limpeza remove somente a pesquisa atual e conserva importações anteriores", async () => {
  const atual = (await app.inject("/api/pesquisas/atual")).json().data;
  const antes = await obterBanco()("importacao").count({ total: "id" }).first();
  const limpeza = await app.inject({ method: "DELETE", url: "/api/pesquisas/atual" });
  assert.equal(limpeza.statusCode, 200, limpeza.body);
  assert.equal(limpeza.json().data.cleared, true);
  assert.equal(await obterBanco()("participante").where({ importacao_id: atual.id }).first(), undefined);
  assert.equal(await obterBanco()("coluna").where({ importacao_id: atual.id }).first(), undefined);
  const depois = await obterBanco()("importacao").count({ total: "id" }).first();
  assert.equal(Number(depois?.total), Number(antes?.total) - 1);
});

test("dashboard consulta a pesquisa informada e exportação conserva esse escopo", async () => {
  const revisao = await importarArquivo(Buffer.from("ID,Quantidade,Tempo,Preferência,Prioridade,Sem respostas\n001,0,0,Ônibus,Alta,\n002,1,1,Bicicleta,Baixa,\n003,1,2,Ônibus,Alta,\n004,2,3,Bicicleta,Média,\n005,4,4,Ônibus,Alta,\n006,,5,,,"), "mobilidade.csv");
  const tipos = [null, "quantitativa_discreta", "quantitativa_continua", "qualitativa_nominal", "qualitativa_ordinal", "quantitativa_discreta"] as const;
  await salvarRevisao(revisao.id, { colunas: revisao.colunas.map((coluna, i) => ({
    ...coluna, papel: i === 0 ? "metadado" : "pergunta", tipoVariavel: tipos[i]!,
    categorias: i === 4 ? ["Baixa", "Média", "Alta"] : [],
  })) });
  const pendente = await app.inject("/api/pesquisas/" + revisao.id + "/dashboard");
  assert.equal(pendente.statusCode, 409);
  assert.equal(pendente.json().error.code, "IMPORT_NOT_CONFIRMED");
  await confirmarImportacao(revisao.id);
  const resultado = await app.inject("/api/pesquisas/" + revisao.id + "/dashboard");
  assert.equal(resultado.statusCode, 200, resultado.body);
  const dashboard = resultado.json().data;
  assert.equal(dashboard.pesquisa.nome, "mobilidade");
  assert.equal(dashboard.pesquisa.nomeArquivoOriginal, "mobilidade.csv");
  assert.equal(dashboard.pesquisa.totalRespostas, 6);
  assert.equal(dashboard.pesquisa.totalPerguntas, 5);
  assert.equal(dashboard.pesquisa.totalAusencias, 9);
  assert.equal(dashboard.pesquisa.percentualAusencias, 30);
  assert.deepEqual(dashboard.pesquisa.distribuicaoTipos.map((c: { value: number }) => c.value), [2, 1, 1, 1]);
  const [quantidade, tempo, preferencia, prioridade, vazia] = dashboard.perguntas as AnalisePergunta[];
  assert.equal(quantidade!.id, revisao.colunas[1]!.id);
  assert.equal(quantidade!.medidas.media, 1.6);
  assert.equal(quantidade!.distribuicao[0]!.dados, "0");
  assert.equal(tempo!.medidas.media, 2.5);
  assert.equal(preferencia!.medidas.moda![0], "Ônibus");
  assert.equal(prioridade!.medidas.mediana, "Alta");
  assert.equal(vazia!.respostasAusentes, 6);
  assert.deepEqual(vazia!.medidas, {});
  assert.equal(vazia!.boxplot, undefined);
  assert.deepEqual((await app.inject("/api/pesquisas/atual/dashboard")).json().data, dashboard);

  const outra = await importarArquivo(Buffer.from("Tema diferente\nEstudo"), "estudo.csv");
  await confirmarImportacao(outra.id);
  assert.equal((await app.inject("/api/pesquisas/atual/dashboard")).json().data.pesquisa.id, outra.id);
  assert.deepEqual((await app.inject("/api/pesquisas/" + revisao.id + "/dashboard")).json().data, dashboard);
  const exportacao = await app.inject("/api/exportacoes/dados?format=xlsx&scope=all&pesquisaId=" + revisao.id);
  assert.equal(exportacao.statusCode, 200, exportacao.body);
  assert.equal(lerExcel(exportacao.rawPayload)[0]![1], "Quantidade");
  const perguntaCsv = await app.inject("/api/exportacoes/dados?format=csv&scope=question&pesquisaId=" + revisao.id + "&questionId=" + quantidade!.id);
  assert.equal(perguntaCsv.statusCode, 200);
  assert.equal(lerCsv(perguntaCsv.rawPayload).matriz[1]![1], "0");
  assert.equal((await app.inject("/api/exportacoes/dados?format=csv&scope=question&pesquisaId=" + outra.id + "&questionId=" + quantidade!.id)).statusCode, 400);
  assert.equal((await app.inject("/api/pesquisas/inexistente/dashboard")).statusCode, 404);
  assert.equal((await app.inject("/api/exportacoes/dados?format=xlsx&scope=all&pesquisaId=inexistente")).statusCode, 404);
});

test("respostas múltiplas são revisáveis, preservadas e compatíveis com importações antigas", async () => {
  const csv = 'ID,Quais aparelhos você possui?,Comentário\n001,Celular;Computador;TV;Notebook,Texto; com ponto e vírgula\n002,Notebook;TV;Notebook,Outro texto';
  const revisao = await importarArquivo(Buffer.from(csv), "multiplas.csv");
  const aparelhos = revisao.colunas[1]!;
  assert.equal(aparelhos.respostasMultiplas, true);
  assert.equal(revisao.colunas[2]!.respostasMultiplas, false);
  const invalidas = revisao.colunas.map((c) => c.id === aparelhos.id ? { ...c, tipoVariavel: "quantitativa_discreta" as const } : c);
  await assert.rejects(salvarRevisao(revisao.id, { colunas: invalidas }), { code: "IMPORT_MULTIPLE_TYPE_INVALID" });
  await salvarRevisao(revisao.id, { colunas: revisao.colunas.map((c) => ({ ...c, respostasMultiplas: false })) });
  await confirmarImportacao(revisao.id);
  const url = "/api/pesquisas/" + revisao.id + "/dashboard";
  assert.equal((await app.inject(url)).json().data.perguntas[0].distribuicao.length, 2);
  // Simula a coluna de uma importação anterior à migration, sem flag configurada.
  const antiga = await importarArquivo(Buffer.from(csv), "antiga.csv");
  await obterBanco()("coluna").where({ id: antiga.colunas[1]!.id }).update({ respostas_multiplas: null });
  await confirmarImportacao(antiga.id);
  const dashboard = (await app.inject("/api/pesquisas/" + antiga.id + "/dashboard")).json().data;
  const pergunta = dashboard.perguntas[0];
  assert.equal(pergunta.respostasMultiplas, true);
  assert.equal(pergunta.totalMarcacoes, 6);
  assert.equal(pergunta.respostasValidas, 2);
  assert.equal(pergunta.distribuicao.length, 4);
  assert.deepEqual(pergunta.medidas.moda, ["TV", "Notebook"]);
  assert.deepEqual(pergunta.graficos, ["Barras"]);
  assert.equal(dashboard.perguntas[1].respostasMultiplas, false);
  const exportacao = await app.inject("/api/exportacoes/dados?format=xlsx&scope=all&pesquisaId=" + revisao.id);
  assert.equal(lerExcel(exportacao.rawPayload)[1]![1], "Celular;Computador;TV;Notebook");

  const nova = await importarArquivo(Buffer.from(csv), "nova.csv");
  await confirmarImportacao(nova.id);
  const resposta = await obterBanco()("resposta").where({ coluna_id: nova.colunas[1]!.id }).orderBy("valor_bruto").select("valor_categoria", "valor_bruto");
  assert.ok(resposta.some((r) => r.valor_categoria === "Notebook;TV" && r.valor_bruto === "Notebook;TV;Notebook"));
  assert.equal((await app.inject("/api/pesquisas/" + nova.id + "/dashboard")).json().data.perguntas[0].totalMarcacoes, 6);
});
