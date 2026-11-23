import type { TipoVariavel } from "../types/importacao.ts";
import { separarAlternativas } from "../importacao/respostas-multiplas.ts";
import type { CategoriaPergunta, ClasseFrequencia, Medidas, TipoGrafico, ValorEstatistico } from "../types/dashboard.ts";

const categorias: Record<TipoVariavel, CategoriaPergunta> = {
  quantitativa_discreta: "Discreta", quantitativa_continua: "Contínua",
  qualitativa_nominal: "Nominal", qualitativa_ordinal: "Ordinal",
};
const graficos: Record<CategoriaPergunta, TipoGrafico[]> = {
  Discreta: ["Colunas", "Pontos", "Boxplot"],
  Contínua: ["Histograma", "Boxplot", "Pontos"],
  Nominal: ["Barras", "Pizza"],
  Ordinal: ["Colunas", "Pontos"],
};
const formatador = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 10 });
const formatadorPrecisao = new Intl.NumberFormat("pt-BR", { maximumSignificantDigits: 17 });

type ClasseBase = Pick<ClasseFrequencia, "dados" | "fi" | "valor" | "histograma">;

// Interpolação linear na posição (n - 1) * p, com os dados já ordenados.
export function quantil(ordenados: number[], proporcao: number): number {
  const posicao = (ordenados.length - 1) * proporcao;
  const indice = Math.floor(posicao);
  const inferior = ordenados[indice]!;
  const superior = ordenados[Math.min(indice + 1, ordenados.length - 1)]!;
  return inferior + (superior - inferior) * (posicao - indice);
}

function contar(valores: ValorEstatistico[]) {
  const frequencias = new Map<ValorEstatistico, number>();
  for (const valor of valores) frequencias.set(valor, (frequencias.get(valor) ?? 0) + 1);
  return frequencias;
}

function modas(frequencias: Map<ValorEstatistico, number>, total: number) {
  let maior = 0;
  for (const quantidade of frequencias.values()) maior = Math.max(maior, quantidade);
  if (maior === 1 && total > 1) return [];
  return [...frequencias].filter(([, fi]) => fi === maior).map(([valor]) => valor);
}

function classesSturges(ordenados: number[]): ClasseBase[] {
  if (!ordenados.length) return [];
  const minimo = ordenados[0]!;
  const maximo = ordenados[ordenados.length - 1]!;
  const constante = minimo === maximo;
  const quantidadeSugerida = constante ? 1 : Math.ceil(1 + Math.log2(ordenados.length));
  const meiaAmplitude = Math.max(0.5, Math.abs(minimo) * Number.EPSILON / 2);
  const inicio = constante ? Math.max(-Number.MAX_VALUE, minimo - meiaAmplitude) : minimo;
  const fim = constante ? Math.min(Number.MAX_VALUE, maximo + meiaAmplitude) : maximo;
  const amplitude = (fim - inicio) / quantidadeSugerida;
  if (!Number.isFinite(amplitude) || amplitude <= 0) return [];
  // Limites muito próximos podem coincidir na precisão de um number.
  const limites = Array.from({ length: quantidadeSugerida + 1 }, (_, i) => i === quantidadeSugerida ? fim : inicio + i * amplitude)
    .filter((limite, i, todos) => i === 0 || limite > todos[i - 1]!);
  const quantidade = limites.length - 1;
  let rotulos = limites.map((limite) => formatador.format(limite));
  if (new Set(rotulos).size < limites.length) {
    rotulos = limites.map((limite) => formatadorPrecisao.format(limite));
  }
  const contagens = Array<number>(quantidade).fill(0);
  for (const valor of ordenados) {
    let indice = 0;
    while (indice < quantidade - 1 && valor >= limites[indice + 1]!) indice++;
    contagens[indice] = contagens[indice]! + 1;
  }
  return contagens.map((fi, i) => {
    const inferior = limites[i]!;
    const superior = limites[i + 1]!;
    return {
      dados: `${rotulos[i]} ${i === quantidade - 1 ? "|-|" : "|-"} ${rotulos[i + 1]}`,
      valor: inferior + (superior - inferior) / 2,
      fi,
      histograma: { limiteInferior: inferior, limiteSuperior: superior, densidade: fi / (superior - inferior) },
    };
  });
}

function acumularFrequencias(classes: ClasseBase[], total: number): ClasseFrequencia[] {
  let acumulada = 0;
  return classes.map((classe, i) => {
    acumulada += classe.fi;
    const fr = total ? classe.fi / total : 0;
    const frAcumulada = total ? acumulada / total : 0;
    return { ...classe, classe: i + 1, fiAcumulada: acumulada, fr, frAcumulada, frPercentual: fr * 100, frPercentualAcumulada: frAcumulada * 100 };
  });
}

export function analisarValores(tipo: TipoVariavel, respostas: Array<ValorEstatistico | null>, ordem: string[] = []) {
  const valores = respostas.filter((valor): valor is ValorEstatistico => valor !== null);
  const numerica = tipo.startsWith("quantitativa");
  const categoria = categorias[tipo];
  const ordenados = numerica ? (valores as number[]).toSorted((a, b) => a - b) : [];
  const frequencias = contar(numerica ? ordenados : valores);
  const medidas: Medidas = {};
  let boxplot;
  if (valores.length) {
    medidas.moda = modas(frequencias, valores.length);
    if (numerica) {
      medidas.media = ordenados.reduce((soma, valor) => soma + valor, 0) / ordenados.length;
      medidas.mediana = quantil(ordenados, 0.5);
      medidas.primeiroQuartil = quantil(ordenados, 0.25);
      medidas.terceiroQuartil = quantil(ordenados, 0.75);
      boxplot = {
        minimo: ordenados[0]!, primeiroQuartil: medidas.primeiroQuartil,
        mediana: medidas.mediana, terceiroQuartil: medidas.terceiroQuartil,
        maximo: ordenados[ordenados.length - 1]!,
      };
    } else if (tipo === "qualitativa_ordinal") {
      const posicionadas = (valores as string[]).toSorted((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
      const inferior = posicionadas[Math.floor((posicionadas.length - 1) / 2)]!;
      const superior = posicionadas[Math.floor(posicionadas.length / 2)]!;
      medidas.mediana = inferior === superior ? inferior : [inferior, superior];
      medidas.moda.sort((a, b) => ordem.indexOf(String(a)) - ordem.indexOf(String(b)));
    }
  }

  let classes: ClasseBase[];
  if (tipo === "quantitativa_continua") {
    classes = classesSturges(ordenados);
  } else if (tipo === "qualitativa_ordinal") {
    classes = ordem.map((rotulo) => ({ dados: rotulo, fi: frequencias.get(rotulo) ?? 0 }));
  } else {
    classes = [...frequencias].map(([valor, fi]) => ({
      dados: typeof valor === "number" ? formatador.format(valor) : valor, fi,
      ...(typeof valor === "number" ? { valor } : {}),
    }));
  }
  const distribuicao = acumularFrequencias(classes, valores.length);
  const distribuicaoAgrupada = tipo === "quantitativa_discreta"
    ? acumularFrequencias(classesSturges(ordenados), valores.length)
    : undefined;
  return {
    tipo: numerica ? "Quantitativa" as const : "Qualitativa" as const, categoria,
    totalRespostas: respostas.length, respostasValidas: valores.length,
    respostasMultiplas: false, totalMarcacoes: valores.length,
    respostasAusentes: respostas.length - valores.length,
    percentualAusentes: respostas.length ? ((respostas.length - valores.length) / respostas.length) * 100 : 0,
    medidas, distribuicao, ...(distribuicaoAgrupada && { distribuicaoAgrupada }), graficos: [...graficos[categoria]],
    graficoRecomendado: graficos[categoria][0]!, ...(boxplot ? { boxplot } : {}),
  };
}

export function analisarRespostasMultiplas(respostas: Array<string | null>) {
  const alternativas = respostas.map(separarAlternativas);
  const validas = alternativas.filter((itens) => itens.length > 0).length;
  const frequencias = contar(alternativas.flat());
  const totalMarcacoes = alternativas.reduce((total, itens) => total + itens.length, 0);
  const maior = Math.max(0, ...frequencias.values());
  return {
    tipo: "Qualitativa" as const, categoria: "Nominal" as const,
    respostasMultiplas: true, totalMarcacoes,
    totalRespostas: respostas.length, respostasValidas: validas,
    respostasAusentes: respostas.length - validas,
    percentualAusentes: respostas.length ? ((respostas.length - validas) / respostas.length) * 100 : 0,
    medidas: validas ? { moda: [...frequencias].filter(([, fi]) => fi === maior).map(([valor]) => valor) } : {},
    distribuicao: [...frequencias].map(([valor, fi], i) => ({
      classe: i + 1, dados: String(valor), fi, fr: validas ? fi / validas : 0,
      frPercentual: validas ? (fi / validas) * 100 : 0,
      fiAcumulada: null, frAcumulada: null, frPercentualAcumulada: null,
    })),
    graficos: ["Barras"] as TipoGrafico[], graficoRecomendado: "Barras" as const,
  };
}
