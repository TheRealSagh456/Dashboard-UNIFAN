# Roteiro de construção do backend

Este roteiro é para os integrantes que estão aprendendo a construir uma API.
A base do SQLite está pronta; os membros implementarão os services, controllers,
rotas, leitores e cálculos em etapas pequenas. Os arquivos com `TODO`s indicam
onde começar e não contêm uma implementação dessas funcionalidades.

## Preparação e ponto de partida

Siga o [README do Backend](../Backend/README.md) para instalar e executar com
Node 24+ e npm. Antes de programar, leia [AGENTS.md](../AGENTS.md),
[import-format.md](./import-format.md), [mock-data.md](./mock-data.md),
[questionnaire.md](./questionnaire.md) e [decisions.md](./decisions.md).

O conteúdo da branch `Backend-SQLite` já está na `main`. A `main` também possui
melhorias posteriores: conexão compartilhada com Knex, checksums das migrations,
migration de integridade e testes de banco. Use essa versão como base.

| Parte                                                         | Situação                                                     |
| :------------------------------------------------------------ | :----------------------------------------------------------- |
| Conexão SQLite com WAL, chaves estrangeiras e tempo de espera | Disponível em `Backend/src/database/conexao.ts`.             |
| Schema e migrations versionadas                               | Disponíveis em `Backend/src/database/sql/` e `migracoes.ts`. |
| Testes de banco                                               | Disponíveis em `Backend/src/database/database.test.ts`.      |
| Pesquisa atual e limpeza                                      | Endpoints existentes, com estado mockado em memória.         |
| Exportação XLSX/CSV                                           | Endpoint existente, com leitura dos arquivos mockados.       |
| Upload, revisão e confirmação da importação                   | A implementar.                                               |
| Consultas de perguntas e cálculos estatísticos                | A implementar.                                               |

Os mocks não carregam o SQLite automaticamente. Iniciar o servidor cria o
schema, mas não importa respostas. As rotas novas só devem ser registradas
quando o fluxo correspondente estiver implementado e documentado.

## Responsabilidade de cada camada

O fluxo é: **frontend → API → rota → controller → service → SQLite**.

| Pasta                      | O que construir                                                 | O que ela recebe ou entrega                                                            |
| :------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `Backend/src/routes/`      | Registrar URLs e métodos do Fastify.                            | Conecta uma requisição ao controller.                                                  |
| `Backend/src/controllers/` | Ler os parâmetros HTTP, aguardar o service e formar a resposta. | Usa `request` e `reply`, sem executar SQL.                                             |
| `Backend/src/services/`    | Implementar regras, consultar e gravar com Knex.                | Recebe dados comuns e devolve resultados ou erros, sem depender de HTTP.               |
| `Backend/src/database/`    | Manter a conexão, migrations e testes de integridade.           | Disponibiliza o banco para os services.                                                |
| `Backend/src/importacao/`  | Criar leitores, normalização e validação da importação.         | Extrai valores dos arquivos e relata inconsistências. A pasta será criada nessa etapa. |
| `Backend/src/types/`       | Compartilhar tipos usados por mais de uma camada.               | Não executa validação nem consultas.                                                   |

`types/importacao.ts` fornece somente o vocabulário do schema e os tipos de
célula e matriz bruta. Os membros devem definir os tipos de entrada e retorno
de cada operação conforme o contrato escolhido. Um tipo TypeScript não garante
que o conteúdo recebido pela API seja válido.

## Entender o schema

Cada importação possui colunas e participantes. Cada resposta associa um
participante a uma coluna. O modelo guarda uma linha por célula, em vez de
criar uma coluna SQL para cada pergunta do formulário.

| Tabela                | Papel                                                  | Campos principais                                                                                                                         |
| :-------------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `importacao`          | Identificar o arquivo e o estágio da revisão.          | `id`, `nome_arquivo`, `formato`, `status`, `delimitador`, `separador_decimal`, `criado_em`, `atualizado_em`.                              |
| `coluna`              | Preservar a coluna original e sua classificação.       | `id`, `importacao_id`, `posicao_original`, `cabecalho_original`, `papel`, `tipo_variavel`, `codigo_referencia`, `categorias_confirmadas`. |
| `participante`        | Representar cada registro de origem.                   | `id`, `importacao_id`, `indice_linha`.                                                                                                    |
| `resposta`            | Preservar o valor recebido e seu valor tratado.        | `id`, `participante_id`, `coluna_id`, `valor_bruto`, `valor_numerico`, `valor_categoria`.                                                 |
| `problema_importacao` | Registrar inconsistências sem apagar o valor original. | `id`, `importacao_id`, `participante_indice_linha`, `coluna_id`, `valor_bruto`, `codigo`, `mensagem`, `criado_em`.                        |
| `schema_migrations`   | Controlar migrations aplicadas.                        | `id`, `checksum`, `aplicada_em`. É mantida pelo runner.                                                                                   |

Os IDs são internos e textuais. A posição da coluna e o índice do registro
preservam sua localização na fonte; em CSV, um registro pode ocupar mais de uma
linha física. Cabeçalhos e IDs externos não substituem IDs internos.

Os papéis da coluna são `pergunta`, `metadado` e `nao_selecionada`. Os tipos de
variável são `quantitativa_discreta`, `quantitativa_continua`,
`qualitativa_nominal` e `qualitativa_ordinal`. Os status de importação são
`rascunho`, `revisao`, `confirmada` e `erro`.

As migrations existentes garantem parte da integridade:

- Colunas e participantes apontam para uma importação existente.
- Participante e coluna de uma resposta devem pertencer à mesma importação.
- Um problema associado a uma coluna deve pertencer à mesma importação dela.
- Não há duas respostas para o mesmo par participante/coluna, nem duas colunas
  na mesma posição ou dois participantes no mesmo índice de uma importação.
- Excluir uma importação remove seus dados dependentes. Excluir uma coluna
  mantém o problema relacionado, com `coluna_id` nulo.
- Uma resposta não admite valor numérico e categórico simultaneamente.
- Categorias confirmadas são armazenadas como texto contendo um array JSON.
- A confirmação exige tipo nas perguntas e categorias nas perguntas ordinais;
  alterações de colunas de uma importação confirmada exigem reabrir a revisão.
- TAB é o caractere de tabulação real. A migration `002` corrige o texto literal
  da versão inicial.

Essas proteções não substituem a validação do service. O limite de perguntas,
os formatos de valores, a consistência da matriz e os limites específicos de
cada pergunta também precisam ser validados pelos membros.

`valor_bruto` é `TEXT`, enquanto `valor_numerico` é `REAL` e
`valor_categoria` é `TEXT`. Ao persistir números, datas ou outros valores
extraídos do Excel, definir e documentar uma representação do valor bruto que
preserve seu significado. Ausências usam `null`; zero continua sendo válido.

## Usar a conexão existente

Os services obtêm a instância compartilhada por `obterBanco()`. O Knex devolve
Promises: as operações devem ser aguardadas com `await`. Por consequência,
controllers que hoje chamam funções síncronas também precisarão de `await`
quando esses services passarem a consultar o banco.

`criarBanco(caminho)` permite criar uma instância separada para testes. O
servidor aplica `executarMigracoes()` antes de registrar as rotas e fecha a
instância compartilhada com `fecharBanco()` ao encerrar a aplicação. Cada
service deve reutilizar essa conexão, sem abrir ou fechar outro banco por
requisição.

Uma transação agrupa operações: todas são confirmadas juntas, ou todas são
desfeitas se houver erro. Dentro da transação Knex, usar o objeto `trx` recebido
em todas as consultas daquele grupo. Usar `obterBanco()` novamente dentro dela
pode esperar por uma conexão que a própria transação está ocupando.

## Etapas de implementação

Execute uma etapa por vez. Defina a entrada, a saída e os casos de teste antes
de escrever a regra. Ao concluir, atualize os contratos em [api.md](./api.md).

### Etapa 1 — Consultar a pesquisa atual

Comece em `services/pesquisas.service.ts`, acompanhado de seu controller e rota
existentes. Troque o mock por leitura da importação confirmada, contagem de
participantes e contagem de colunas com papel `pergunta`.

Antes de implementar, definir no contrato como escolher a pesquisa atual quando
houver mais de uma importação confirmada e como obter o nome exibido da pesquisa.
Conferir uma base vazia (`404`), uma importação em revisão e uma confirmada.
Garantir que metadados não contem como perguntas. O nome original do arquivo
deve continuar na resposta.

### Etapa 2 — Limpar a pesquisa atual

No mesmo service, substituir a limpeza em memória pela exclusão transacional
da importação selecionada na etapa 1. Preservar a confirmação no frontend e a
resposta `{ data: { cleared: true } }`.

Conferir as tabelas dependentes antes e depois, a preservação de outras
importações e o tratamento de falhas. Usar um banco de teste separado do banco
local de desenvolvimento.

### Etapa 3 — Ler os arquivos

Criar os módulos `importacao/leitores/excel.ts` e `importacao/leitores/csv.ts`.
Usar as bibliotecas já instaladas: `xlsx` para Excel e `csv-parse` para CSV.
Retornar uma matriz de valores brutos para que o service possa revisar a
estrutura antes de usar cabeçalhos como chaves.

Seguir [mock-data.md](./mock-data.md): primeira aba não vazia do Excel, parser
apropriado para CSV, BOM, delimitador e separador decimal. Não separar CSV com
`split`. O grupo deve investigar a diferença de precisão das datas dos mocks
registrada naquele documento antes de concluir a comparação integral.

Conferir 1.000 registros, 28 colunas, 25 perguntas, 3 metadados e 20 células de
resposta ausentes. Conferir zero, decimal, acentos e a categoria `Perplexity`.
O formato `.xls` é previsto, mas ainda precisa de fixture própria.

### Etapa 4 — Revisar e persistir a importação

Comece no arquivo-base `services/importacao.service.ts`. Criar os módulos
`importacao/normalizacao.ts` e `importacao/validacao.ts` conforme a necessidade.
Definir o fluxo de rascunho, revisão das colunas e confirmação antes de ligar
o upload ao frontend.

Validar cabeçalhos, posições e quantidade de perguntas. Cada pergunta precisa
de tipo confirmado; perguntas ordinais precisam de categorias em ordem
confirmada. Preservar valores brutos e relatar números ou categorias inválidos
em `problema_importacao`, sem transformá-los silenciosamente em ausência.

Conferir a seleção de 1 e 30 perguntas, a rejeição da 31ª, ausências, zero,
categorias ordinais e erro durante uma transação. Usar IDs internos estáveis
durante a revisão. Definir os retornos para que o frontend consiga apresentar
os problemas ao usuário.

### Etapa 5 — Expor a importação na API

Usar `controllers/importacao.controller.ts` e `routes/importacao.routes.ts`.
Definir em `api.md` as URLs, os métodos, os formatos de entrada e retorno e os
limites de upload. Escolher e justificar o suporte a upload do Fastify quando
for necessário; essa dependência ainda não foi adicionada.

O controller aguarda o service e forma a resposta. A rota registra o handler.
Depois, registrar o módulo no `server.ts`. Conferir sucesso, formato inválido,
limite excedido e erro interno com o envelope padrão. Só então integrar a tela
de importação do frontend.

### Etapa 6 — Consultar e analisar perguntas

Usar os arquivos-base `perguntas.service.ts`, `perguntas.controller.ts` e
`perguntas.routes.ts`. Primeiro implementar listagem e leitura de uma pergunta;
depois frequências; por último medidas e dados para gráficos.

Conferir se pesquisa e pergunta pertencem à mesma importação. Separar ausentes
de válidos e preservar zero. Usar uma amostra pequena com resultado calculado
à mão antes de testar as 1.000 respostas mockadas.

Seguir [business-rules.md](./business-rules.md) para medidas e visualizações de
cada tipo. A convenção dos quartis permanece pendente: definir e registrar a
decisão antes de implementar. Documentar o contrato e registrar as rotas quando
o fluxo estiver pronto.

### Etapa 7 — Exportar os dados persistidos

Comece no `services/exportacoes.service.ts` existente. Substituir a leitura dos
mocks por dados da importação confirmada, mantendo os formatos, os cabeçalhos e
os contratos definidos em `api.md`.

Conferir pesquisa inteira em XLSX e pergunta em XLSX/CSV, incluindo ID da
resposta, valores originais, ausências, zero e caracteres especiais. Definir
como uma pergunta será identificada após a importação, pois os IDs fixos `q01`
a `q25` pertencem ao mock e não atendem a qualquer formulário.

## Conferir cada entrega

Execute `npm run typecheck` e os testes pertinentes à etapa. Compare as respostas
HTTP com `api.md` e explique ao grupo quais casos foram conferidos. Escreva
testes que comprovem resultados ou regras, incluindo erros e rollback quando
a etapa grava dados.

Em 05/10/2026, a instalação com `npm ci`, a checagem de tipos e os seis testes
existentes de SQLite foram validados com Node 24. Esses testes cobrem migrations,
atualização de banco legado, TAB/zero, referências entre importações,
confirmação ordinal e exclusão em cascata; não comprovam uma importação ou uma
análise estatística completas.
