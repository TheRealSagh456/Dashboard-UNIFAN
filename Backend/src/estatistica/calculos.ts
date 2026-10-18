import type { TipoVariavel } from "../types/importacao.ts";
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

function histograma(ordenados: number[]) {
  const minimo = ordenados[0]!;
  const maximo = ordenados[ordenados.length - 1]!;
  const quantidade = minimo === maximo ? 1 : Math.ceil(1 + Math.log2(ordenados.length));
  const inicio = minimo === maximo ? minimo - 0.5 : minimo;
  const fim = minimo === maximo ? maximo + 0.5 : maximo;
  const amplitude = (fim - inicio) / quantidade;
  if (!Number.isFinite(amplitude) || amplitude <= 0) return [];
  const limites = Array.from({ length: quantidade + 1 }, (_, i) => i === quantidade ? fim : inicio + i * amplitude);
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
      dados: `[${formatador.format(inferior)}; ${formatador.format(superior)}${i === quantidade - 1 ? "]" : ")"}`,
      valor: inferior + (superior - inferior) / 2,
      fi,
      histograma: { limiteInferior: inferior, limiteSuperior: superior, densidade: fi / (superior - inferior) },
    };
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

  let classes: Array<{ dados: string; fi: number; valor?: number; histograma?: NonNullable<ClasseFrequencia["histograma"]> }>;
  if (tipo === "quantitativa_continua" && valores.length) {
    classes = histograma(ordenados);
  } else if (tipo === "qualitativa_ordinal") {
    classes = ordem.map((rotulo) => ({ dados: rotulo, fi: frequencias.get(rotulo) ?? 0 }));
  } else {
    classes = [...frequencias].map(([valor, fi]) => ({
      dados: typeof valor === "number" ? formatador.format(valor) : valor, fi,
      ...(typeof valor === "number" ? { valor } : {}),
    }));
  }
  let acumulada = 0;
  const distribuicao = classes.map((classe, i) => {
    acumulada += classe.fi;
    const fr = valores.length ? classe.fi / valores.length : 0;
    const frAcumulada = valores.length ? acumulada / valores.length : 0;
    return { ...classe, classe: i + 1, fiAcumulada: acumulada, fr, frAcumulada, frPercentual: fr * 100, frPercentualAcumulada: frAcumulada * 100 };
  });
  return {
    tipo: numerica ? "Quantitativa" as const : "Qualitativa" as const, categoria,
    totalRespostas: respostas.length, respostasValidas: valores.length,
    respostasAusentes: respostas.length - valores.length,
    percentualAusentes: respostas.length ? ((respostas.length - valores.length) / respostas.length) * 100 : 0,
    medidas, distribuicao, graficos: [...graficos[categoria]],
    graficoRecomendado: graficos[categoria][0]!, ...(boxplot ? { boxplot } : {}),
  };
}
