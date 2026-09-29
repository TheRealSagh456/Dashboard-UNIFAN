import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Banco } from './conexao.ts'

const DIRETORIO_SQL = fileURLToPath(new URL('./sql/', import.meta.url))

// Nome esperado: número de ordem + descrição, como 001_initial.sql.
const PADRAO_NOME = /^\d{3}_[a-z0-9-]+\.sql$/

/**
 * Aplica as migrations pendentes de src/database/sql em ordem numérica.
 * Cada arquivo roda em uma transação e é registrado em schema_migrations;
 * arquivos já aplicados são pulados. Retorna os nomes aplicados nesta
 * execução, para log de inicialização.
 */
export function executarMigracoes(banco: Banco): string[] {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      aplicada_em TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const aplicadas = new Set(
    banco
      .prepare('SELECT id FROM schema_migrations')
      .all()
      .map((linha) => (linha as { id: string }).id),
  )

  const arquivos = readdirSync(DIRETORIO_SQL)
    .filter((nome) => PADRAO_NOME.test(nome))
    .sort()

  const recemAplicadas: string[] = []

  for (const nome of arquivos) {
    if (aplicadas.has(nome)) continue

    const sql = readFileSync(DIRETORIO_SQL + nome, 'utf8')
    banco.transaction(() => {
      banco.exec(sql)
      banco
        .prepare('INSERT INTO schema_migrations (id) VALUES (?)')
        .run(nome)
    })()

    aplicadas.add(nome)
    recemAplicadas.push(nome)
  }

  return recemAplicadas
}
