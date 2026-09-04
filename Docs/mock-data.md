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

