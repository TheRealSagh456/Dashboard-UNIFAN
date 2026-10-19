import assert from "node:assert/strict";
import { test } from "node:test";
import { analisarValores, analisarRespostasMultiplas } from "./calculos.ts";

test("discreta preserva zero e calcula medidas, ausências e frequências", () => {
  const analise = analisarValores("quantitativa_discreta", [0, 1, 1, 2, 4, null]);
  assert.deepEqual(analise.medidas, { media: 1.6, mediana: 1, moda: [1], primeiroQuartil: 1, terceiroQuartil: 2 });
  assert.equal(analise.totalRespostas, 6);
  assert.equal(analise.respostasValidas, 5);
  assert.equal(analise.respostasAusentes, 1);
  assert.ok(Math.abs(analise.percentualAusentes - 100 / 6) < 1e-12);
  assert.deepEqual(analise.distribuicao.map((c) => [c.dados, c.fi, c.fiAcumulada]), [["0", 1, 1], ["1", 2, 3], ["2", 1, 4], ["4", 1, 5]]);
  assert.equal(analise.distribuicao[1]!.fr, 0.4);
  assert.deepEqual(analise.distribuicao.map((c) => c.valor), [0, 1, 2, 4]);
  assert.equal(analise.distribuicao[1]!.frPercentual, 40);
  assert.equal(analise.distribuicao.at(-1)!.frAcumulada, 1);
  assert.equal(analise.distribuicao.at(-1)!.frPercentualAcumulada, 100);
  assert.deepEqual(analise.boxplot, { minimo: 0, primeiroQuartil: 1, mediana: 1, terceiroQuartil: 2, maximo: 4 });
});

test("quartis interpolam a posição (n - 1) * p em amostra par", () => {
  const analise = analisarValores("quantitativa_discreta", [30, 0, 20, 10]);
  assert.deepEqual(analise.medidas, { media: 15, mediana: 15, moda: [], primeiroQuartil: 7.5, terceiroQuartil: 22.5 });
});

test("nominal tem apenas moda, preserva empates e ordem de ocorrência", () => {
  const analise = analisarValores("qualitativa_nominal", ["Sim", "Não", "Sim", null]);
  assert.deepEqual(analise.medidas, { moda: ["Sim"] });
  assert.deepEqual(analise.distribuicao.map((c) => c.dados), ["Sim", "Não"]);
  assert.deepEqual(analisarValores("qualitativa_nominal", ["B", "A", "B", "A"]).medidas, { moda: ["B", "A"] });
  assert.equal(analise.boxplot, undefined);
});

test("ordinal usa a ordem confirmada, inclui categorias vazias e informa duas centrais", () => {
  const analise = analisarValores("qualitativa_ordinal", ["Alta", "Baixa", "Alta", "Média", null], ["Baixa", "Média", "Alta", "Máxima"]);
  assert.deepEqual(analise.medidas, { moda: ["Alta"], mediana: ["Média", "Alta"] });
  assert.deepEqual(analise.distribuicao.map((c) => [c.dados, c.fi]), [["Baixa", 1], ["Média", 1], ["Alta", 2], ["Máxima", 0]]);
  assert.equal(analisarValores("qualitativa_ordinal", ["Alta", "Baixa", "Alta"], ["Baixa", "Alta"]).medidas.mediana, "Alta");
});

test("Sturges produz classes contíguas, inclui o máximo e usa densidade absoluta", () => {
  const analise = analisarValores("quantitativa_continua", [0, 1, 2, 3, 4, 5, 6, 8]);
  assert.equal(analise.distribuicao.length, 4);
  assert.deepEqual(analise.distribuicao.map((c) => c.valor), [1, 3, 5, 7]);
  assert.deepEqual(analise.distribuicao.map((c) => c.fi), [2, 2, 2, 2]);
  assert.deepEqual(analise.distribuicao.map((c) => c.histograma), [
    { limiteInferior: 0, limiteSuperior: 2, densidade: 1 },
    { limiteInferior: 2, limiteSuperior: 4, densidade: 1 },
    { limiteInferior: 4, limiteSuperior: 6, densidade: 1 },
    { limiteInferior: 6, limiteSuperior: 8, densidade: 1 },
  ]);
  assert.equal(analise.distribuicao[0]!.dados, "[0; 2)");
  assert.equal(analise.distribuicao.at(-1)!.dados, "[6; 8]");
  assert.equal(analise.distribuicao.reduce((area, c) => area + c.histograma!.densidade * (c.histograma!.limiteSuperior - c.histograma!.limiteInferior), 0), 8);
});

test("amostra constante usa uma classe de amplitude um e boxplot constante", () => {
  const analise = analisarValores("quantitativa_continua", [2.5, 2.5]);
  assert.equal(analise.distribuicao.length, 1);
  assert.deepEqual(analise.distribuicao[0]!.histograma, { limiteInferior: 2, limiteSuperior: 3, densidade: 2 });
  assert.deepEqual(analise.medidas, { media: 2.5, mediana: 2.5, moda: [2.5], primeiroQuartil: 2.5, terceiroQuartil: 2.5 });
});

test("classes com valores pequenos mantêm rótulos distintos e pontos médios numéricos", () => {
  const analise = analisarValores("quantitativa_continua", [0.00000001, 0.00000002, 0.00000003]);
  assert.equal(new Set(analise.distribuicao.map((classe) => classe.dados)).size, 3);
  for (const classe of analise.distribuicao) {
    assert.ok(classe.valor! >= classe.histograma!.limiteInferior);
    assert.ok(classe.valor! <= classe.histograma!.limiteSuperior);
    assert.ok(!classe.dados.includes("[0; 0"));
  }
});

test("sem valores válidos não inventa medidas, percentuais ou boxplot", () => {
  for (const tipo of ["quantitativa_discreta", "quantitativa_continua", "qualitativa_nominal", "qualitativa_ordinal"] as const) {
    const analise = analisarValores(tipo, [null, null], ["Baixa", "Alta"]);
    assert.deepEqual(analise.medidas, {});
    assert.equal(analise.boxplot, undefined);
    assert.equal(analise.respostasValidas, 0);
    assert.equal(analise.percentualAusentes, 100);
    assert.ok(analise.distribuicao.every((c) => c.fi === 0 && c.fr === 0 && c.frPercentualAcumulada === 0));
    assert.ok(!JSON.stringify(analise).includes("NaN"));
  }
  assert.equal(analisarValores("quantitativa_discreta", []).percentualAusentes, 0);
});

test("múltiplas escolhas usam participantes válidos, deduplicam e omitem acumulados", () => {
  const analise = analisarRespostasMultiplas(["Celular; Notebook; Celular", "Notebook;TV", null, " ; "]);
  assert.equal(analise.respostasValidas, 2);
  assert.equal(analise.respostasAusentes, 2);
  assert.equal(analise.totalMarcacoes, 4);
  assert.deepEqual(analise.distribuicao.map((c) => [c.dados, c.fi, c.frPercentual]), [["Celular", 1, 50], ["Notebook", 2, 100], ["TV", 1, 50]]);
  assert.deepEqual(analise.medidas.moda, ["Notebook"]);
  assert.ok(analise.distribuicao.every((c) => c.fiAcumulada === null && c.frAcumulada === null && c.frPercentualAcumulada === null));
  assert.deepEqual(analise.graficos, ["Barras"]);
});

test("uma pessoa pode marcar quatro alternativas e todas ficam empatadas como mais selecionadas", () => {
  const analise = analisarRespostasMultiplas(["Celular/Smartphone;Computador;Televisão;Notebook"]);
  assert.equal(analise.respostasValidas, 1);
  assert.equal(analise.totalMarcacoes, 4);
  assert.deepEqual(analise.medidas.moda, ["Celular/Smartphone", "Computador", "Televisão", "Notebook"]);
  assert.ok(analise.distribuicao.every((c) => c.fi === 1 && c.frPercentual === 100));
  assert.deepEqual(analisarRespostasMultiplas([null]).medidas, {});
});
