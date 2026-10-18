# Backend do Dashboard UNIFAN

API com Fastify, TypeScript, Knex e SQLite. Importa CSV, XLSX e XLS, permite
revisar as colunas e armazena respostas brutas e tratadas. Pesquisa atual,
consultas básicas, exclusão e exportação usam os dados persistidos.
O backend calcula frequências, medidas estatísticas, classes de histogramas,
boxplot, totais e percentuais. As telas e o relatório consomem essas análises.

## Preparar o ambiente

Use Node.js **24 ou superior** e npm. Confirme a versão antes de instalar:

```powershell
node --version
npm --version
```

Na raiz do repositório:

```powershell
cd Backend
npm ci
npm run setup
npm run typecheck
npm test
npm run dev
```

`npm ci` instala as versões do lockfile, incluindo o driver nativo
`better-sqlite3`. Se trocar a versão principal do Node, execute `npm ci`
novamente para instalar o driver compatível. O setup cria `.env` a partir de
`.env.example` somente quando ele ainda não existe.

### Erro ao carregar o SQLite

Se aparecer `Could not locate the bindings file` ou faltar
`better_sqlite3.node`, o driver nativo do SQLite não foi instalado corretamente.
Isso pode acontecer ao trocar de gerenciador ou bloquear o script de instalação
da dependência. Com o backend parado, execute na pasta `Backend`:

```powershell
npm ci
npm start
```

Use npm e o `package-lock.json` do projeto para manter as versões previstas.
Essa reinstalação substitui `node_modules` e preserva o banco em
`src/database/data/`. O arquivo `.env` é opcional para iniciar com a porta padrão.

No pnpm 12, `pnpm run dev` pode instalar dependências automaticamente antes de
executar o script. Se `allowBuilds.better-sqlite3` estiver como `false`, essa
instalação deixa o driver sem binário. A configuração local
`verifyDepsBeforeRun: false` em `pnpm-workspace.yaml` evita essa substituição ao
executar scripts. Continue usando `npm ci` para instalar; `pnpm install` explícito
ainda usa seu próprio lockfile e suas permissões de build.

## Comandos

| Comando             | Finalidade                                                                     |
| :------------------ | :----------------------------------------------------------------------------- |
| `npm run dev`       | Executar o servidor e reiniciá-lo após alterações.                             |
| `npm start`         | Executar o servidor sem observar alterações.                                   |
| `npm run typecheck` | Conferir os tipos TypeScript.                                                  |
| `npm run build`     | Conferir os tipos; não gera `dist` neste projeto.                              |
| `npm test`          | Validar migrations, importação, API e persistência em bancos temporários. |
| `npm run setup`     | Criar a configuração local inicial.                                            |

## Banco e configuração

O servidor aplica as migrations antes de atender requisições. O banco padrão é
`src/database/data/dashboard.db`; o diretório é criado automaticamente. `PORT`
define a porta, com padrão `3333`. A variável opcional `DATABASE_PATH` permite
usar outro banco; caminhos relativos partem da pasta `Backend`.

Não versione `.env`, o banco, seus arquivos WAL/SHM ou `node_modules`.
Alterações de schema devem entrar em uma **nova migration**. O runner verifica
checksums: editar uma migration já aplicada impede a inicialização.

## Conferir o servidor

Com o servidor aberto, em outro terminal PowerShell:

```powershell
Invoke-RestMethod http://localhost:3333/health
```

A resposta usa `data.status`. Esse endpoint verifica a disponibilidade do
servidor; os testes de banco são executados por `npm test`.

## Importar respostas

Com backend e frontend em execução, selecione CSV ou Excel na página de
importação, revise as colunas e continue para confirmar. O arquivo aceita
até 10 MB e 10.000 respostas; selecione de 1 a 30 perguntas.

Também é possível enviar um arquivo com curl:

```powershell
curl.exe -F "arquivo=@C:/caminho/respostas.csv" http://localhost:3333/api/importacoes
```

A resposta contém o ID da importação e as colunas sugeridas. Revise pela rota
`PUT /api/importacoes/:id/colunas` e confirme com
`POST /api/importacoes/:id/confirmar`. O upload isolado mantém os dados em revisão.
`GET /api/pesquisas/atual` retorna 404 enquanto não existir uma confirmação.

Leia [o funcionamento do backend](../Docs/backend-guide.md) e os
[contratos completos](../Docs/api.md). Após confirmar, a Home consulta
GET /api/pesquisas/:pesquisaId/dashboard e apresenta os resultados calculados
sobre os dados tratados. /home abre a pesquisa atual; sem pesquisa, a interface
oferece importar um arquivo. Exportações usam a pesquisa exibida.
