import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { obterBanco } from "../database/conexao.ts";
import { lerCsv } from "../importacao/leitores/csv.ts";
import { lerExcel } from "../importacao/leitores/excel.ts";
import { sugerirClassificacao } from "../importacao/classificacao.ts";
import { sugerirRespostasMultiplas } from "../importacao/respostas-multiplas.ts";
import { normalizarResposta, serializarBruto } from "../importacao/normalizacao.ts";
import { LIMITE_ARQUIVO, validarConfiguracao, validarMatriz } from "../importacao/validacao.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";
import type { ColunaBanco, ConfiguracaoColuna, FormatoImportacao, ImportacaoBanco, MatrizBruta, RevisaoImportacao } from "../types/importacao.ts";

export async function buscarImportacao(id: string, banco = obterBanco()): Promise<ImportacaoBanco> {
  const importacao = await banco<ImportacaoBanco>("importacao").where({ id }).first();
  if (!importacao) throw new ErroAplicacao("Importação não encontrada.", "IMPORT_NOT_FOUND", 404);
  return importacao;
}

export async function obterRevisao(id: string): Promise<RevisaoImportacao> {
  const banco = obterBanco();
  const importacao = await buscarImportacao(id, banco);
  const colunas = await banco<ColunaBanco>("coluna").where({ importacao_id: id }).orderBy("posicao_original");
  const contagem = await banco("participante").where({ importacao_id: id }).count({ total: "id" }).first();
  const exemplos = await banco("resposta as r").join("participante as p", "p.id", "r.participante_id")
    .where("p.importacao_id", id).where("p.indice_linha", "<=", 6)
    .orderBy("p.indice_linha").select("r.coluna_id", "r.valor_bruto");
  const problemas = await banco("problema_importacao").where({ importacao_id: id })
    .select("participante_indice_linha as linha", "coluna_id as colunaId", "valor_bruto as valorBruto", "mensagem");
  return {
    id, nomeArquivoOriginal: importacao.nome_arquivo, formato: importacao.formato,
    status: importacao.status, delimitador: importacao.delimitador,
    separadorDecimal: importacao.separador_decimal, totalRespostas: Number(contagem?.total ?? 0),
    colunas: colunas.map((coluna) => ({
      id: coluna.id, posicao: coluna.posicao_original,
      cabecalhoOriginal: coluna.cabecalho_original,
      enunciado: coluna.cabecalho_original.trim() || `Coluna ${coluna.posicao_original + 1}`,
      codigo: coluna.codigo_referencia ?? `C${coluna.posicao_original + 1}`,
      papel: coluna.papel, tipoVariavel: coluna.tipo_variavel,
      categorias: JSON.parse(coluna.categorias_confirmadas ?? "[]") as string[],
      respostasMultiplas: coluna.papel === "pergunta" && coluna.tipo_variavel === "qualitativa_nominal" && (
        coluna.respostas_multiplas === null
          ? sugerirRespostasMultiplas(coluna.cabecalho_original, exemplos.filter((r) => r.coluna_id === coluna.id).map((r) => r.valor_bruto))
          : coluna.respostas_multiplas === 1
      ),
      exemplos: exemplos.filter((r) => r.coluna_id === coluna.id).map((r) => r.valor_bruto as string | null),
    })), problemas,
  };
}

export async function importarArquivo(buffer: Buffer, nomeArquivo: string, delimitador?: string) {
  const formato = extname(nomeArquivo).slice(1).toLowerCase() as FormatoImportacao;
  if (!["csv", "xlsx", "xls"].includes(formato)) {
    throw new ErroAplicacao("Selecione um arquivo CSV, XLSX ou XLS.", "IMPORT_FORMAT_INVALID");
  }
  if (buffer.length > LIMITE_ARQUIVO) throw new ErroAplicacao("O arquivo deve ter até 10 MB.", "IMPORT_FILE_LIMIT", 413);
  let matriz: MatrizBruta;
  let separador: string | null = null;
  try {
    if (formato === "csv") {
      const leitura = lerCsv(buffer, delimitador);
      matriz = leitura.matriz;
      separador = leitura.delimitador;
    } else {
      matriz = lerExcel(buffer);
    }
  } catch (erro) {
    if (erro instanceof ErroAplicacao) throw erro;
    throw new ErroAplicacao("Não foi possível ler a planilha.", "IMPORT_FILE_INVALID");
  }
  const { cabecalhos, registros } = validarMatriz(matriz);
  const id = randomUUID();
  const decimal = formato === "csv" && registros.some(({ valores }) => valores.some((v) => typeof v === "string" && /^[+-]?\d+,\d+$/.test(v.trim()))) ? "," : ".";
  let numeroPergunta = 0;
  const colunas = cabecalhos.map((cabecalho, posicao) => {
    const original = serializarBruto(cabecalho) ?? "";
    const sugestao = sugerirClassificacao(original, registros.map(({ valores }) => serializarBruto(valores[posicao])), decimal);
    const multiplas = sugestao.papel === "pergunta" && sugestao.tipoVariavel === "qualitativa_nominal"
      && sugerirRespostasMultiplas(original, registros.map(({ valores }) => serializarBruto(valores[posicao])));
    const codigo = sugestao.papel === "pergunta" ? `Q${String(++numeroPergunta).padStart(2, "0")}` : null;
    return {
      id: randomUUID(), importacao_id: id, posicao_original: posicao,
      cabecalho_original: original, papel: sugestao.papel, tipo_variavel: sugestao.tipoVariavel,
      codigo_referencia: codigo, categorias_confirmadas: JSON.stringify(sugestao.categorias),
      respostas_multiplas: Number(multiplas),
    };
  });
  const banco = obterBanco();
  await banco.transaction(async (trx) => {
    await trx("importacao").insert({ id, nome_arquivo: nomeArquivo, formato, status: "revisao", delimitador: separador, separador_decimal: formato === "csv" ? decimal : null });
    await trx.batchInsert("coluna", colunas, 50);
    const participantes = registros.map((registro) => ({ id: randomUUID(), registro }));
    await trx.batchInsert("participante", participantes.map((participante) => ({
      id: participante.id, importacao_id: id, indice_linha: participante.registro.indiceLinha,
    })), 100);
    for (const coluna of colunas) {
      await trx.batchInsert("resposta", participantes.map((participante) => ({
        id: randomUUID(), participante_id: participante.id, coluna_id: coluna.id,
        valor_bruto: serializarBruto(participante.registro.valores[coluna.posicao_original]),
      })), 100);
    }
  });
  return obterRevisao(id);
}

export async function salvarRevisao(id: string, configuracao: { colunas: ConfiguracaoColuna[]; separadorDecimal?: "," | "." }) {
  validarConfiguracao(configuracao.colunas);
  const banco = obterBanco();
  await banco.transaction(async (trx) => {
    const importacao = await buscarImportacao(id, trx);
    if (importacao.status === "confirmada") throw new ErroAplicacao("Esta importação já foi confirmada.", "IMPORT_ALREADY_CONFIRMED", 409);
    const existentes = await trx<ColunaBanco>("coluna").where({ importacao_id: id });
    const ids = new Set(configuracao.colunas.map((coluna) => coluna.id));
    if (ids.size !== existentes.length || configuracao.colunas.length !== existentes.length || existentes.some((coluna) => !ids.has(coluna.id))) {
      throw new ErroAplicacao("Envie a configuração de todas as colunas desta importação.", "IMPORT_COLUMNS_INVALID");
    }
    await trx("resposta").whereIn("coluna_id", existentes.map((coluna) => coluna.id)).update({ valor_numerico: null, valor_categoria: null });
    for (const coluna of configuracao.colunas) {
      await trx("coluna").where({ id: coluna.id, importacao_id: id }).update({
        papel: coluna.papel, tipo_variavel: coluna.papel === "pergunta" ? coluna.tipoVariavel : null,
        categorias_confirmadas: JSON.stringify(coluna.categorias),
        respostas_multiplas: coluna.papel !== "pergunta" || coluna.tipoVariavel !== "qualitativa_nominal" ? 0
          : coluna.respostasMultiplas === undefined ? existentes.find((item) => item.id === coluna.id)!.respostas_multiplas
          : Number(coluna.respostasMultiplas),
      });
    }
    if (importacao.formato === "csv" && configuracao.separadorDecimal) {
      await trx("importacao").where({ id }).update({ separador_decimal: configuracao.separadorDecimal });
    }
    await trx("problema_importacao").where({ importacao_id: id }).delete();
  });
  return obterRevisao(id);
}

export async function confirmarImportacao(id: string) {
  const banco = obterBanco();
  const totalProblemas = await banco.transaction(async (trx) => {
    const importacao = await buscarImportacao(id, trx);
    if (importacao.status === "confirmada") return 0;
    const colunas = await trx<ColunaBanco>("coluna").where({ importacao_id: id });
    validarConfiguracao(colunas.map((coluna) => ({
      id: coluna.id, papel: coluna.papel, tipoVariavel: coluna.tipo_variavel,
      categorias: JSON.parse(coluna.categorias_confirmadas ?? "[]") as string[],
      respostasMultiplas: coluna.respostas_multiplas === 1,
    })));
    await trx("problema_importacao").where({ importacao_id: id }).delete();
    let problemas = 0;
    for (const coluna of colunas.filter((c) => c.papel === "pergunta")) {
      const categorias = JSON.parse(coluna.categorias_confirmadas ?? "[]") as string[];
      const respostas = await trx("resposta as r").join("participante as p", "p.id", "r.participante_id")
        .where("r.coluna_id", coluna.id).select("r.id", "r.participante_id", "r.coluna_id", "r.valor_bruto", "p.indice_linha");
      const convertidas = [];
      for (const resposta of respostas) {
        const { problema, ...valores } = normalizarResposta(resposta.valor_bruto, coluna.tipo_variavel!, importacao.separador_decimal ?? ".", categorias, coluna.respostas_multiplas === 1);
        convertidas.push({
          id: resposta.id, participante_id: resposta.participante_id,
          coluna_id: coluna.id, valor_bruto: resposta.valor_bruto, ...valores,
        });
        if (problema) {
          problemas++;
          await trx("problema_importacao").insert({
            id: randomUUID(), importacao_id: id, participante_indice_linha: resposta.indice_linha,
            coluna_id: coluna.id, valor_bruto: resposta.valor_bruto, codigo: "IMPORT_VALUE_INVALID", mensagem: problema,
          });
        }
      }
      // Atualizar em lotes evita uma consulta por célula em arquivos maiores.
      for (let inicio = 0; inicio < convertidas.length; inicio += 100) {
        await trx("resposta").insert(convertidas.slice(inicio, inicio + 100))
          .onConflict("id").merge(["valor_numerico", "valor_categoria"]);
      }
    }
    if (!problemas) await trx("importacao").where({ id }).update({ status: "confirmada", atualizado_em: new Date().toISOString() });
    return problemas;
  });
  // Gravar os problemas antes de responder permite consultá-los na revisão.
  if (totalProblemas) throw new ErroAplicacao("Confira as respostas incompatíveis na revisão da importação.", "IMPORT_VALUES_INVALID", 422);
  return obterRevisao(id);
}
