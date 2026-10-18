import type { PapelColuna, TipoVariavel } from "../types/importacao.ts";
import { converterNumero } from "./normalizacao.ts";

const ordens = [
  ["Ensino Fundamental", "Ensino Médio", "Superior incompleto", "Superior completo", "Pós-graduação"],
  ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"],
  ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
];

export function sugerirClassificacao(cabecalho: string, valores: Array<string | null>, decimal: "," | ".") {
  const nome = cabecalho.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  const metadado = /^(carimbo de data\/hora|data e hora( de envio)?|timestamp|id( da resposta| externo)?|identificador externo|e-?mail|endereco de e-?mail)$/.test(nome);
  const papel: PapelColuna = !nome ? "nao_selecionada" : metadado ? "metadado" : "pergunta";
  const categorias = [...new Set(valores.filter((v) => v?.trim()).map((v) => v!.trim()))];
  let tipoVariavel: TipoVariavel | null = null;
  let ordem: string[] = [];
  if (papel === "pergunta") {
    const numeros = categorias.map((valor) => converterNumero(valor, decimal));
    const ordinal = ordens.find((lista) => categorias.length > 0 && categorias.every((valor) => lista.includes(valor)));
    if (ordinal) {
      tipoVariavel = "qualitativa_ordinal";
      ordem = ordinal;
    } else if (numeros.length && numeros.every((numero) => numero !== null)) {
      tipoVariavel = numeros.every((numero) => Number.isSafeInteger(numero)) ? "quantitativa_discreta" : "quantitativa_continua";
    } else {
      tipoVariavel = "qualitativa_nominal";
    }
  }
  return { papel, tipoVariavel, categorias: ordem.length ? ordem : tipoVariavel === "qualitativa_nominal" ? categorias : [] };
}
