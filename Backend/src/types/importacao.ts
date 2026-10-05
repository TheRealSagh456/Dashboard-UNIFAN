// Vocabulário do schema SQLite. Estes tipos não validam dados recebidos.
// Consulte Docs/backend-guide.md e Docs/import-format.md antes de usá-los.

export type FormatoImportacao = "xlsx" | "xls" | "csv";

export type StatusImportacao = "rascunho" | "revisao" | "confirmada" | "erro";

export type PapelColuna = "pergunta" | "metadado" | "nao_selecionada";

export type TipoVariavel =
  | "quantitativa_discreta"
  | "quantitativa_continua"
  | "qualitativa_nominal"
  | "qualitativa_ordinal";

// Valor extraído do arquivo, antes de qualquer normalização.
export type CelulaBruta = string | number | boolean | Date | null;
export type MatrizBruta = CelulaBruta[][];
