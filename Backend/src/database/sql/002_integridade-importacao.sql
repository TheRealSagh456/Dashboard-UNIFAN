-- Corrige o delimitador TAB e reforça invariantes entre os dados importados.

CREATE TABLE importacao_nova (
  id TEXT PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('xlsx', 'xls', 'csv')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (
    status IN ('rascunho', 'revisao', 'confirmada', 'erro')
  ),
  delimitador TEXT CHECK (
    delimitador IS NULL
    OR delimitador IN (';', ',')
    OR delimitador = char(9)
  ),
  separador_decimal TEXT CHECK (
    separador_decimal IS NULL OR separador_decimal IN (',', '.')
  ),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO importacao_nova (
  id,
  nome_arquivo,
  formato,
  status,
  delimitador,
  separador_decimal,
  criado_em,
  atualizado_em
)
SELECT
  id,
  nome_arquivo,
  formato,
  status,
  CASE delimitador WHEN '\t' THEN char(9) ELSE delimitador END,
  separador_decimal,
  criado_em,
  atualizado_em
FROM importacao;

DROP TABLE importacao;
ALTER TABLE importacao_nova RENAME TO importacao;

CREATE TRIGGER resposta_mesma_importacao_insert
BEFORE INSERT ON resposta
BEGIN
  SELECT RAISE(ABORT, 'Participante e coluna devem pertencer à mesma importação.')
  WHERE
    (SELECT importacao_id FROM participante WHERE id = NEW.participante_id)
    IS NOT
    (SELECT importacao_id FROM coluna WHERE id = NEW.coluna_id);
END;

CREATE TRIGGER resposta_mesma_importacao_update
BEFORE UPDATE OF participante_id, coluna_id ON resposta
BEGIN
  SELECT RAISE(ABORT, 'Participante e coluna devem pertencer à mesma importação.')
  WHERE
    (SELECT importacao_id FROM participante WHERE id = NEW.participante_id)
    IS NOT
    (SELECT importacao_id FROM coluna WHERE id = NEW.coluna_id);
END;

CREATE TRIGGER problema_mesma_importacao_insert
BEFORE INSERT ON problema_importacao
WHEN NEW.coluna_id IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Problema e coluna devem pertencer à mesma importação.')
  WHERE
    (SELECT importacao_id FROM coluna WHERE id = NEW.coluna_id)
    IS NOT NEW.importacao_id;
END;

CREATE TRIGGER problema_mesma_importacao_update
BEFORE UPDATE OF importacao_id, coluna_id ON problema_importacao
WHEN NEW.coluna_id IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Problema e coluna devem pertencer à mesma importação.')
  WHERE
    (SELECT importacao_id FROM coluna WHERE id = NEW.coluna_id)
    IS NOT NEW.importacao_id;
END;

CREATE TRIGGER resposta_valor_tipado_insert
BEFORE INSERT ON resposta
BEGIN
  SELECT RAISE(ABORT, 'Uma resposta não pode ter valor numérico e categórico simultaneamente.')
  WHERE NEW.valor_numerico IS NOT NULL AND NEW.valor_categoria IS NOT NULL;

  SELECT RAISE(ABORT, 'O valor convertido não corresponde ao tipo da coluna.')
  WHERE
    (
      (SELECT tipo_variavel FROM coluna WHERE id = NEW.coluna_id)
        IN ('quantitativa_discreta', 'quantitativa_continua')
      AND NEW.valor_categoria IS NOT NULL
    )
    OR (
      (SELECT tipo_variavel FROM coluna WHERE id = NEW.coluna_id)
        IN ('qualitativa_nominal', 'qualitativa_ordinal')
      AND NEW.valor_numerico IS NOT NULL
    );
END;

CREATE TRIGGER resposta_valor_tipado_update
BEFORE UPDATE OF coluna_id, valor_numerico, valor_categoria ON resposta
BEGIN
  SELECT RAISE(ABORT, 'Uma resposta não pode ter valor numérico e categórico simultaneamente.')
  WHERE NEW.valor_numerico IS NOT NULL AND NEW.valor_categoria IS NOT NULL;

  SELECT RAISE(ABORT, 'O valor convertido não corresponde ao tipo da coluna.')
  WHERE
    (
      (SELECT tipo_variavel FROM coluna WHERE id = NEW.coluna_id)
        IN ('quantitativa_discreta', 'quantitativa_continua')
      AND NEW.valor_categoria IS NOT NULL
    )
    OR (
      (SELECT tipo_variavel FROM coluna WHERE id = NEW.coluna_id)
        IN ('qualitativa_nominal', 'qualitativa_ordinal')
      AND NEW.valor_numerico IS NOT NULL
    );
END;

CREATE TRIGGER coluna_categorias_json_insert
BEFORE INSERT ON coluna
WHEN NEW.categorias_confirmadas IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Categorias confirmadas devem formar um array JSON válido.')
  WHERE
    json_valid(NEW.categorias_confirmadas) = 0
    OR json_type(NEW.categorias_confirmadas) <> 'array';
END;

CREATE TRIGGER coluna_categorias_json_update
BEFORE UPDATE OF categorias_confirmadas ON coluna
WHEN NEW.categorias_confirmadas IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Categorias confirmadas devem formar um array JSON válido.')
  WHERE
    json_valid(NEW.categorias_confirmadas) = 0
    OR json_type(NEW.categorias_confirmadas) <> 'array';
END;

CREATE TRIGGER importacao_validar_confirmacao
BEFORE UPDATE OF status ON importacao
WHEN NEW.status = 'confirmada'
BEGIN
  SELECT RAISE(ABORT, 'Toda pergunta precisa de um tipo antes da confirmação.')
  WHERE EXISTS (
    SELECT 1
    FROM coluna
    WHERE importacao_id = NEW.id
      AND papel = 'pergunta'
      AND tipo_variavel IS NULL
  );

  SELECT RAISE(ABORT, 'Perguntas ordinais precisam de categorias ordenadas válidas.')
  WHERE EXISTS (
    SELECT 1
    FROM coluna
    WHERE importacao_id = NEW.id
      AND tipo_variavel = 'qualitativa_ordinal'
      AND (
        categorias_confirmadas IS NULL
        OR json_valid(categorias_confirmadas) = 0
      )
  );

  SELECT RAISE(ABORT, 'Perguntas ordinais precisam de ao menos uma categoria.')
  WHERE EXISTS (
    SELECT 1
    FROM coluna
    WHERE importacao_id = NEW.id
      AND tipo_variavel = 'qualitativa_ordinal'
      AND json_array_length(categorias_confirmadas) = 0
  );
END;

CREATE TRIGGER importacao_confirmada_exige_revisao
BEFORE INSERT ON importacao
WHEN NEW.status = 'confirmada'
BEGIN
  SELECT RAISE(ABORT, 'A importação deve ser revisada antes da confirmação.');
END;

CREATE TRIGGER coluna_bloquear_insert_confirmada
BEFORE INSERT ON coluna
WHEN (
  SELECT status FROM importacao WHERE id = NEW.importacao_id
) = 'confirmada'
BEGIN
  SELECT RAISE(ABORT, 'Reabra a importação para alterar suas colunas.');
END;

CREATE TRIGGER coluna_bloquear_update_confirmada
BEFORE UPDATE ON coluna
WHEN (
  SELECT status FROM importacao WHERE id = OLD.importacao_id
) = 'confirmada'
BEGIN
  SELECT RAISE(ABORT, 'Reabra a importação para alterar suas colunas.');
END;

CREATE TRIGGER coluna_bloquear_delete_confirmada
BEFORE DELETE ON coluna
WHEN (
  SELECT status FROM importacao WHERE id = OLD.importacao_id
) = 'confirmada'
BEGIN
  SELECT RAISE(ABORT, 'Reabra a importação para alterar suas colunas.');
END;

CREATE TRIGGER importacao_atualizar_data
AFTER UPDATE ON importacao
WHEN NEW.atualizado_em = OLD.atualizado_em
BEGIN
  UPDATE importacao
  SET atualizado_em = datetime('now')
  WHERE id = NEW.id;
END;
