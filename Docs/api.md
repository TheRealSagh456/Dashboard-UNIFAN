# Contratos da API

Sucessos JSON usam `{ data: ... }`. Erros usam
`{ error: { message: string, code: string } }`. Downloads retornam o arquivo
com `Content-Type` e `Content-Disposition`.

## Saúde

`GET /health` retorna `{ data: { status: "vivinho da silva" } }`.

## Importação

O fluxo é upload → revisão das colunas → confirmação. O upload já preserva o
arquivo como colunas, participantes e respostas brutas no SQLite. Somente a
confirmação converte as respostas e disponibiliza a pesquisa para consulta.
CSV, XLSX e XLS são aceitos, com até 10 MB e 10.000 respostas por arquivo.

### POST /api/importacoes

Enviar `multipart/form-data`, com um arquivo no campo `arquivo`.
Não definir manualmente o header Content-Type ao usar FormData no navegador.

Query opcional: `delimitador`, com valor `,`, `;` ou TAB real
(`%09` na URL). Sem esse parâmetro, o leitor experimenta esses três
delimitadores e escolhe a leitura consistente com mais colunas. Ambiguidade
entre leituras com múltiplas colunas exige escolha explícita.

Retorna status 201 e o objeto de revisão, exemplificado abaixo. Não depende
de um questionário fixo nem de posições específicas para metadados.

### GET /api/importacoes/:id

Retorna a revisão persistida, incluindo até cinco exemplos por coluna e os
problemas da última tentativa de confirmação. Cabeçalhos são apresentados sem
espaços externos em `enunciado`, mantendo `cabecalhoOriginal` intacto.

```json
{
  "data": {
    "id": "uuid-da-importacao",
    "nomeArquivoOriginal": "respostas.csv",
    "formato": "csv",
    "status": "revisao",
    "delimitador": ",",
    "separadorDecimal": ".",
    "totalRespostas": 6,
    "colunas": [
      {
        "id": "uuid-da-coluna",
        "posicao": 0,
        "codigo": "Q01",
        "cabecalhoOriginal": " Qual é a sua idade? ",
        "enunciado": "Qual é a sua idade?",
        "papel": "pergunta",
        "tipoVariavel": "quantitativa_discreta",
        "categorias": [],
        "respostasMultiplas": false,
        "exemplos": ["18", "19"]
      }
    ],
    "problemas": []
  }
}
```

`posicao` começa em zero. `linha` nos problemas é o índice do registro,
contando o cabeçalho como 1; um registro CSV pode ocupar várias linhas físicas.
`Q01`, `Q02` etc. são códigos de apresentação gerados no upload.
Os UUIDs identificam as colunas durante toda a revisão.

Cabeçalhos vazios recebem somente um enunciado de apresentação `Coluna N`,
com papel inicial `nao_selecionada`; seus valores continuam armazenados.
Cabeçalhos repetidos continuam separados por ID e posição.

### PUT /api/importacoes/:id/colunas

Enviar a configuração de **todas** as colunas, com os mesmos IDs:

```json
{
  "separadorDecimal": ",",
  "colunas": [
    {
      "id": "uuid-da-coluna",
      "papel": "pergunta",
      "tipoVariavel": "quantitativa_discreta",
      "categorias": []
    }
  ]
}
```

Papéis: `pergunta`, `metadado`, `nao_selecionada`.
Tipos: `quantitativa_discreta`, `quantitativa_continua`,
`qualitativa_nominal`, `qualitativa_ordinal`, ou null para outras colunas.
Selecionar de 1 a 30 perguntas; todas precisam de tipo. Perguntas ordinais
precisam de categorias únicas na ordem estatística escolhida.
`separadorDecimal` é opcional e só afeta CSV.
`respostasMultiplas` é um booleano opcional por coluna, válido somente para
pergunta qualitativa nominal. A revisão o devolve e o frontend envia explicitamente.
Se omitido, mantém a configuração persistida; uma combinação incompatível retorna
400, `IMPORT_MULTIPLE_TYPE_INVALID`.

Retorna a revisão atualizada. Remove conversões e problemas anteriores para
permitir nova confirmação. Não altera cabeçalhos nem valores brutos.
Uma importação já confirmada retorna 409, `IMPORT_ALREADY_CONFIRMED`.

### POST /api/importacoes/:id/confirmar

Sem corpo. Normaliza as perguntas conforme a revisão e retorna o objeto com
`status: "confirmada"`. Repetir a chamada em uma importação confirmada retorna
a revisão existente, sem duplicar dados.

Ausências viram null nos campos tratados; zero permanece válido. Textos
categóricos de resposta única recebem somente trim; Sim/Não não viram booleanos.
Em respostas múltiplas, cada alternativa recebe trim e repetições da mesma célula
são removidas no valor tratado, conservando valorBruto.
Números não aceitam unidades nem separadores de milhar e não são arredondados.
Categorias nominais são livres; categorias ordinais devem pertencer à lista
confirmada. Metadados mantêm seu valor bruto, sem conversão de data ou fuso.

Quando houver conversões incompatíveis, retorna 422, `IMPORT_VALUES_INVALID`.
A importação continua em revisão; consulte GET para ver os problemas, cada um
com `linha`, `colunaId`, `valorBruto` e `mensagem`.
Esses problemas são gravados antes da resposta de erro.

Outros códigos principais:

| Código | HTTP | Situação |
| :--- | :---: | :--- |
| IMPORT_FILE_REQUIRED | 400 | Arquivo não enviado |
| IMPORT_FORMAT_INVALID | 400 | Extensão não aceita |
| IMPORT_CSV_INVALID / IMPORT_FILE_INVALID | 400 | Arquivo não pode ser lido |
| IMPORT_EMPTY | 400 | Sem cabeçalho ou sem respostas |
| IMPORT_QUESTION_LIMIT | 400 | Seleção fora de 1 a 30 perguntas |
| IMPORT_TYPE_REQUIRED / IMPORT_CATEGORIES_REQUIRED | 400 | Configuração incompleta |
| IMPORT_COLUMNS_INVALID | 400 | Colunas incompatíveis com a origem |
| IMPORT_NOT_FOUND | 404 | Importação inexistente |
| IMPORT_FILE_LIMIT / FST_REQ_FILE_TOO_LARGE | 413 | Arquivo acima de 10 MB |
| IMPORT_ROW_LIMIT | 413 | Mais de 10.000 respostas |

Falhas de schema JSON e multipart também recebem o envelope padrão.
As rotas não realizam análises temáticas nem corrigem respostas livres.

## Pesquisa atual

### GET /api/pesquisas/atual

Consulta a importação confirmada mais recentemente por `atualizado_em`
(ISO com milissegundos nas novas confirmações), com desempate pelo ID.
Importações em revisão não aparecem. Sem pesquisa confirmada, retorna
404, `PESQUISA_NOT_FOUND`.

```json
{
  "data": {
    "id": "uuid-da-importacao",
    "nome": "pesquisa tecnologia",
    "nomeArquivoOriginal": "pesquisa_tecnologia.xlsx",
    "totalRespostas": 1000,
    "totalPerguntas": 25
  }
}
```

O nome exibido deriva do nome do arquivo sem extensão, substituindo underscore
e hífen por espaços. Os totais vêm do SQLite e não incluem metadados como perguntas.

### DELETE /api/pesquisas/atual

Após confirmação na interface, exclui a pesquisa atual em uma transação,
incluindo suas colunas, participantes, respostas e problemas por cascata.
Retorna `{ data: { cleared: true } }`, inclusive se a base já estiver vazia.
Outras importações são preservadas; se houver outra confirmada, ela passa a
ser a atual. Falha usa `PESQUISA_CLEAR_FAILED`.

## Perguntas e respostas

- `GET /api/pesquisas/:pesquisaId/perguntas`: lista perguntas de uma importação
  confirmada, na posição original. Cada item tem `id`, `codigo`,
  `enunciado`, `tipoVariavel` e `categorias`.
- `GET /api/pesquisas/:pesquisaId/perguntas/:perguntaId?pagina=1`: devolve os
  mesmos metadados, totais `totalRespostas`, `respostasValidas`,
  `respostasAusentes`, `pagina`, `tamanhoPagina: 100` e `respostas`.
  Cada resposta contém `participanteId`, `linha`, `valorBruto`,
  `valorNumerico` e `valorCategoria`, ordenada pelo registro original.

A pergunta precisa pertencer à pesquisa informada. Pesquisa não confirmada
retorna 409, `IMPORT_NOT_CONFIRMED`; pergunta inexistente retorna
404, `QUESTION_NOT_FOUND`. As análises são consultadas no endpoint de dashboard.

## Dashboard e análises

### GET /api/pesquisas/:pesquisaId/dashboard

Aceita o UUID de uma importação confirmada ou `atual` para a última confirmada.
Retorna `{ data: { pesquisa, perguntas } }`. Não utiliza mocks.

`pesquisa` contém `id`, `nome`, `nomeArquivoOriginal`, `importadoEm` (data
da confirmação), `totalRespostas`, `totalPerguntas`, `totalAusencias`,
`percentualAusencias` e `distribuicaoTipos`. Cada tipo contém `label`,
`value` (quantidade de perguntas) e `percentual`.

Cada pergunta contém:

- `id`, `codigo`, `enunciado`, `tipoVariavel`, `tipo`, `categoria`;
- `totalRespostas`, `respostasValidas`, `respostasAusentes`, `percentualAusentes`;
- `respostasMultiplas` e `totalMarcacoes`: distinguem participantes e marcações;
- `medidas`: somente campos aplicáveis e com observações. Média e quartis são
  números; mediana é número, categoria ou par de categorias centrais ordinais;
  moda é um array com todos os valores modais, vazio quando amodal;
- `distribuicao`: `classe`, `dados`, `fi`, `fiAcumulada`, `fr`,
  `frAcumulada`, `frPercentual`, `frPercentualAcumulada`;
- classes quantitativas incluem `valor`, usado como coordenada dos pontos:
  o próprio número nas discretas e o ponto médio calculado no backend nas contínuas;
- classes contínuas também contêm `histograma` com `limiteInferior`,
  `limiteSuperior` e `densidade` absoluta;
- `graficos` permitidos, `graficoRecomendado` e, nas numéricas válidas, `boxplot`
  com `minimo`, `primeiroQuartil`, `mediana`, `terceiroQuartil`, `maximo`.

Frequências relativas de cada alternativa ficam entre 0 e 1; campos percentuais
de cada alternativa, entre 0 e 100. Nas respostas múltiplas, a soma dos percentuais
pode superar 100%; a base é respostasValidas, contada por participante, e as
alternativas repetidas na mesma célula contam uma vez. O total de escolhas está
em totalMarcacoes. Os campos acumulados são null, graficos contém somente Barras,
e medidas.moda contém todas as alternativas mais selecionadas.
Sem observações válidas, `medidas` é vazio, boxplot é omitido e frequências são
zero. Null não participa dos cálculos; zero participa. Os valores numéricos não
são arredondados para apresentação na API. As convenções matemáticas estão em
[business-rules.md](./business-rules.md).

Pesquisa inexistente usa 404 `IMPORT_NOT_FOUND`; alias atual sem pesquisa usa
404 `PESQUISA_NOT_FOUND`. Pesquisa em revisão usa 409 `IMPORT_NOT_CONFIRMED`.
Consultar uma pesquisa anterior não muda a pesquisa atual.

## Exportação dos dados persistidos

`GET /api/exportacoes/dados?format=xlsx&scope=all`

| Parâmetro | Valores | Obrigatório |
| :--- | :--- | :--- |
| format | xlsx ou csv | sim |
| scope | all ou question | sim |
| questionId | UUID da pergunta ou código Q01 etc. da pesquisa selecionada | no escopo question |
| pesquisaId | UUID da importação confirmada; omitido usa a pesquisa atual | não |

- O dashboard envia pesquisaId para exportar a mesma pesquisa exibida, mesmo
  quando outra importação tiver sido confirmada depois. UUID inexistente retorna
  404; importação em revisão retorna 409. Perguntas de outra pesquisa são recusadas.
- XLSX completo preserva a ordem de todas as colunas e os valores brutos,
  inclusive metadados e colunas não selecionadas para análise.
- XLSX/CSV de uma pergunta contém `ID da resposta` (UUID do participante)
  e a coluna original da pergunta.
- CSV completo é recusado com `EXPORT_SCOPE_UNAVAILABLE`.
- CSV usa UTF-8 com BOM, ponto e vírgula e escape de aspas.
- Valores são exportados a partir de `valor_bruto`, como texto, preservando
  zeros iniciais. Ausências ficam vazias. Excel não restaura automaticamente
  a formatação ou o tipo de célula do arquivo original.
- Não existe fallback para mocks. Sem pesquisa confirmada, retorna 404.
