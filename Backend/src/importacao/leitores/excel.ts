import { createRequire } from "node:module";
import type { MatrizBruta } from "../../types/importacao.ts";
import { ErroAplicacao } from "../../utils/erro-aplicacao.ts";
import { estaVazia } from "../normalizacao.ts";

const require = createRequire(import.meta.url);
export const XLSX: typeof import("xlsx") = require("xlsx");

export function lerExcel(buffer: Buffer): MatrizBruta {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  for (const nome of workbook.SheetNames) {
    const aba = workbook.Sheets[nome];
    if (!aba) continue;
    const matriz = XLSX.utils.sheet_to_json<MatrizBruta[number]>(aba, {
      header: 1, raw: true, defval: null, blankrows: true, range: 0, UTC: true,
    });
    if (!matriz.some((linha) => linha.some((valor) => !estaVazia(valor)))) continue;
    for (const [endereco, celula] of Object.entries(aba)) {
      if (!endereco.startsWith("!") && (celula.f != null || celula.t === "e")) {
        throw new ErroAplicacao("Use uma planilha de respostas sem fórmulas ou células de erro.", "IMPORT_EXCEL_CELL_INVALID");
      }
    }
    return matriz;
  }
  throw new ErroAplicacao("A planilha está vazia.", "IMPORT_EMPTY");
}
