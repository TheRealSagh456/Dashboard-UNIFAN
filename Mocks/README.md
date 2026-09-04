# Mocks do Google Forms

Esta pasta contém arquivos totalmente fictícios que simulam o conteúdo recebido
após exportar as respostas do Google Forms. Nenhum dado pertence a uma pessoa real.

## Estrutura

```text
Mocks/
|-- forms/
|   |-- pesquisa-tecnologia.mock.xlsx
|   `-- pesquisa-tecnologia.mock.csv
`-- README.md
```

## Massa de dados

Os dois arquivos representam as mesmas 1.000 respostas e possuem:

- 25 colunas de perguntas;
- 3 colunas de metadados: data e hora, ID e e-mail;
- 28 colunas no total;
- números inteiros, decimais e valores zero;
- categorias nominais e ordinais;
- acentos e respostas textuais;
- uma resposta personalizada de ferramenta de IA;
- 20 células de resposta vazias;
- e-mails fictícios com o domínio reservado `.invalid`.

## Formatos

### XLSX

- uma aba chamada `Respostas ao formulário 1`;
- datas e números armazenados com tipos próprios;
- cabeçalhos completos, semelhantes aos gerados pelo Forms;
- primeira linha congelada para facilitar a inspeção manual.

### CSV

- conteúdo equivalente ao XLSX;
- codificação UTF-8 com BOM;
- delimitador `;`;
- vírgula como separador decimal;
- campos textuais entre aspas.

## Uso esperado

O frontend pode usar os arquivos para desenvolver o fluxo de seleção, upload,
progresso e mensagens de validação. O backend deve usá-los para implementar a
leitura, a normalização e os cálculos estatísticos.

Os arquivos não contêm resultados, frequências, médias, medianas, quartis ou
classes de Sturges. Essas regras pertencem à implementação e aos testes do backend.

## Observações

- XLSX e CSV devem gerar o mesmo conjunto normalizado.
- Os três metadados não devem contar no limite de 30 perguntas.
- As células vazias devem permanecer ausentes e não virar zero.
- `Sim` e `Não` são categorias textuais, não valores booleanos.
- A resposta personalizada `Perplexity` deve ser preservada.
- O formato `.xls` previsto no plano ainda não possui um mock dedicado.

