# Dados Mockados

Os mocks representam somente os arquivos brutos que poderão chegar do Google
Forms. Eles não antecipam nem fornecem os resultados estatísticos do backend.

## Localização

Os arquivos estão documentados em [../Mocks](../Mocks/README.md):

- `Mocks/forms/pesquisa-tecnologia.mock.xlsx`;
- `Mocks/forms/pesquisa-tecnologia.mock.csv`.

## Cenário representado

| Item | Quantidade |
| :--- | ---: |
| Respostas sintéticas | 1.000 |
| Perguntas | 25 |
| Colunas de metadados | 3 |
| Total de colunas | 28 |
| Células de resposta ausentes | 20 |

Os metadados são data e hora de envio, identificador externo e e-mail fictício.
As ausências foram incluídas deliberadamente para testar o tratamento de células
vazias em uma massa maior.

## XLSX

- primeira aba não vazia chamada `Respostas ao formulário 1`;
- primeira linha com cabeçalhos completos;
- datas, inteiros e decimais armazenados com tipos próprios;
- uma linha por participante.

## CSV

- mesmas 1.000 respostas do XLSX;
- codificação UTF-8 com BOM;
- delimitador por ponto e vírgula;
- vírgula como separador decimal;
- campos textuais entre aspas.

O parser do backend deverá interpretar CSV com uma biblioteca apropriada. Separar
as colunas com `split` não é permitido, pois o conteúdo poderá conter aspas,
vírgulas e quebras de linha.

## Uso no frontend

O frontend utilizará os arquivos para desenvolver e testar:

- seleção de arquivo;
- área de arrastar e soltar;
- indicação do formato escolhido;
- estados de carregamento;
- mensagens de sucesso e erro;
- tela de revisão das 25 perguntas e dos 3 metadados.

## Uso no backend

O backend utilizará os arquivos para aprender e implementar:

- leitura de XLSX e CSV;
- identificação da primeira aba não vazia;
- detecção do delimitador e do separador decimal;
- normalização dos valores;
- distinção entre perguntas e metadados;
- tratamento de respostas ausentes;
- classificação e análise estatística das perguntas.

Os resultados esperados dos cálculos não fazem parte dos mocks. Eles deverão ser
definidos e comprovados nos testes criados pelos responsáveis pelo backend.

## Bibliotecas recomendadas

Para o backend atual, em Node.js, TypeScript e Fastify, a recomendação é usar:

| Biblioteca | Responsabilidade | Motivo da escolha |
| :--- | :--- | :--- |
| SheetJS Community Edition (`xlsx`) | Ler arquivos Excel `.xlsx` e `.xls`. | Extrai abas, células e valores tipados, incluindo o formato legado previsto no projeto. |
| `csv-parse` | Ler arquivos `.csv`. | Permite controlar delimitador, BOM, aspas e consistência das colunas. |

O SheetJS também lê CSV. Aqui, proponho `csv-parse` para deixar explícitas as
regras do arquivo textual. As duas leituras convergem para uma matriz de valores
e usam o mesmo tratamento depois. Essa é uma recomendação para a implementação;
as dependências ainda não foram adicionadas ao backend.

Fontes: [formatos e opções de leitura do SheetJS](https://docs.sheetjs.com/docs/api/parse-options/)
e [opções do csv-parse](https://csv.js.org/parse/options/).

### Instalação e imports

Quando forem implementar, executar a partir da raiz do repositório:

```powershell
cd Backend
npm install --save-exact https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm install --save-exact csv-parse
```

A documentação oficial consultada em 08/09/2026 indica a versão `0.20.3` do
SheetJS, distribuída pelo CDN oficial. O pacote `xlsx` do registro público npm
está desatualizado, por isso o comando usa a URL. Manter o `package-lock.json`
versionado para que o grupo instale as mesmas versões com `npm ci`.
[Instalação oficial para Node.js](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).

O backend já utiliza `"type": "module"`. Os exemplos abaixo seguem esse padrão
e carregam a versão CommonJS do SheetJS com `createRequire`, que inclui o suporte
às codificações de arquivos Excel antigos. A aplicação continua usando ESM.
No `Backend/tsconfig.json`, ao implementar, substituir `"types": []` por
`"types": ["node"]`. O projeto já possui `@types/node`.

## Fluxo de leitura e tratamento

1. Receber o arquivo no backend e validar formato e limites de upload.
2. Ler Excel ou CSV e obter linhas e colunas, preservando os valores recebidos.
3. Validar cabeçalhos e estrutura; preparar uma prévia para revisão no frontend.
4. Confirmar quais colunas são perguntas ou metadados e o tipo de cada pergunta.
5. Normalizar as respostas conforme os tipos confirmados e relatar inconsistências.
6. Encaminhar os dados válidos para a análise implementada pelo grupo do backend.

O frontend envia o arquivo e apresenta a revisão. A validação definitiva pertence
ao backend. Reconhecer um valor como `number` não informa se a variável é discreta
ou contínua, nem se um número representa um código de categoria.

### Estrutura usada pelo SheetJS

| Expressão | O que representa |
| :--- | :--- |
| `XLSX.read(buffer, opcoes)` | Converte os bytes do arquivo em um workbook, que representa o arquivo Excel inteiro. |
| `workbook.SheetNames` | Lista dos nomes das abas, na ordem do arquivo. |
| `workbook.Sheets[nome]` | Objeto de uma aba. |
| `aba["D2"]` | Objeto de uma célula, quando ela existe. |
| `celula.v` | Valor armazenado, como `18` ou `"Sim"`. |
| `celula.t` | Tipo da célula: `n` para número, `s` para texto, `d` para data e `e` para erro. |
| `celula.w` | Texto formatado para exibição, quando disponível. |
| `celula.f` | Fórmula, quando presente. |
| `XLSX.utils.sheet_to_json(aba, opcoes)` | Extrai os dados da aba para arrays ou objetos JavaScript. |

Fontes: [workbook](https://docs.sheetjs.com/docs/csf/book/)
e [células](https://docs.sheetjs.com/docs/csf/cell/).

Apesar do nome `sheet_to_json`, essa função retorna uma estrutura JavaScript em
memória. Com `header: 1`, o resultado é uma matriz: `matriz[0]` contém os
cabeçalhos e `matriz[1]` contém a primeira resposta. Não cria um arquivo JSON.

Manter inicialmente uma matriz permite identificar cabeçalhos vazios ou repetidos
antes de usá-los como chaves. A tipagem TypeScript da chamada não valida o conteúdo
real do arquivo. [Extração de arrays](https://docs.sheetjs.com/docs/api/utilities/array/).

### Exemplo de leitura dos mocks

Este é um exemplo didático para um futuro módulo do backend. O caminho local
facilita experimentar os mocks; no upload, os mesmos leitores recebem o `Buffer`
obtido pela rota. O exemplo interrompe a leitura ao encontrar fórmula ou célula
de erro no Excel, para que esses casos sejam revisados.

```ts
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname } from "node:path";
import { parse } from "csv-parse/sync";

const require = createRequire(import.meta.url);
const XLSX: typeof import("xlsx") = require("xlsx");

type CelulaBruta = string | number | boolean | Date | null;
type MatrizBruta = CelulaBruta[][];

function estaVazia(valor: CelulaBruta | undefined): boolean {
  return valor == null || (typeof valor === "string" && valor.trim() === "");
}

function lerExcel(buffer: Buffer): MatrizBruta {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  for (const nome of workbook.SheetNames) {
    const aba = workbook.Sheets[nome];
    if (!aba) continue;

    for (const [endereco, celula] of Object.entries(aba)) {
      if (endereco.startsWith("!")) continue;
      if (celula.f != null || celula.t === "e") {
        throw new Error(`Revisar fórmula ou erro em ${nome}!${endereco}.`);
      }
    }

    const matriz = XLSX.utils.sheet_to_json<CelulaBruta[]>(aba, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
      range: 0,
      UTC: true,
    });

    if (matriz.some((linha) => linha.some((valor) => !estaVazia(valor)))) {
      return matriz; // Primeira aba com conteúdo; as demais são ignoradas.
    }
  }

  throw new Error("O arquivo Excel não possui uma aba com conteúdo.");
}

function lerCsv(buffer: Buffer, delimitador = ";"): MatrizBruta {
  return parse(buffer, {
    encoding: "utf8",
    bom: true,
    delimiter: delimitador,
    columns: false,
    cast: false,
    skip_empty_lines: true,
    relax_column_count: false,
  }) as string[][];
}

async function lerArquivo(caminho: string): Promise<MatrizBruta> {
  const extensao = extname(caminho).toLowerCase();
  if (![".xlsx", ".xls", ".csv"].includes(extensao)) {
    throw new Error("Formato não aceito.");
  }
  const buffer = await readFile(caminho);
  return extensao === ".csv" ? lerCsv(buffer) : lerExcel(buffer);
}

// Caminhos relativos à pasta Backend, ao executar o exemplo a partir dela.
const matriz = await lerArquivo("../Mocks/forms/pesquisa-tecnologia.mock.csv");
const [cabecalhos = [], ...registros] = matriz;

if (cabecalhos.length === 0 || cabecalhos.some(estaVazia)) {
  throw new Error("Revisar cabeçalhos: há uma coluna sem identificação.");
}
const respostas = registros.filter((linha) => linha.some((v) => !estaVazia(v)));

console.log(cabecalhos.length); // 28
console.log(respostas.length); // 1000
```

No Excel, `raw: true` preserva valores tipados, `defval: null` mantém ausências
e `blankrows: true` conserva as posições antes de filtrar linhas vazias.
`range: 0` inicia a leitura na primeira linha.
[Opções de extração](https://docs.sheetjs.com/docs/api/utilities/array/).

No CSV, `bom: true` remove o marcador de codificação do primeiro cabeçalho.
`columns: false` mantém a matriz; `cast: false` mantém os campos como texto.
`relax_column_count: false` faz o parser apontar registros com quantidade
inconsistente de campos. Aspas e quebras de linha dentro de campos são tratadas
pelo parser. [BOM](https://csv.js.org/parse/options/bom/)
e [consistência das colunas](https://csv.js.org/parse/options/relax_column_count/).

O delimitador `;` é conhecido neste mock. O `csv-parse` não escolhe automaticamente
entre `;` e `,`: o backend deve detectar o dialeto ou receber a escolha na revisão.
Uma futura detecção pode experimentar cada candidato com o parser e verificar a
consistência das colunas; se houver ambiguidade, pedir a escolha do usuário.
Não passar ambos como uma lista esperando autodetecção: isso habilita os dois
separadores simultaneamente. [Opção delimiter](https://csv.js.org/parse/options/delimiter/).

## Tratamento após a leitura

As regras abaixo são uma proposta inicial para os integrantes implementarem.
Guardar o valor original junto do valor tratado permite explicar cada correção.

| Entrada e contexto | Tratamento esperado |
| :--- | :--- |
| Célula vazia, `null` ou texto só com espaços | Registrar `null`, como resposta ausente. |
| `0` ou `"0"` em pergunta quantitativa | Preservar como número `0`. |
| `"1,5"` em pergunta contínua, com decimal `,` | Converter para `1.5`. |
| `"18"` em pergunta discreta | Converter para `18` e verificar se é inteiro. |
| `"18,5"` em pergunta discreta | Relatar inconsistência; não arredondar silenciosamente. |
| `"R0001"` ou `"00123"` em identificador textual | Preservar como texto. Zeros já perdidos na origem não são recuperados pelo parser. |
| `"Sim"`, `"Não"` ou `"Perplexity"` | Preservar o texto, com acentos e capitalização. |
| Categoria ordinal, como `"Frequentemente"` | Preservar o rótulo e associar a ordem confirmada no dicionário. |
| Número com unidade, como `"2 horas"` | Relatar inconsistência; não aceitar apenas o prefixo numérico. |

### Exemplo de conversão numérica

Esta função usa os tipos do exemplo anterior. Deve ser chamada somente para
colunas quantitativas confirmadas. O separador decimal é uma configuração do CSV,
independente do delimitador entre colunas; o mock usa vírgula decimal.

```ts
type TipoNumerico = "discreta" | "continua";
type ResultadoNumero =
  | { ok: true; valor: number | null }
  | { ok: false; erro: string };

function normalizarNumero(
  bruto: CelulaBruta | undefined,
  tipo: TipoNumerico,
  decimal: "," | "." = ",",
): ResultadoNumero {
  if (estaVazia(bruto)) return { ok: true, valor: null };

  let valor: number;
  if (typeof bruto === "number") {
    valor = bruto;
  } else if (typeof bruto === "string") {
    const texto = bruto.trim();
    const padrao = decimal === "," ? /^[+-]?\d+(,\d+)?$/ : /^[+-]?\d+(\.\d+)?$/;
    if (!padrao.test(texto)) {
      return { ok: false, erro: "Número fora do formato esperado." };
    }
    valor = Number(decimal === "," ? texto.replace(",", ".") : texto);
  } else {
    return { ok: false, erro: "Tipo de célula incompatível com número." };
  }

  if (!Number.isFinite(valor)) {
    return { ok: false, erro: "Número não finito." };
  }
  if (tipo === "discreta" && !Number.isSafeInteger(valor)) {
    return { ok: false, erro: "Esperado um inteiro dentro da precisão suportada." };
  }
  return { ok: true, valor };
}

normalizarNumero("1,5", "continua"); // { ok: true, valor: 1.5 }
normalizarNumero("", "continua");    // { ok: true, valor: null }
normalizarNumero("0", "discreta");   // { ok: true, valor: 0 }
normalizarNumero("2 horas", "continua"); // { ok: false, erro: ... }
```

O exemplo aceita números sem separador de milhar. Valores como `1.234,56` exigem
uma regra adicional de localidade; não remover pontos indiscriminadamente.
Limites como horas por dia entre 0 e 24 são validações da pergunta e devem ser
aplicados depois da conversão. Um valor inválido gera um problema de importação;
não deve virar `null`, zero ou uma linha descartada sem aviso.

### Metadados, datas e categorias

Neste mock, as três primeiras colunas são metadados. No formulário definitivo,
identificá-las pelos cabeçalhos e pela confirmação do usuário; não fixar suas
posições no importador. Contar somente as perguntas selecionadas no limite de 30.

No CSV, a data chega como texto `dd/MM/yyyy HH:mm:ss`. No Excel, `cellDates: true`
gera objetos `Date` quando a célula é reconhecida como data. O exemplo usa
`UTC: true` na extração para manter os componentes da data interpretáveis pelos
métodos `getUTC...`, independentemente do fuso do servidor. Isso não significa
que o Forms tenha enviado um instante UTC: a planilha não informa esse fuso.
Preservar os componentes de calendário, validar explicitamente o formato do CSV
e confirmar o fuso da coleta antes de converter para um instante ISO com `Z`.
Não usar `new Date("01/09/2026 08:00:00")`, cuja interpretação não é um contrato
confiável para datas brasileiras.
[Tratamento de datas no SheetJS](https://docs.sheetjs.com/docs/csf/features/dates/).

Para categorias, guardar o rótulo original e, se necessário, uma versão com
espaços externos removidos. Não converter `Sim` e `Não` em booleanos nem ordenar
categorias ordinais alfabeticamente. Usar a ordem de
[questionnaire.md](./questionnaire.md), após revisão. Categorias não previstas,
como `Perplexity`, devem continuar disponíveis para classificação.

## Organização sugerida no backend

Os caminhos abaixo são uma sugestão para a implementação futura:

```text
Backend/src/
  routes/importacao.ts                  Recebe o upload e devolve a revisão.
  services/importacao.service.ts        Coordena leitura, revisão e tratamento.
  importacao/leitores/excel.ts          Extrai a matriz do Excel com SheetJS.
  importacao/leitores/csv.ts            Extrai a matriz do CSV com csv-parse.
  importacao/normalizacao.ts           Trata valores conforme o tipo confirmado.
  importacao/validacao.ts              Verifica estrutura e regras das perguntas.
  importacao/tipos.ts                  Define os tipos internos compartilhados.
```

Uma estrutura interna possível é manter `colunas`, `respostas` e `problemas`.
Cada coluna guarda ID interno, posição original, cabeçalho original, papel
(pergunta ou metadado) e tipo confirmado. Cada resposta conserva sua posição de
origem e os valores. Cada problema informa registro, coluna, valor bruto e motivo.
Essa estrutura é uma sugestão de trabalho, não um contrato de API já aprovado.

Gerar IDs internos próprios por coluna e preservá-los durante a revisão. Não usar
somente o enunciado como chave, pois cabeçalhos iguais podem representar perguntas
diferentes. No CSV, um registro pode ocupar várias linhas físicas por causa de
quebras dentro de aspas; o índice do array não é sempre a linha do arquivo.

### Limites dos exemplos

A leitura apresentada carrega todo o arquivo em memória e usa a API síncrona do
`csv-parse`. Ela é um ponto de partida para as 1.000 respostas deste mock. Para
massas maiores, avaliar a API de streaming do CSV e processamento em worker para
evitar bloquear o servidor. Tornar a função `async` não torna o parser síncrono
não bloqueante. [API síncrona](https://csv.js.org/parse/api/sync/).

Antes de ligar o exemplo à rota, implementar os limites de tamanho e quantidade
de registros, validar o conteúdo além da extensão e transformar erros de leitura
em mensagens para o usuário. Também falta validar cabeçalhos repetidos, preparar
a revisão das colunas e consolidar o tratamento de datas. Essas responsabilidades
não são resolvidas automaticamente pelas bibliotecas.

### Ponto de retomada da verificação

Os exemplos passaram pela checagem de tipos com TypeScript 7.0.2. A leitura com
SheetJS 0.20.3 e csv-parse 7.0.2 confirmou, nos dois mocks, 1.000 respostas,
28 colunas e 20 respostas ausentes.

A comparação completa foi interrompida ao encontrar diferença na representação
da data da linha 20: ao extrair seus componentes UTC, o Excel apresentou
`01/09/2026 10:05:59`, enquanto o CSV contém `01/09/2026 10:06:00`.
Na retomada, verificar a precisão de conversão das datas e definir a normalização
para a resolução do arquivo antes de repetir a comparação integral. Os testes
seguintes de casos especiais ainda não foram concluídos nessa execução.

## Verificações mínimas da importação

- os dois formatos produzem 1.000 participantes e 25 perguntas;
- somente 25 das 28 colunas contam como perguntas;
- datas, IDs e e-mails são reconhecidos como metadados;
- números com vírgula decimal no CSV tornam-se valores numéricos;
- zeros permanecem valores válidos;
- células vazias permanecem ausentes;
- acentos e capitalização permanecem inalterados;
- a resposta personalizada `Perplexity` não é descartada;
- Q14, Q16 e Q24 são sugeridas como qualitativas nominais.

## Limites desta versão

- Não há fixture no formato `.xls`.
- Não há respostas múltiplas em uma mesma célula.
- Não há arquivo propositalmente inválido.
- O mock não define resultados estatísticos esperados.
