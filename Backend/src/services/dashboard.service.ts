import { obterBanco } from "../database/conexao.ts";
import { analisarRespostasMultiplas, analisarValores } from "../estatistica/calculos.ts";
import { sugerirRespostasMultiplas } from "../importacao/respostas-multiplas.ts";
import { buscarImportacao } from "./importacao.service.ts";
import { buscarPesquisaAtual } from "./pesquisas.service.ts";
import type { ColunaBanco, TipoVariavel } from "../types/importacao.ts";
import type { AnalisePergunta, CategoriaPergunta, ValorEstatistico } from "../types/dashboard.ts";
import { ErroAplicacao } from "../utils/erro-aplicacao.ts";

export async function obterDashboard(pesquisaId: string) {
  const banco = obterBanco();
  const atual = pesquisaId === "atual" ? await buscarPesquisaAtual(banco) : null;
  if (pesquisaId === "atual" && !atual) throw new ErroAplicacao("Nenhuma pesquisa importada foi encontrada.", "PESQUISA_NOT_FOUND", 404);
  const pesquisa = await buscarImportacao(atual?.id ?? pesquisaId, banco);
  if (pesquisa.status !== "confirmada") throw new ErroAplicacao("Confirme a importação primeiro.", "IMPORT_NOT_CONFIRMED", 409);
  const colunas = await banco<ColunaBanco>("coluna").where({ importacao_id: pesquisa.id, papel: "pergunta" }).orderBy("posicao_original");
  const participantes = await banco("participante").where({ importacao_id: pesquisa.id }).count({ total: "id" }).first();
  const respostas = await banco("resposta as r")
    .join("coluna as c", "c.id", "r.coluna_id")
    .join("participante as p", "p.id", "r.participante_id")
    .where({ "c.importacao_id": pesquisa.id, "c.papel": "pergunta" })
    .orderBy("p.indice_linha")
    .select("r.coluna_id", "r.valor_numerico", "r.valor_categoria");
  const porColuna = new Map<string, Array<ValorEstatistico | null>>();
  for (const resposta of respostas) {
    const valores = porColuna.get(resposta.coluna_id) ?? [];
    valores.push(resposta.valor_numerico ?? resposta.valor_categoria ?? null);
    porColuna.set(resposta.coluna_id, valores);
  }
  const perguntas: AnalisePergunta[] = colunas.map((coluna, i) => {
    const valores = porColuna.get(coluna.id) ?? [];
    const multiplas = coluna.tipo_variavel === "qualitativa_nominal" && (
      coluna.respostas_multiplas === null
        ? sugerirRespostasMultiplas(coluna.cabecalho_original, valores as Array<string | null>)
        : coluna.respostas_multiplas === 1
    );
    return {
      id: coluna.id, codigo: coluna.codigo_referencia ?? `Q${String(i + 1).padStart(2, "0")}`,
      enunciado: coluna.cabecalho_original.trim() || `Coluna ${coluna.posicao_original + 1}`,
      tipoVariavel: coluna.tipo_variavel as TipoVariavel,
      ...(multiplas ? analisarRespostasMultiplas(valores as Array<string | null>)
        : analisarValores(coluna.tipo_variavel!, valores, JSON.parse(coluna.categorias_confirmadas ?? "[]"))),
    };
  });
  const totalRespostas = Number(participantes?.total ?? 0);
  const totalAusencias = perguntas.reduce((total, pergunta) => total + pergunta.respostasAusentes, 0);
  const categorias: CategoriaPergunta[] = ["Discreta", "Contínua", "Nominal", "Ordinal"];
  return {
    pesquisa: {
      id: pesquisa.id,
      nome: pesquisa.nome_arquivo.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
      nomeArquivoOriginal: pesquisa.nome_arquivo,
      importadoEm: pesquisa.atualizado_em,
      totalRespostas, totalPerguntas: perguntas.length, totalAusencias,
      percentualAusencias: totalRespostas && perguntas.length ? (totalAusencias / (totalRespostas * perguntas.length)) * 100 : 0,
      distribuicaoTipos: categorias.map((label) => {
        const value = perguntas.filter((pergunta) => pergunta.categoria === label).length;
        return { label, value, percentual: perguntas.length ? (value / perguntas.length) * 100 : 0 };
      }),
    },
    perguntas,
  };
}
