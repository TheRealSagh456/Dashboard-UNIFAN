import { obterBanco } from "../database/conexao.ts";
import { XLSX } from "../importacao/leitores/excel.ts";
import { buscarImportacao } from "./importacao.service.ts";
import { buscarPesquisaAtual } from "./pesquisas.service.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";
import type { ColunaBanco } from "../types/importacao.ts";

export type FormatoExportacao = "xlsx" | "csv";
export type EscopoExportacao = "all" | "question";
export class ErroExportacao extends ErroAplicacao {}

type OpcoesExportacao = { format?: string; scope?: string; questionId?: string; pesquisaId?: string };

export async function gerarExportacaoDados({ format, scope, questionId, pesquisaId }: OpcoesExportacao) {
  if (format !== "xlsx" && format !== "csv") {
    throw new ErroExportacao("Escolha XLSX ou CSV.", "EXPORT_FORMAT_INVALID");
  }
  if (scope !== "all" && scope !== "question") {
    throw new ErroExportacao("Escolha um conteúdo válido.", "EXPORT_SCOPE_INVALID");
  }
  if (format === "csv" && scope !== "question") {
    throw new ErroExportacao("CSV está disponível apenas para uma pergunta.", "EXPORT_SCOPE_UNAVAILABLE");
  }
  const banco = obterBanco();
  const pesquisa = pesquisaId ? await buscarImportacao(pesquisaId, banco) : await buscarPesquisaAtual(banco);
  if (!pesquisa) throw new ErroExportacao("Nenhuma pesquisa confirmada.", "PESQUISA_NOT_FOUND", 404);
  if (pesquisa.status !== "confirmada") throw new ErroExportacao("Confirme a importação primeiro.", "IMPORT_NOT_CONFIRMED", 409);
  const colunas = await banco<ColunaBanco>("coluna").where({ importacao_id: pesquisa.id }).orderBy("posicao_original");
  const pergunta = scope === "question" && questionId ? colunas.find((coluna) => coluna.papel === "pergunta" &&
    (coluna.id === questionId || coluna.codigo_referencia?.toLowerCase() === questionId.toLowerCase())) : undefined;
  if (scope === "question" && !pergunta) {
    throw new ErroExportacao("Selecione uma pergunta desta pesquisa.", "EXPORT_QUESTION_INVALID");
  }
  const participantes = await banco("participante").where({ importacao_id: pesquisa.id }).orderBy("indice_linha").select("id");
  const respostas = await banco("resposta as r").join("participante as p", "p.id", "r.participante_id")
    .where("p.importacao_id", pesquisa.id).select("r.participante_id", "r.coluna_id", "r.valor_bruto");
  const valores = new Map(respostas.map((r) => [r.participante_id + ":" + r.coluna_id, r.valor_bruto as string | null]));
  const selecionadas = pergunta ? [pergunta] : colunas;
  const cabecalhos = selecionadas.map((coluna) => coluna.cabecalho_original);
  const linhas: Array<Array<string | null>> = [
    pergunta ? ["ID da resposta", ...cabecalhos] : cabecalhos,
    ...participantes.map((participante) => {
      const linha = selecionadas.map((coluna) => valores.get(participante.id + ":" + coluna.id) ?? null);
      return pergunta ? [participante.id as string, ...linha] : linha;
    }),
  ];
  const nome = pergunta ? "unifan-" + (pergunta.codigo_referencia ?? "pergunta") : "unifan-pesquisa-completa";
  if (format === "csv") {
    const texto = linhas.map((linha) => linha.map((valor) =>
      '"' + String(valor ?? "").replaceAll('"', '""') + '"').join(";")).join("\r\n");
    return { conteudo: Buffer.from("\uFEFF" + texto, "utf8"), nomeArquivo: nome + ".csv", mimeType: "text/csv; charset=utf-8" };
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(linhas), "Respostas");
  return {
    conteudo: Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })),
    nomeArquivo: nome + ".xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
