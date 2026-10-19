# Backend: funcionamento e próximos passos

## Estado atual

O backend usa Node 24+, TypeScript executado diretamente, Fastify, Knex e
SQLite com better-sqlite3. CSV usa csv-parse; XLSX e XLS usam SheetJS.
O plugin @fastify/multipart recebe os uploads.

Estão implementados:

- leitura de CSV e da primeira aba Excel não vazia;
- upload, prévia, configuração das colunas e confirmação;
- preservação dos valores brutos e normalização conforme o tipo confirmado;
- armazenamento transacional e registro de problemas de conversão;
- pesquisa atual, exclusão, listagem de perguntas e respostas paginadas;
- exportação dos dados persistidos em XLSX e CSV;
- integração da importação, visão geral, catálogo, análises e relatório no frontend;
- frequências, medidas, histogramas, boxplot, totais e percentuais no backend.

O dashboard consulta GET /api/pesquisas/:pesquisaId/dashboard. O service lê
somente perguntas confirmadas e valores tratados do SQLite. As funções puras de
estatistica/calculos.ts recebem os valores e devolvem medidas, frequências e
metadados gráficos. Classes quantitativas incluem valor numérico; nas contínuas,
o ponto médio é calculado no backend para posicionar o gráfico de pontos.
O frontend não recalcula estatísticas nem usa fallback mock.

## Organização

Fluxo: frontend → rota → controller → service → SQLite.

| Pasta ou arquivo | Responsabilidade |
| :--- | :--- |
| routes/ | URLs, métodos e schemas básicos de entrada |
| controllers/ | Parâmetros HTTP, arquivo recebido e envelope da resposta |
| services/ | Coordenação, consultas e transações com Knex |
| importacao/leitores/ | Extração da matriz CSV/Excel |
| importacao/classificacao.ts | Sugestões de papel, tipo e categorias para revisão |
| importacao/respostas-multiplas.ts | Separação e sugestão revisável de alternativas |
| importacao/normalizacao.ts | Ausências, serialização bruta e conversão por tipo |
| importacao/validacao.ts | Estrutura, quantidade de perguntas e limites de arquivo |
| estatistica/calculos.ts | Frequências, medidas, classes de Sturges e boxplot, sem HTTP ou banco |
| services/dashboard.service.ts | Consulta dos valores tratados e composição do dashboard |
| types/importacao.ts e types/dashboard.ts | Tipos compartilhados |
| database/ | Conexão, migrations e testes de integridade |
| utils/erro-aplicacao.ts | Erro esperado com código e status |
| app.ts | Montagem da aplicação, plugins, erros e rotas; permite Fastify inject |
| server.ts | Configuração do ambiente e abertura da porta |

Rotas e controllers não executam SQL. Funções de normalização e validação não
dependem de HTTP ou banco. Imports locais usam extensão .ts; não há recursividade.

## Fluxo da importação

1. POST /api/importacoes recebe um arquivo. O leitor retorna uma matriz, sem
   usar cabeçalhos como chaves. O CSV detecta vírgula, ponto e vírgula ou TAB;
   XLSX/XLS usam a primeira aba não vazia.
2. O service gera UUIDs e grava a importação em revisão, colunas, participantes
   e respostas brutas em uma transação.
3. GET /api/importacoes/:id fornece tipos sugeridos, exemplos e problemas.
   Identificação de metadados usa cabeçalhos usuais do Forms, sem fixar posições.
4. O frontend permite corrigir papel, tipo e categoria na grade de configuração.
   Categorias ordinais e exemplos ficam no detalhe da própria linha; o separador
   decimal do CSV fica à esquerda da busca. PUT /:id/colunas salva todas as colunas.
5. POST /:id/confirmar converte os dados. Com problemas de conversão, a revisão
   permanece aberta e os problemas podem ser consultados. Com sucesso, a
   importação passa a confirmada e se torna a pesquisa atual.

As sugestões não substituem a revisão: números inteiros sugerem discreta,
números fracionários sugerem contínua. Escolaridade, frequência e concordância
possuem ordens sugeridas a partir dos rótulos planejados. Outros textos sugerem
nominal, com categorias observadas. Uma contagem escrita como texto não é
corrigida automaticamente. O questionário não está fixado no código.

Limites iniciais: 10 MB, 10.000 respostas e seleção de 1 a 30 perguntas.
Cabeçalhos vazios são preservados e começam como não selecionados. Linhas
inteiramente vazias são ignoradas; ausências nas perguntas tornam-se null.
Datas CSV permanecem no texto original, inclusive AM/PM e GMT. Datas Excel
são representadas como calendário ISO sem sufixo Z, sem inventar fuso.
Diferenças de precisão da conversão Excel não são corrigidas silenciosamente.

## Persistência

O schema existente é mantido por migrations versionadas, sem editar as aplicadas.
A migration 003 acrescenta respostas_multiplas à coluna: 0/1 em novas revisões,
null para detecção compatível em importações anteriores. O texto bruto e as
respostas existentes são preservados.


| Tabela | Papel |
| :--- | :--- |
| importacao | Arquivo, formato, status e dialeto CSV |
| coluna | Posição, cabeçalho original, papel, tipo e categorias confirmadas |
| participante | Registro da fonte e ID interno |
| resposta | Uma célula por participante/coluna, com bruto e valor tratado |
| problema_importacao | Registro, coluna, bruto, código e mensagem do problema |
| schema_migrations | Histórico e checksums das migrations |

O valor bruto é TEXT. Valores tratados usam valor_numerico ou valor_categoria,
nunca ambos. Metadados e colunas não selecionadas conservam somente o bruto.
Uma ausência tratada é null; um zero continua numérico. O índice do registro CSV
não equivale necessariamente à linha física quando há quebras dentro de aspas.

Os services usam obterBanco(). Dentro de uma transação, todas as consultas
usam trx. Inserções e conversões usam lotes pequenos para evitar uma consulta
isolada por célula. Falhas inesperadas desfazem a transação. Problemas esperados
de conversão são gravados e apresentados na revisão.

A pesquisa atual é a última confirmada por atualizado_em, com desempate pelo
ID. Excluir a atual preserva outras importações e pode revelar uma anterior.
Revisões não substituem a pesquisa atual até a confirmação.

## Executar e validar

Siga o README do Backend. Use npm ci, npm run typecheck e npm test.
Os testes criam bancos temporários e não alteram o banco de desenvolvimento.

Se a inicialização falhar com `Could not locate the bindings file`, confira a
instalação do driver nativo `better-sqlite3`. Reinstale com `npm ci` na pasta
Backend, usando Node 24+ e o lockfile oficial. Uma instalação via outro
gerenciador com scripts de build não executados pode deixar o pacote sem
`better_sqlite3.node`. Não é necessário apagar o SQLite nem alterar o schema.

O pnpm 12 pode reinstalar dependências antes de `pnpm run dev`, revertendo uma
instalação feita com npm. Para manter o npm definido na DEC-001, a configuração
local do backend usa `verifyDepsBeforeRun: false`; assim, executar scripts pelo
pnpm não reinstala pacotes. Isso não altera permissões de build nem transforma
o pnpm no gerenciador oficial. Novas instalações devem usar `npm ci`.

A suíte cobre migrations, CSV com aspas e quebras de linha, upload multipart,
revisão, ordinais, zero, decimais, ausências, XLSX/XLS, rollback, limites,
persistência após reabertura, exportação e exclusão. Os dois mocks são lidos e
confirmados com 1.000 respostas, 25 perguntas, três metadados e 20 ausências;
seus valores tratados das perguntas são comparados integralmente.
A equivalência de calendários CSV/Excel continua separada dessa comparação.
As análises completas dos dois mocks também são comparadas. Testes pequenos
com resultados calculados à mão cobrem respostas múltiplas, percentuais por
participante, repetição de alternativas, compatibilidade anterior e dados brutos,
quartis interpolados, empates na moda,
mediana ordinal, fronteiras de classes, densidade, amostra constante e ausência
total. A API é testada com temas diferentes e exportação de uma pesquisa anterior.

## Próximas etapas

- Avaliar o CSV definitivo para ajustar as sugestões quando necessário,
  preservando a revisão explícita dos tipos e das ordens.
- A busca por link do Google Sheets continua pendente; uploads locais funcionam.

Os contratos e exemplos de payload estão em [api.md](./api.md).
