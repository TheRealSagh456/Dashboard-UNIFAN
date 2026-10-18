# Formato de Importação

Este documento define como o sistema interpreta os arquivos de respostas.
O fluxo de upload, revisão e confirmação já está implementado para CSV, XLSX e
XLS. Os contratos estão em [api.md](./api.md). As sugestões poderão ser ajustadas
quando o formulário definitivo estiver disponível, sem fixar suas perguntas.

## Arquivo de referência

A planilha `dashboard_tecnologia_pesquisa.xlsx` é um template do questionário e
contém dados de exemplo. Ela não representa a base definitiva da pesquisa.

O template possui:

- uma aba `Dados` com 25 perguntas e uma coluna auxiliar `ID`;
- uma aba `Dicionario` com enunciados, tipos e categorias planejadas;
- uma aba `Dashboard` e 25 abas de análise, de `Q01` a `Q25`;
- 50 registros de exemplo, que não definem o tamanho da amostra real.

## Formatos aceitos

O MVP aceitará arquivos nos formatos:

- `.xls`;
- `.xlsx`;
- `.csv`.

Em arquivos Excel, somente a primeira aba não vazia será importada. As demais abas
serão ignoradas. No template atual, essa aba é `Dados`.

## Estrutura tabular

- A primeira linha deve conter os cabeçalhos das colunas.
- Cada linha seguinte deve representar uma resposta ou participante.
- Cada pergunta deve ocupar uma única coluna.
- Cada célula deve conter no máximo uma resposta para a pergunta correspondente.
- Colunas como ID, data e hora, e-mail ou outro identificador poderão ser marcadas
  como metadados e não contarão no limite de 30 perguntas.
- Respostas vazias serão registradas como ausentes.

## Identificação das perguntas

Os códigos `Q01_...` a `Q25_...` organizam o template, mas não serão obrigatórios
nos arquivos importados. Uma exportação do Google Forms poderá usar o enunciado
completo como cabeçalho e incluir uma coluna de data e hora.

Após a importação, o sistema deverá criar identificadores internos estáveis para as
perguntas. O usuário revisará quais colunas são perguntas ou metadados e confirmará
o tipo de cada variável.

## Quantidade prevista

- O questionário de referência possui 25 perguntas.
- O sistema aceitará a seleção de 1 a 30 perguntas.
- Um arquivo poderá possuir mais de 30 colunas se as colunas excedentes forem
  metadados ou não forem selecionadas como perguntas.
- A interface e o backend deverão bloquear a seleção de uma 31ª pergunta.

## Tipos previstos

O template contém:

- 6 perguntas quantitativas discretas;
- 4 perguntas quantitativas contínuas;
- 9 perguntas qualitativas nominais;
- 6 perguntas qualitativas ordinais.

O dicionário completo está em [questionnaire.md](./questionnaire.md). Mesmo com um
tipo previsto, o usuário deverá confirmar ou corrigir a classificação durante a
importação.

## Respostas múltiplas

O questionário inicial não prevê caixas de seleção com múltiplas alternativas. As
perguntas qualitativas deverão gerar um único valor por participante.

Se o formulário definitivo introduzir respostas múltiplas, será necessário definir:

- como o Google Forms separa as alternativas na exportação;
- como distinguir o separador das alternativas do separador de um arquivo CSV;
- como contar cada alternativa nas frequências;
- como preservar o texto original da resposta.

## Arquivos de teste

A pasta [../Mocks/forms](../Mocks/forms) contém fixtures equivalentes em XLSX e
CSV, cada uma com 1.000 respostas sintéticas. Elas cobrem os dois formatos
principais, metadados, valores ausentes, números decimais, acentos e uma resposta
personalizada.

O formato `.xls` é testado com uma planilha BIFF8 gerada pela suíte, embora não
possua um fixture dedicado em Mocks/forms.

## Comportamento implementado

- CSV usa UTF-8 com ou sem BOM; vírgula, ponto e vírgula e TAB são detectados
  pelo parser. Aspas e quebras de linha dentro de campos são preservadas.
- XLSX/XLS usam a primeira aba não vazia. Fórmulas e células de erro nessa aba
  são recusadas; a fonte esperada é uma exportação de respostas.
- O upload salva os valores originais em revisão. A confirmação converte apenas
  as perguntas de acordo com seus tipos e a ordem escolhida para categorias ordinais.
- Cabeçalhos com espaços são apresentados com trim, mantendo o original no
  banco. Cabeçalhos repetidos não colidem porque as colunas usam UUIDs e posições.
- Colunas sem cabeçalho começam como não selecionadas, sem perder seus valores.
- Datas CSV, inclusive AM/PM e GMT, permanecem como texto. Datas Excel são
  serializadas como calendário ISO sem Z. Não se pressupõe um fuso de coleta.
- Números aceitam sinal e um separador decimal, sem unidades ou milhares.
  O decimal CSV é sugerido e pode ser corrigido na revisão. Excel usa os números
  tipados extraídos da fonte.
- Limites iniciais: 10 MB, 10.000 respostas e 1 a 30 perguntas selecionadas.
- A ausência é null no valor tratado. O texto bruto é conservado, inclusive
  espaços; zero continua válido. Linhas inteiramente vazias são ignoradas.
- O questionário e os metadados são revisáveis. A temática e as inconsistências
  específicas da amostra de desenvolvimento não geram regras especiais.

## Validações pendentes com o arquivo real

Quando as primeiras respostas forem exportadas do Google Forms, será necessário
confirmar:

- o nome e a posição das colunas auxiliares;
- os cabeçalhos produzidos pelo formulário;
- o formato de data e hora;
- a representação de números decimais;
- a representação de respostas vazias;
- as categorias efetivamente utilizadas;
- a presença de respostas livres na opção "Outro".
