import type { ConfiguracaoColuna, MatrizBruta } from "../types/importacao.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";
import { estaVazia } from "./normalizacao.ts";

export const LIMITE_ARQUIVO = 10 * 1024 * 1024;
export const LIMITE_RESPOSTAS = 10_000;

export function validarMatriz(matriz: MatrizBruta) {
  const cabecalhos = matriz[0];
  const registros = matriz.slice(1)
    .map((valores, indice) => ({ valores, indiceLinha: indice + 2 }))
    .filter(({ valores }) => valores.some((valor) => !estaVazia(valor)));
  if (!cabecalhos?.length || !registros.length) {
    throw new ErroAplicacao("O arquivo precisa de cabeçalhos e ao menos uma resposta.", "IMPORT_EMPTY");
  }
  if (registros.length > LIMITE_RESPOSTAS) {
    throw new ErroAplicacao("Importe até 10.000 respostas por arquivo.", "IMPORT_ROW_LIMIT", 413);
  }
  if (registros.some(({ valores }) => valores.slice(cabecalhos.length).some((valor) => !estaVazia(valor)))) {
    throw new ErroAplicacao("Há respostas fora das colunas identificadas no cabeçalho.", "IMPORT_COLUMNS_INVALID");
  }
  return { cabecalhos, registros };
}

export function validarConfiguracao(colunas: ConfiguracaoColuna[]) {
  const perguntas = colunas.filter((coluna) => coluna.papel === "pergunta");
  if (perguntas.length < 1 || perguntas.length > 30) {
    throw new ErroAplicacao("Selecione de 1 a 30 perguntas.", "IMPORT_QUESTION_LIMIT");
  }
  for (const coluna of perguntas) {
    if (!coluna.tipoVariavel) {
      throw new ErroAplicacao("Confirme o tipo de todas as perguntas.", "IMPORT_TYPE_REQUIRED");
    }
    if (coluna.tipoVariavel === "qualitativa_ordinal" &&
      (!coluna.categorias.length || coluna.categorias.some((valor) => !valor.trim()) || new Set(coluna.categorias).size !== coluna.categorias.length)) {
      throw new ErroAplicacao("Informe as categorias ordinais, sem repetições, na ordem desejada.", "IMPORT_CATEGORIES_REQUIRED");
    }
  }
}
