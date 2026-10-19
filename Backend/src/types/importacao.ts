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

export type ConfiguracaoColuna = {
  id: string;
  papel: PapelColuna;
  tipoVariavel: TipoVariavel | null;
  categorias: string[];
  respostasMultiplas?: boolean;
};

export type ColunaImportacao = ConfiguracaoColuna & {
  posicao: number;
  cabecalhoOriginal: string;
  enunciado: string;
  codigo: string;
  exemplos: Array<string | null>;
};

export type ColunaBanco = {
  id: string;
  importacao_id: string;
  posicao_original: number;
  cabecalho_original: string;
  papel: PapelColuna;
  tipo_variavel: TipoVariavel | null;
  codigo_referencia: string | null;
  categorias_confirmadas: string | null;
  respostas_multiplas: 0 | 1 | null;
};

export type ImportacaoBanco = {
  id: string;
  nome_arquivo: string;
  formato: FormatoImportacao;
  status: StatusImportacao;
  delimitador: string | null;
  separador_decimal: "," | "." | null;
  atualizado_em: string;
};

export type RevisaoImportacao = {
  id: string;
  nomeArquivoOriginal: string;
  formato: FormatoImportacao;
  status: StatusImportacao;
  delimitador: string | null;
  separadorDecimal: "," | "." | null;
  totalRespostas: number;
  colunas: ColunaImportacao[];
  problemas: Array<{
    linha: number | null;
    colunaId: string | null;
    valorBruto: string | null;
    mensagem: string;
  }>;
};
