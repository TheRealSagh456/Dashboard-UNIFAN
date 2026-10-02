-- Schema inicial do Dashboard UNIFAN.
-- A tabela schema_migrations é criada pelo runner (migracoes.ts) e não aqui.

CREATE TABLE importacao (
  id TEXT PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('xlsx', 'xls', 'csv')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (
    status IN ('rascunho', 'revisao', 'confirmada', 'erro')
  ),
  -- Dialeta confirmada na revisão; só se aplica ao CSV.
  delimitador TEXT CHECK (
    delimitador IS NULL OR delimitador IN (';', ',', '\t')
  ),
  separador_decimal TEXT CHECK (
    separador_decimal IS NULL OR separador_decimal IN (',', '.')
  ),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE coluna (
  id TEXT PRIMARY KEY,
  importacao_id TEXT NOT NULL,
  posicao_original INTEGER NOT NULL,
  cabecalho_original TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'nao_selecionada' CHECK (
    papel IN ('pergunta', 'metadado', 'nao_selecionada')
  ),
  tipo_variavel TEXT CHECK (
    tipo_variavel IS NULL
    OR tipo_variavel IN (
      'quantitativa_discreta',
      'quantitativa_continua',
      'qualitativa_nominal',
      'qualitativa_ordinal'
    )
  ),
  codigo_referencia TEXT,
  -- Categorias confirmadas na revisão, como array JSON de rótulos na ordem
  -- exata. Obrigatória em qualitativa_ordinal; opcional nas demais.
  categorias_confirmadas TEXT,
  -- Somente perguntas recebem tipo de variável.
  CHECK (papel = 'pergunta' OR tipo_variavel IS NULL),
  FOREIGN KEY (importacao_id) REFERENCES importacao (id) ON DELETE CASCADE,
  UNIQUE (importacao_id, posicao_original)
);

CREATE INDEX idx_coluna_importacao ON coluna (importacao_id);

CREATE TABLE participante (
  id TEXT PRIMARY KEY,
  importacao_id TEXT NOT NULL,
  indice_linha INTEGER NOT NULL,
  FOREIGN KEY (importacao_id) REFERENCES importacao (id) ON DELETE CASCADE,
  UNIQUE (importacao_id, indice_linha)
);

CREATE INDEX idx_participante_importacao ON participante (importacao_id);

CREATE TABLE resposta (
  id TEXT PRIMARY KEY,
  participante_id TEXT NOT NULL,
  coluna_id TEXT NOT NULL,
  -- Valor recebido no arquivo, preservado sem transformação.
  valor_bruto TEXT,
  -- Valor convertido conforme o tipo confirmado da coluna.
  valor_numerico REAL,
  valor_categoria TEXT,
  FOREIGN KEY (participante_id) REFERENCES participante (id) ON DELETE CASCADE,
  FOREIGN KEY (coluna_id) REFERENCES coluna (id) ON DELETE CASCADE,
  -- DEC-003: um único valor por participante e por pergunta.
  UNIQUE (participante_id, coluna_id)
);

CREATE INDEX idx_resposta_coluna ON resposta (coluna_id);

CREATE TABLE problema_importacao (
  id TEXT PRIMARY KEY,
  importacao_id TEXT NOT NULL,
  -- Índice da linha no arquivo de origem; problemas estruturais podem não
  -- ter participante persistido.
  participante_indice_linha INTEGER,
  coluna_id TEXT,
  valor_bruto TEXT,
  codigo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (importacao_id) REFERENCES importacao (id) ON DELETE CASCADE,
  FOREIGN KEY (coluna_id) REFERENCES coluna (id) ON DELETE SET NULL
);

CREATE INDEX idx_problema_importacao ON problema_importacao (importacao_id);
