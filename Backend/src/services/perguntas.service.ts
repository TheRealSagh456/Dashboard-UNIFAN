import { obterBanco } from "../database/conexao.ts";
import { buscarImportacao } from "./importacao.service.ts";
import type { ColunaBanco } from "../types/importacao.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";

export async function listarPerguntas(pesquisaId: string) {
  const pesquisa = await buscarImportacao(pesquisaId);
  if (pesquisa.status !== "confirmada") throw new ErroAplicacao("Confirme a importação primeiro.", "IMPORT_NOT_CONFIRMED", 409);
  const colunas = await obterBanco()<ColunaBanco>("coluna")
    .where({ importacao_id: pesquisaId, papel: "pergunta" }).orderBy("posicao_original");
  return colunas.map((coluna) => ({
    id: coluna.id, codigo: coluna.codigo_referencia, enunciado: coluna.cabecalho_original.trim(),
    tipoVariavel: coluna.tipo_variavel, categorias: JSON.parse(coluna.categorias_confirmadas ?? "[]") as string[],
  }));
}

export async function obterPergunta(pesquisaId: string, perguntaId: string, pagina = 1) {
  const perguntas = await listarPerguntas(pesquisaId);
  const pergunta = perguntas.find((item) => item.id === perguntaId);
  if (!pergunta) throw new ErroAplicacao("Pergunta não encontrada nesta pesquisa.", "QUESTION_NOT_FOUND", 404);
  const banco = obterBanco();
  const contagem = await banco("resposta").where({ coluna_id: perguntaId })
    .select(banco.raw("count(*) as total, count(coalesce(valor_numerico, valor_categoria)) as validas")).first();
  const respostas = await banco("resposta as r").join("participante as p", "p.id", "r.participante_id")
    .where("r.coluna_id", perguntaId).orderBy("p.indice_linha").limit(100).offset((pagina - 1) * 100)
    .select("p.id as participanteId", "p.indice_linha as linha", "r.valor_bruto as valorBruto", "r.valor_numerico as valorNumerico", "r.valor_categoria as valorCategoria");
  const total = Number(contagem?.total ?? 0);
  const validas = Number(contagem?.validas ?? 0);
  return { ...pergunta, totalRespostas: total, respostasValidas: validas, respostasAusentes: total - validas, pagina, tamanhoPagina: 100, respostas };
}
