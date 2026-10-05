# Backend do Dashboard UNIFAN

Base de desenvolvimento com Fastify, TypeScript, Knex e SQLite. A conexão e as
migrations estão disponíveis; importação, consultas da pesquisa e análise
estatística serão implementadas pelos membros.

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

## Comandos

| Comando             | Finalidade                                                                     |
| :------------------ | :----------------------------------------------------------------------------- |
| `npm run dev`       | Executar o servidor e reiniciá-lo após alterações.                             |
| `npm start`         | Executar o servidor sem observar alterações.                                   |
| `npm run typecheck` | Conferir os tipos TypeScript.                                                  |
| `npm run build`     | Conferir os tipos; não gera `dist` neste projeto.                              |
| `npm test`          | Validar as migrations e parte das regras de integridade em bancos temporários. |
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

## Próximas etapas

Leia [o roteiro do backend](../Docs/backend-guide.md) e [os contratos da
API](../Docs/api.md). Os arquivos de importação e perguntas com `TODO`s são
pontos de partida; ainda não expõem endpoints. Pesquisa atual e exportações
ainda utilizam mocks, como descrito na documentação.
