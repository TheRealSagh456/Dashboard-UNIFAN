import { apiRequest } from "./api";
import type { CategoriaVariavel, PerguntaRow } from "../components/ui/question-grid";

export type ColunaImportada = {
  id: string;
  posicao: number;
  codigo: string;
  enunciado: string;
  cabecalhoOriginal: string;
  papel: "pergunta" | "metadado" | "nao_selecionada";
  tipoVariavel: "quantitativa_discreta" | "quantitativa_continua" | "qualitativa_nominal" | "qualitativa_ordinal" | null;
  categorias: string[];
  respostasMultiplas?: boolean;
  exemplos: Array<string | null>;
};

export type RevisaoImportacao = {
  id: string;
  nomeArquivoOriginal: string;
  status: "rascunho" | "revisao" | "confirmada" | "erro";
  formato: "csv" | "xlsx" | "xls";
  totalRespostas: number;
  delimitador: string | null;
  separadorDecimal: "," | "." | null;
  colunas: ColunaImportada[];
  problemas: Array<{ linha: number | null; colunaId: string | null; valorBruto: string | null; mensagem: string }>;
};

const categorias: Record<NonNullable<ColunaImportada["tipoVariavel"]>, CategoriaVariavel> = {
  quantitativa_discreta: "Discreta", quantitativa_continua: "Contínua",
  qualitativa_nominal: "Nominal", qualitativa_ordinal: "Ordinal",
};

const papeis: Record<ColunaImportada["papel"], PerguntaRow["papel"]> = {
  pergunta: "Pergunta", metadado: "Metadado", nao_selecionada: "Não analisar",
};

const papeisApi: Record<PerguntaRow["papel"], ColunaImportada["papel"]> = {
  Pergunta: "pergunta", Metadado: "metadado", "Não analisar": "nao_selecionada",
};

export function colunaParaLinha(coluna: ColunaImportada): PerguntaRow {
  return {
    id: coluna.id, codigo: coluna.codigo, enunciado: coluna.enunciado,
    papel: papeis[coluna.papel],
    tipo: coluna.tipoVariavel?.startsWith("quantitativa") ? "Quantitativa" : coluna.tipoVariavel ? "Qualitativa" : null,
    categoria: coluna.tipoVariavel ? categorias[coluna.tipoVariavel] : null,
    ordemCategorias: coluna.categorias.join("\n"),
    exemplos: coluna.exemplos,
    respostasMultiplas: coluna.respostasMultiplas ?? false,
  };
}

export function tipoDaLinha(linha: PerguntaRow): ColunaImportada["tipoVariavel"] {
  if (linha.papel !== "Pergunta") return null;
  if (linha.tipo === "Quantitativa") return linha.categoria === "Contínua" ? "quantitativa_continua" : "quantitativa_discreta";
  return linha.categoria === "Ordinal" ? "qualitativa_ordinal" : "qualitativa_nominal";
}

export async function enviarArquivo(arquivo: File) {
  const body = new FormData();
  body.append("arquivo", arquivo);
  return (await apiRequest<RevisaoImportacao>("/api/importacoes", { method: "POST", body })).data;
}

export async function obterRevisao(id: string) {
  return (await apiRequest<RevisaoImportacao>("/api/importacoes/" + id)).data;
}

export async function confirmarRevisao(revisao: RevisaoImportacao, linhas: PerguntaRow[]) {
  const colunas = revisao.colunas.map((coluna) => {
    const linha = linhas.find((item) => item.id === coluna.id)!;
    return {
      id: coluna.id, papel: papeisApi[linha.papel],
      tipoVariavel: tipoDaLinha(linha),
      respostasMultiplas: tipoDaLinha(linha) === "qualitativa_nominal" && Boolean(linha.respostasMultiplas ?? coluna.respostasMultiplas),
      categorias: (linha.ordemCategorias ?? coluna.categorias.join("\n")).split("\n").map((valor) => valor.trim()).filter(Boolean),
    };
  });
  await apiRequest("/api/importacoes/" + revisao.id + "/colunas", {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colunas, ...(revisao.separadorDecimal ? { separadorDecimal: revisao.separadorDecimal } : {}) }),
  });
  return (await apiRequest<RevisaoImportacao>("/api/importacoes/" + revisao.id + "/confirmar", { method: "POST" })).data;
}
