# Publicar no Render gratuito

## O que foi preparado

O `render.yaml` da raiz define um único Web Service no plano `free`, com Node 24,
`NODE_ENV=production` e health check em `/health`. Não cria PostgreSQL, disco ou
qualquer recurso pago. A publicação só acontece quando o responsável conectar
o repositório e confirmar a criação do serviço no Render.

No modo de produção, o Fastify entrega o build de `Frontend/dist` e a API no
mesmo endereço. As chamadas relativas a `/api` continuam funcionando, sem CORS
nem proxy Vite em produção. As páginas `/`, `/import`, `/components` e `/home`
(incluindo perguntas) podem ser abertas diretamente e atualizadas no navegador.
Assets ausentes e URLs da API não recebem o HTML da aplicação. Arquivos ocultos
não são publicados. Sem `Frontend/dist/index.html`, o servidor de produção
recusa iniciar e informa o comando de build necessário.

No desenvolvimento, nada muda: o backend continua em `3333` e o Vite em `5173`,
com o proxy já existente. Não configure `NODE_ENV=production` no `.env` local
para o desenvolvimento habitual. Node 20 não executa os scripts do backend;
use Node 24 também nos testes locais.

## Publicação pelo GitHub

1. Envie as alterações preparadas ao repositório GitHub pelo fluxo da equipe.
   Não envie `.env`, `node_modules`, `Frontend/dist` nem arquivos SQLite.
2. No painel do Render, escolha **New → Blueprint** e conecte seu GitHub.
3. Selecione `Dashboard-UNIFAN` e a branch que contém esta configuração.
4. Use o arquivo `render.yaml` na raiz. Confira que existe somente um serviço
   `dashboard-unifan`, no plano **Free**, sem discos ou bancos adicionais.
5. Confirme a criação e acompanhe os logs do primeiro build/deploy.
6. Abra o endereço `https://...onrender.com`, aguarde a inicialização e importe
   a planilha pelo site. O banco online começa vazio; o banco local não é enviado.

Se preferir **New → Web Service**, use estas mesmas opções manualmente:

| Campo | Valor |
| :--- | :--- |
| Runtime | Node |
| Root Directory | Vazio: usar a raiz do repositório |
| Plan | Free |
| Build Command | `npm --prefix Backend ci && npm --prefix Frontend ci --include=dev && npm --prefix Frontend run build` |
| Start Command | `npm --prefix Backend start` |
| Health Check Path | `/health` |
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |

Não fixe `PORT`: o servidor já lê a porta fornecida pelo Render e escuta em
`0.0.0.0`. Não configure `DATABASE_PATH=/var/data/dashboard.db`, porque não há
disco montado. O SQLite usa o caminho padrão `Backend/src/database/data/dashboard.db`
no sistema de arquivos temporário. As migrations são aplicadas na inicialização,
não no build.

O frontend depende de ferramentas de desenvolvimento para compilar; por isso o
comando usa `--include=dev`, mesmo com `NODE_ENV=production`. As dependências
nativas do backend são instaladas no ambiente Linux do Render por `npm ci`;
não copie o `node_modules` do Windows.

## Limitações e cuidados para apresentar

- O serviço gratuito suspende após 15 minutos sem tráfego. O próximo acesso
  pode levar aproximadamente um minuto para iniciar.
- Reinício, suspensão e nova publicação podem apagar o SQLite. Reimporte a
  planilha quando necessário; não use a hospedagem como cópia de segurança.
- Guarde o arquivo da pesquisa fora do site e abra o endereço antes de apresentar.
  Confira se os dados ainda estão disponíveis e teste uma pergunta e a exportação.
- A API atual não possui autenticação nem separação por visitante. A pesquisa
  é compartilhada; outra pessoa com acesso ao site pode importar ou excluir dados.
  Use somente dados fictícios ou anonimizados e não publique respostas identificáveis.
- O plano está sujeito às cotas gratuitas do Render. Confira o plano e os limites
  no painel; não habilite recursos pagos para seguir este roteiro.

## Conferir a produção localmente

Com Node 24 e as dependências instaladas, na raiz:

```powershell
npm --prefix Frontend run build
$env:NODE_ENV = "production"
$env:PORT = "3333"
npm --prefix Backend start
```

Esse comando usa o banco local padrão. Para um ensaio isolado, configure antes
`DATABASE_PATH` com um caminho absoluto para um banco de teste, sem apontar para
o banco que contém sua pesquisa. Ao parar o servidor, remova as variáveis apenas
da sessão de terminal que você configurou antes de voltar ao desenvolvimento:

```powershell
Remove-Item Env:NODE_ENV
Remove-Item Env:PORT
# Somente se você definiu DATABASE_PATH para o ensaio:
Remove-Item Env:DATABASE_PATH
```

As variáveis do painel do Render são independentes dessas variáveis locais.

## Validações

- `render.yaml` validado contra o JSON Schema oficial do Render, com um único
  serviço Free e sem disco/banco pago; nenhuma implantação remota foi executada;
- `npm --prefix Backend run typecheck` e `npm --prefix Backend test`;
- `npm --prefix Frontend run build`, `npm --prefix Frontend test` e lint;
- testes de páginas, acesso direto a perguntas, assets, arquivos ocultos,
  erros JSON da API, requisições HEAD e modo de desenvolvimento;
- importação, revisão, confirmação, navegação, atualização de pergunta e
  exportação CSV no navegador, com o frontend compilado servido pelo Fastify.

## Referências

- [Blueprints do Render](https://render.com/docs/blueprint-spec)
- [Web Services](https://render.com/docs/web-services)
- [Versão do Node](https://render.com/docs/node-version)
- [Limitações do plano gratuito](https://render.com/docs/free)
- [Plugin oficial de arquivos estáticos do Fastify](https://github.com/fastify/fastify-static)
