import type { CelulaBruta, TipoVariavel } from "../types/importacao.ts";

export function estaVazia(valor: CelulaBruta | undefined): boolean {
  return valor == null || (typeof valor === "string" && valor.trim() === "");
}

export function serializarBruto(valor: CelulaBruta | undefined): string | null {
  if (valor == null) return null;
  // Datas Excel são calendários sem fuso. Não acrescentar um Z que a fonte não fornece.
  if (valor instanceof Date) return valor.toISOString().slice(0, -1);
  return String(valor);
}

export function converterNumero(valor: string, decimal: "," | "."): number | null {
  const texto = valor.trim();
  const padrao = decimal === "," ? /^[+-]?\d+(,\d+)?$/ : /^[+-]?\d+(\.\d+)?$/;
  if (!padrao.test(texto)) return null;
  const numero = Number(decimal === "," ? texto.replace(",", ".") : texto);
  return Number.isFinite(numero) ? numero : null;
}

export function normalizarResposta(
  bruto: string | null,
  tipo: TipoVariavel,
  decimal: "," | ".",
  categorias: string[],
) {
  const vazio = { valor_numerico: null, valor_categoria: null };
  if (estaVazia(bruto)) return { ...vazio, problema: null };
  const texto = bruto!.trim();
  if (tipo.startsWith("quantitativa")) {
    const numero = converterNumero(texto, decimal);
    if (numero === null || (tipo === "quantitativa_discreta" && !Number.isSafeInteger(numero))) {
      return { ...vazio, problema: "Resposta numérica incompatível com o tipo confirmado." };
    }
    return { valor_numerico: numero, valor_categoria: null, problema: null };
  }
  if (tipo === "qualitativa_ordinal" && !categorias.includes(texto)) {
    return { ...vazio, problema: "Resposta ausente da lista de categorias ordinais confirmadas." };
  }
  return { valor_numerico: null, valor_categoria: texto, problema: null };
}
