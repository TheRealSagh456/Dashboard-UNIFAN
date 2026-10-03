import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Banco } from "./conexao.ts";

const DIRETORIO_SQL = fileURLToPath(new URL("./sql/", import.meta.url));

// Nome esperado: número de ordem + descrição, como 001_initial.sql.
const PADRAO_NOME = /^\d{3}_[a-z0-9-]+\.sql$/;

type MigracaoAplicada = {
  id: string;
  checksum: string | null;
};

function calcularChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/**
 * Aplica as migrations pendentes de src/database/sql em ordem numérica.
 * Cada arquivo roda em uma transação e é registrado em schema_migrations;
 * arquivos já aplicados são pulados. Retorna os nomes aplicados nesta
 * execução, para log de inicialização.
 */
export async function executarMigracoes(banco: Banco): Promise<string[]> {
  const conexao = (await banco.client.acquireConnection()) as Database.Database;

  try {
    conexao.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT,
      aplicada_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

    const colunasControle = conexao
      .prepare("PRAGMA table_info(schema_migrations)")
      .all() as Array<{ name: string }>;
    if (!colunasControle.some((coluna) => coluna.name === "checksum")) {
      conexao.exec("ALTER TABLE schema_migrations ADD COLUMN checksum TEXT");
    }

    const aplicadas = new Map(
      (
        conexao
          .prepare("SELECT id, checksum FROM schema_migrations")
          .all() as MigracaoAplicada[]
      ).map((migracao) => [migracao.id, migracao.checksum]),
    );

    const arquivos = readdirSync(DIRETORIO_SQL)
      .filter((nome) => PADRAO_NOME.test(nome))
      .sort();

    const recemAplicadas: string[] = [];

    for (const nome of arquivos) {
      const sql = readFileSync(DIRETORIO_SQL + nome, "utf8");
      const checksum = calcularChecksum(sql);

      if (aplicadas.has(nome)) {
        const checksumAplicado = aplicadas.get(nome);
        if (checksumAplicado && checksumAplicado !== checksum) {
          throw new Error(`A migration ${nome} foi alterada depois de aplicada.`);
        }

        if (!checksumAplicado) {
          conexao
            .prepare("UPDATE schema_migrations SET checksum = ? WHERE id = ?")
            .run(checksum, nome);
        }
        continue;
      }

      conexao.pragma("foreign_keys = OFF");
      try {
        conexao.transaction(() => {
          conexao.exec(sql);

          const problemas = conexao.pragma("foreign_key_check") as unknown[];
          if (problemas.length > 0) {
            throw new Error(
              `A migration ${nome} deixou referências inválidas no banco.`,
            );
          }

          conexao
            .prepare(
              "INSERT INTO schema_migrations (id, checksum) VALUES (?, ?)",
            )
            .run(nome, checksum);
        })();
      } finally {
        conexao.pragma("foreign_keys = ON");
      }

      aplicadas.set(nome, checksum);
      recemAplicadas.push(nome);
    }

    return recemAplicadas;
  } finally {
    await banco.client.releaseConnection(conexao);
  }
}
