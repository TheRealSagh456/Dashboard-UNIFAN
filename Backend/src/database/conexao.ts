import type Database from "better-sqlite3";
import knex, { type Knex } from "knex";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Padrão relativo a este arquivo, não ao diretório de execução.
const CAMINHO_PADRAO = fileURLToPath(
  new URL("./data/dashboard.db", import.meta.url),
);
const RAIZ_BACKEND = fileURLToPath(new URL("../../", import.meta.url));

export type Banco = Knex;

let bancoCompartilhado: Banco | undefined;

/**
 * Abre (ou cria) o banco em WAL com integridade de chaves estrangeiras ativa.
 * O caminho vem de DATABASE_PATH; valores relativos resolvem a partir da
 * raiz do Backend.
 */
export function criarBanco(caminhoRecebido?: string): Banco {
  const caminho = caminhoRecebido ?? process.env.DATABASE_PATH ?? CAMINHO_PADRAO;
  const caminhoAbsoluto = resolve(RAIZ_BACKEND, caminho);

  mkdirSync(dirname(caminhoAbsoluto), { recursive: true });

  return knex({
    client: "better-sqlite3",
    connection: { filename: caminhoAbsoluto },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      afterCreate(
        conexao: Database.Database,
        concluir: (erro: Error | null, conexao: Database.Database) => void,
      ) {
        conexao.pragma("journal_mode = WAL");
        conexao.pragma("synchronous = NORMAL");
        conexao.pragma("foreign_keys = ON");
        conexao.pragma("busy_timeout = 5000");
        concluir(null, conexao);
      },
    },
  });
}

/** Retorna a instância única compartilhada pela aplicação e pelos services. */
export function obterBanco(): Banco {
  bancoCompartilhado ??= criarBanco();
  return bancoCompartilhado;
}

/** Encerra o pool compartilhado durante o desligamento do servidor. */
export async function fecharBanco(): Promise<void> {
  if (!bancoCompartilhado) return;

  await bancoCompartilhado.destroy();
  bancoCompartilhado = undefined;
}
