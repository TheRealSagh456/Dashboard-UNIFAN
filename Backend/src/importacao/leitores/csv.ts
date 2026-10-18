import { parse } from "csv-parse/sync";
import { ErroAplicacao } from "../../utils/erro-aplicacao.ts";
import type { MatrizBruta } from "../../types/importacao.ts";

export function lerCsv(buffer: Buffer, delimitador?: string) {
  const candidatos = delimitador ? [delimitador] : [",", ";", "\t"];
  const leituras: Array<{ matriz: MatrizBruta; delimitador: string }> = [];

  for (const candidato of candidatos) {
    try {
      const matriz = parse(buffer, {
        bom: true,
        delimiter: candidato,
        columns: false,
        cast: false,
        skip_empty_lines: true,
        relax_column_count: false,
      }) as string[][];
      if (matriz.length > 0) leituras.push({ matriz, delimitador: candidato });
    } catch {
      // Um separador incompatível costuma produzir aspas ou colunas inválidas.
    }
  }

  leituras.sort((a, b) => (b.matriz[0]?.length ?? 0) - (a.matriz[0]?.length ?? 0));
  const resultado = leituras[0];
  if (!resultado) {
    throw new ErroAplicacao("Não foi possível ler o CSV. Confira o separador e as colunas.", "IMPORT_CSV_INVALID");
  }
  if (!delimitador && leituras[1]?.matriz[0]?.length === resultado.matriz[0]?.length && (resultado.matriz[0]?.length ?? 0) > 1) {
    throw new ErroAplicacao("Informe o delimitador do CSV no upload.", "IMPORT_DELIMITER_AMBIGUOUS");
  }
  return resultado;
}
