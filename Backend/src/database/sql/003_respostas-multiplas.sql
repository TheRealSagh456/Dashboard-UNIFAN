-- NULL mantém a detecção para importações anteriores. Novas revisões gravam 0/1.
ALTER TABLE coluna ADD COLUMN respostas_multiplas INTEGER DEFAULT NULL
CHECK (
  respostas_multiplas IS NULL OR respostas_multiplas = 0 OR (
    respostas_multiplas = 1 AND papel = 'pergunta' AND tipo_variavel = 'qualitativa_nominal'
  )
);
