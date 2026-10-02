import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Padrão relativo a este arquivo, não ao diretório de execução.
const CAMINHO_PADRAO = fileURLToPath(new URL('./data/dashboard.db', import.meta.url))
const RAIZ_BACKEND = fileURLToPath(new URL('../../', import.meta.url))

export type Banco = Database.Database

/**
 * Abre (ou cria) o banco em WAL com integridade de chaves estrangeiras ativa.
 * O caminho vem de DATABASE_PATH; valores relativos resolvem a partir da
 * raiz do Backend.
 */
export function abrirBanco(caminhoRecebido?: string): Banco {
  const caminho = caminhoRecebido ?? process.env.DATABASE_PATH ?? CAMINHO_PADRAO
  const caminhoAbsoluto = resolve(RAIZ_BACKEND, caminho)

  mkdirSync(dirname(caminhoAbsoluto), { recursive: true })

  const banco = new Database(caminhoAbsoluto)
  banco.pragma('journal_mode = WAL')
  banco.pragma('synchronous = NORMAL')
  banco.pragma('foreign_keys = ON')
  banco.pragma('busy_timeout = 5000')

  return banco
}
