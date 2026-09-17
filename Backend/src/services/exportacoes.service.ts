import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export type FormatoExportacao = "xlsx" | "csv";
export type EscopoExportacao = "all" | "question";

type OpcoesExportacao = {
  format?: string;
  scope?: string;
  questionId?: string;
};

type ResultadoExportacao = {
  conteudo: Buffer;
  nomeArquivo: string;
  mimeType: string;
};

export class ErroExportacao extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

const arquivoXlsx = fileURLToPath(
  new URL("../../../Mocks/forms/pesquisa-tecnologia.mock.xlsx", import.meta.url),
);
const arquivoCsv = fileURLToPath(
  new URL("../../../Mocks/forms/pesquisa-tecnologia.mock.csv", import.meta.url),
);

function validarOpcoes({ format, scope, questionId }: OpcoesExportacao) {
  if (format !== "xlsx" && format !== "csv") {
    throw new ErroExportacao(
      "Escolha um formato de exportação válido.",
      "EXPORT_FORMAT_INVALID",
    );
  }

  if (scope !== "all" && scope !== "question") {
    throw new ErroExportacao(
      "Escolha um conteúdo válido para a exportação.",
      "EXPORT_SCOPE_INVALID",
    );
  }

  if (format === "csv" && scope !== "question") {
    throw new ErroExportacao(
      "A exportação CSV está disponível apenas para uma pergunta específica.",
      "EXPORT_SCOPE_UNAVAILABLE",
    );
  }

  let indicePergunta: number | undefined;
  if (scope === "question") {
    const match = /^q(\d{2})$/i.exec(questionId ?? "");
    const numeroPergunta = match ? Number(match[1]) : Number.NaN;
    if (!Number.isInteger(numeroPergunta) || numeroPergunta < 1 || numeroPergunta > 25) {
      throw new ErroExportacao(
        "Selecione uma pergunta válida para exportar.",
        "EXPORT_QUESTION_INVALID",
      );
    }
    indicePergunta = numeroPergunta + 2;
  }

  return { format, scope, questionId, indicePergunta };
}

function projetarPergunta(
  linhas: unknown[][],
  indicePergunta: number,
) {
  return linhas.map((linha) => [linha[1] ?? null, linha[indicePergunta] ?? null]);
}

function serializarCsv(linhas: unknown[][]) {
  const conteudo = linhas
    .map((linha) =>
      linha
        .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
        .join(";"),
    )
    .join("\r\n");

  return Buffer.from(`\uFEFF${conteudo}`, "utf8");
}

async function exportarPerguntaXlsx(
  questionId: string,
  indicePergunta: number,
): Promise<ResultadoExportacao> {
  const fonte = await readFile(arquivoXlsx);
  const workbook = XLSX.read(fonte, { type: "buffer", cellDates: true });
  const nomePlanilha = workbook.SheetNames[0];
  const planilha = nomePlanilha ? workbook.Sheets[nomePlanilha] : undefined;

  if (!planilha) {
    throw new ErroExportacao(
      "A planilha da pesquisa não possui dados para exportar.",
      "EXPORT_SOURCE_EMPTY",
      422,
    );
  }

  const linhas = XLSX.utils.sheet_to_json<unknown[]>(planilha, {
    header: 1,
    raw: true,
    defval: null,
  });
  const workbookExportacao = XLSX.utils.book_new();
  const planilhaExportacao = XLSX.utils.aoa_to_sheet(
    projetarPergunta(linhas, indicePergunta),
  );
  XLSX.utils.book_append_sheet(workbookExportacao, planilhaExportacao, "Respostas");

  return {
    conteudo: Buffer.from(
      XLSX.write(workbookExportacao, { type: "buffer", bookType: "xlsx" }),
    ),
    nomeArquivo: `unifan-${questionId}.xlsx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

async function exportarPerguntaCsv(
  questionId: string,
  indicePergunta: number,
): Promise<ResultadoExportacao> {
  const fonte = await readFile(arquivoCsv, "utf8");
  const linhas = parse(fonte, {
    bom: true,
    delimiter: ";",
    relax_column_count: false,
    skip_empty_lines: true,
  }) as unknown[][];

  return {
    conteudo: serializarCsv(projetarPergunta(linhas, indicePergunta)),
    nomeArquivo: `unifan-${questionId}.csv`,
    mimeType: "text/csv; charset=utf-8",
  };
}

export async function gerarExportacaoDados(
  opcoes: OpcoesExportacao,
): Promise<ResultadoExportacao> {
  const { format, scope, questionId, indicePergunta } = validarOpcoes(opcoes);

  if (format === "xlsx" && scope === "all") {
    return {
      conteudo: await readFile(arquivoXlsx),
      nomeArquivo: "unifan-pesquisa-completa.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  if (!questionId || indicePergunta === undefined) {
    throw new ErroExportacao(
      "Selecione uma pergunta válida para exportar.",
      "EXPORT_QUESTION_INVALID",
    );
  }

  return format === "xlsx"
    ? exportarPerguntaXlsx(questionId, indicePergunta)
    : exportarPerguntaCsv(questionId, indicePergunta);
}
