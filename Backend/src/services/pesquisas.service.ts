import { obterBanco } from "../database/conexao.ts";
import type { ImportacaoBanco } from "../types/importacao.ts";

export async function buscarPesquisaAtual(banco = obterBanco()) {
  return banco<ImportacaoBanco>("importacao").where({ status: "confirmada" })
    .orderBy("atualizado_em", "desc").orderBy("id", "desc").first();
}

export async function obterPesquisaAtual() {
  const banco = obterBanco();
  const pesquisa = await buscarPesquisaAtual(banco);
  if (!pesquisa) return null;
  const respostas = await banco("participante").where({ importacao_id: pesquisa.id }).count({ total: "id" }).first();
  const perguntas = await banco("coluna").where({ importacao_id: pesquisa.id, papel: "pergunta" }).count({ total: "id" }).first();
  return {
    id: pesquisa.id,
    nome: pesquisa.nome_arquivo.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
    nomeArquivoOriginal: pesquisa.nome_arquivo,
    totalRespostas: Number(respostas?.total ?? 0), totalPerguntas: Number(perguntas?.total ?? 0),
  };
}

export async function limparDadosDaPesquisaAtual() {
  await obterBanco().transaction(async (trx) => {
    const pesquisa = await buscarPesquisaAtual(trx);
    if (pesquisa) await trx("importacao").where({ id: pesquisa.id }).delete();
  });
  return { cleared: true };
}
