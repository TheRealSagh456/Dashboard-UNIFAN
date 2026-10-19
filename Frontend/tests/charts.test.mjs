import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Executa os componentes TSX no Node, sem instalar outro runner de testes.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.includes("/src/") && !extname(specifier)) {
      const path = fileURLToPath(new URL(specifier, context.parentURL));
      const suffix = [".ts", ".tsx", "/index.ts"].find((value) => existsSync(path + value));
      return next(specifier + suffix, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.includes("/src/") && /\.tsx?$/.test(url)) return {
      format: "module", shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText,
    };
    return next(url, context);
  },
});

const { criarEscalaAgradavel, criarEscalaIntervalo } = await import("../src/utils/chart-scale.ts");
const { criarSetores, formatarValorDoEixo } = await import("../src/utils/chart-layout.ts");
const { CartesianChart } = await import("../src/components/data-display/cartesian-chart.tsx");
const { BoxplotChart } = await import("../src/components/data-display/boxplot-chart.tsx");
const { PieChart } = await import("../src/components/data-display/pie-chart.tsx");
const { DonutChart } = await import("../src/components/data-display/donut-chart.tsx");
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test("densidades abaixo de um usam a amplitude real e contagens usam ticks inteiros", () => {
  const escala = criarEscalaAgradavel(0.04);
  assert.ok(escala.limite >= 0.04 && escala.limite < 0.1);
  assert.deepEqual(criarEscalaAgradavel(1, 5, true).marcacoes, [0, 1, 2]);
  assert.ok(criarEscalaAgradavel(3, 5, true).marcacoes.every(Number.isInteger));
  assert.notEqual(formatarValorDoEixo(0.00000012), "0");
});

test("escala do boxplot cobre valores positivos, negativos, constantes e pequenos", () => {
  for (const [minimo, maximo] of [[112, 120], [-10, -2], [0, 0], [2.5, 2.5], [0.00001, 0.00002]]) {
    const escala = criarEscalaIntervalo(minimo, maximo);
    assert.ok(escala.inicio <= minimo && escala.limite >= maximo);
    assert.ok(escala.limite > escala.inicio);
    assert.ok(escala.marcacoes.every(Number.isFinite));
  }
  assert.ok(criarEscalaIntervalo(112, 120).inicio > 100);
});

test("histograma não fica achatado quando a densidade é menor que um", () => {
  const markup = render(CartesianChart, { variant: "histogram", xLabel: "Valor", yLabel: "Densidade", data: [
    { label: "[0; 100)", value: 2, histogram: { lowerBound: 0, upperBound: 100, density: 0.02 } },
    { label: "[100; 200]", value: 3, histogram: { lowerBound: 100, upperBound: 200, density: 0.03 } },
  ] });
  const paths = [...markup.matchAll(/d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/g)];
  assert.equal(paths.length, 2);
  assert.ok(Number(paths[1][4]) > 24 && Number(paths[1][4]) < 120);
  assert.equal(Number(paths[0][1]), 80);
  assert.ok(!markup.includes("NaN"));
});

test("colunas e pontos deixam um bloco livre acima da maior frequência", () => {
  const escala = criarEscalaAgradavel(10, 5, true);
  assert.deepEqual(escala.marcacoes, [0, 2, 4, 6, 8, 10, 12]);
  assert.equal(escala.limite, 12);
  for (const variant of ["columns", "line"]) {
    const markup = render(CartesianChart, {
      variant, xLabel: "Categorias", yLabel: "Quantidade",
      data: [{ label: "Nunca", value: 10 }, { label: "Raramente", value: 9 }],
    });
    assert.ok(markup.includes(">12</text>"));
    const topo = variant === "line"
      ? Number(markup.match(/cy="([\d.]+)"/)[1])
      : Number(markup.match(/d="M [\d.]+ [\d.]+ L [\d.]+ ([\d.]+)/)[1]);
    assert.ok(topo > 24, "O maior valor deve ficar abaixo da grade superior.");
  }
});

test("muitas categorias preservam todas as marcas, limitam rótulos e o tempo de animação", () => {
  const data = Array.from({ length: 50 }, (_, i) => ({ label: "Categoria " + i, value: 1 }));
  for (const variant of ["columns", "line", "bars"]) {
    const markup = render(CartesianChart, { data, variant, xLabel: "Dados", yLabel: "Quantidade" });
    assert.equal([...markup.matchAll(/data-chart-item=/g)].length, 50);
    if (variant !== "bars") assert.ok([...markup.matchAll(/<text /g)].length < 20);
    for (const [, delay] of markup.matchAll(/animation-delay:([\d.]+)ms/g)) assert.ok(Number(delay) <= 820);
    assert.ok(!markup.includes("NaN"));
  }
});

test("pontos quantitativos respeitam a distância numérica sem interpretar rótulos", () => {
  const markup = render(CartesianChart, { variant: "line", xLabel: "Valor", yLabel: "Quantidade", data: [
    { label: "Zero", xValue: 0, value: 1 }, { label: "Um", xValue: 1, value: 2 }, { label: "Cem", xValue: 100, value: 3 },
  ] });
  const xs = [...markup.matchAll(/cx="([\d.]+)"/g)].map((match) => Number(match[1]));
  assert.equal(xs.length, 3);
  assert.ok(Math.abs((xs[1] - xs[0]) / (xs[2] - xs[1]) - 1 / 99) < 1e-9);
});

test("boxplot constante mantém geometria finita e cinco áreas acessíveis distintas", () => {
  const markup = render(BoxplotChart, { data: { minimum: -5, firstQuartile: -5, median: -5, thirdQuartile: -5, maximum: -5 } });
  const areas = [...markup.matchAll(/<rect[^>]*data-chart-item="true"[^>]*>/g)].map((match) => match[0]);
  assert.equal(areas.length, 5);
  assert.equal(new Set(areas.map((area) => area.match(/ y="([^"]+)"/)[1])).size, 5);
  assert.ok(!markup.includes("NaN") && !markup.includes("Infinity"));
});

test("pizza e rosca fecham 360 graus, omitem setores zero e exibem estado vazio", () => {
  assert.equal(criarSetores([{ value: 1 }, { value: 1 }, { value: 1 }]).at(-1).end, 360);
  for (const component of [PieChart, DonutChart]) {
    const props = { centerValue: "3", centerLabel: "Respostas", data: [{ label: "Tudo", value: 3 }, { label: "Vazio", value: 0 }] };
    const markup = render(component, props);
    assert.equal([...markup.matchAll(/data-chart-item=/g)].length, 1);
    assert.ok(markup.includes("A 82 82") || markup.includes("A 88 88"));
    assert.ok(render(component, { ...props, data: [] }).includes("Não há dados"));
  }
  const varias = render(PieChart, { data: Array.from({ length: 6 }, (_, i) => ({ label: "Grupo " + i, value: 1 })) });
  assert.equal(new Set([...varias.matchAll(/fill:hsl\(([^)]+)\)/g)].map((match) => match[1])).size, 6);
});

test("card de moda exibe alternativas em lista e permite quebra de palavras longas", async () => {
  const { MetricCard } = await import("../src/components/data-display/metric-card.tsx");
  const opcoes = ["Celular/Smartphone", "Computador", "Televisão", "Notebook"];
  const markup = render(MetricCard, { label: "Mais selecionadas", value: opcoes });
  assert.equal([...markup.matchAll(/<li>/g)].length, 4);
  assert.ok(markup.includes("[overflow-wrap:anywhere]"));
  const texto = "AlternativaComTextoMuitoLongoSemEspacosParaConferirQuebra";
  const simples = render(MetricCard, { label: "Moda", value: texto });
  assert.ok(simples.includes("whitespace-normal") && simples.includes(texto));
});

test("API mantém as modas separadas e tabela múltipla omite acumulados e pizza", async () => {
  const { carregarDashboard } = await import("../src/services/dashboard.ts");
  const { TabelaFrequencias } = await import("../src/feats/home/frequency-table.tsx");
  const { VisualizacaoPergunta } = await import("../src/feats/home/question-charts.tsx");
  const alternativas = ["Celular/Smartphone", "Computador", "Televisão", "Notebook"];
  const api = {
    id: "aparelhos", codigo: "Q19", enunciado: "Quais aparelhos possui?",
    tipo: "Qualitativa", categoria: "Nominal", respostasMultiplas: true,
    totalRespostas: 1, respostasValidas: 1, respostasAusentes: 0, percentualAusentes: 0, totalMarcacoes: 4,
    medidas: { moda: alternativas }, graficos: ["Barras"], graficoRecomendado: "Barras",
    distribuicao: alternativas.map((dados, i) => ({ classe: i + 1, dados, fi: 1, fr: 1, frPercentual: 100, fiAcumulada: null, frAcumulada: null, frPercentualAcumulada: null })),
  };
  const anterior = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ data: { pesquisa: { id: "teste" }, perguntas: [api] } });
    const dashboard = await carregarDashboard("teste");
    const pergunta = dashboard.perguntas[0];
    assert.deepEqual(pergunta.medidas.moda, alternativas);
    const tabela = render(TabelaFrequencias, { pergunta });
    assert.ok(tabela.includes("% dos participantes") && tabela.includes("4 marcações"));
    assert.ok(!tabela.includes("fi (acu)"));
    const grafico = render(VisualizacaoPergunta, { pergunta, grafico: "Pizza" });
    assert.equal([...grafico.matchAll(/data-chart-item=/g)].length, 4);
    assert.ok(!grafico.includes("<mask"));
  } finally { globalThis.fetch = anterior; }
});
