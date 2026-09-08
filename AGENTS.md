# Dashboard UNIFAN — Diretrizes para IAs

## Contexto compacto

Este projeto cria um dashboard estatístico para uma pesquisa sobre tecnologia.
O formulário real ainda será criado no Google Forms. O sistema importará as
respostas em `.xlsx`, `.xls` ou `.csv`, armazenará os dados no SQLite e exibirá
as análises no dashboard. Os arquivos em `Mocks/forms/` são dados fictícios para
desenvolvimento; eles não contêm resultados estatísticos prontos.

Stack atual: React, Vite e TypeScript no `Frontend`; Fastify e TypeScript no
`Backend`; SQLite para persistência. Usar `npm` como gerenciador de pacotes.

## Leitura obrigatória antes de codificar

1. Leia este arquivo.
2. Leia `Docs/Mapa.md` e os documentos ligados à tarefa.
3. Para importação ou dados, leia `Docs/import-format.md`,
   `Docs/mock-data.md` e `Docs/questionnaire.md`.
4. Para decisões já aceitas, leia `Docs/decisions.md`.
5. Para commits solicitados pelos membros, leia `Docs/Commits.md`.

Se você não tiver acesso ao repositório, peça ou receba este arquivo e os
documentos aplicáveis antes de sugerir código. O contexto desta seção permite
entender o projeto, mas não substitui as regras dos documentos.

## Organização e responsabilidades

Os nomes de pastas podem evoluir. Preserve estas responsabilidades:

```text
Frontend
  pages/ ou telas/        Compõe cada tela.
  features/               Agrupa funcionalidades, como importação e dashboard.
  components/             Componentes reutilizáveis.
  services/               Comunicação com a API.
  hooks/, utils/, types/  Lógica reutilizável, funções puras e tipos.

Backend
  routes/                 Registra endpoints Fastify.
  controllers/            Recebe a requisição e forma a resposta HTTP.
  services/               Regras de negócio e leitura/gravação no SQLite.
  database/               Conexão, configuração e migrações.
  importacao/             Leitores Excel/CSV, normalização e validação.
  utils/, types/          Funções puras e tipos internos reutilizáveis.
```

Fluxo esperado: frontend → API → route → controller → service → SQLite. Rotas
não concentram regra de negócio; controllers não executam consultas SQL; utils
não dependem de HTTP, banco ou estado externo. A importação deve preservar o
valor original, tratar ausências como `null` e não transformar `0` em vazio.

Respostas HTTP usam `{ data: ... }` no sucesso e
`{ error: { message: string, code: string } }` no erro.

## Forma de trabalhar

Antes de qualquer alteração, interprete a solicitação e pergunte se o
entendimento está correto. Não implemente antes da confirmação do solicitante.

Após a confirmação:

- use nomes em português ou inglês de forma consistente dentro do módulo;
- instale bibliotecas quando necessárias e informe a justificativa;
- altere e valide os arquivos afetados;
- não crie commits, branches, PRs ou ações externas;
- ao concluir a funcionalidade, atualize os documentos relevantes em `Docs/`.

Ao atuar apenas como IA externa, indique ao final o arquivo e a seção de `Docs/`
que devem ser atualizados, com a informação a registrar. Não repita essa indicação
durante cada etapa da implementação.

Na entrega, informe arquivos alterados, documentação atualizada ou indicada,
dependências adicionadas e validações executadas.

## Prompt-base para IA sem acesso ao repositório

Copie este bloco junto de `AGENTS.md` e dos documentos relacionados à tarefa:

```text
Você vai colaborar no Dashboard UNIFAN, um dashboard estatístico de uma pesquisa
sobre tecnologia. O frontend usa React, Vite e TypeScript. O backend usa Fastify,
TypeScript e SQLite. As respostas do Google Forms serão importadas de XLSX, XLS
ou CSV; os mocks representam apenas dados brutos.

Leia primeiro o AGENTS.md e os documentos enviados. Tarefa: [descreva a tarefa].

Ainda não escreva código. Explique sua interpretação da tarefa e pergunte se ela
está correta. Após a confirmação, implemente seguindo o AGENTS.md. Ao terminar,
informe o código, as validações e o arquivo e a seção de Docs que devem ser
atualizados.
```
