# Regras de negócio do dashboard

Este documento registra as regras funcionais usadas no
dashboard de perguntas. Os valores exibidos atualmente no frontend são dados
demonstrativos e deverão ser substituídos pelos resultados calculados pelo
backend após a integração da API.

## Navegação

- A visão geral de uma pesquisa usa a rota `/home/:pesquisaId`.
- O catálogo de perguntas usa a rota `/home/:pesquisaId/perguntas`.
- A análise de uma pergunta usa a rota
  `/home/:pesquisaId/perguntas/:perguntaId`.
- Os identificadores da pesquisa e da pergunta devem ser estáveis para permitir
  acesso direto e evitar conflitos entre importações diferentes.
- Uma pergunta é aberta com um único clique.
- A busca considera código, enunciado, tipo e categoria, ignorando caixa e
  acentos.
- A navegação lateral pode ser recolhida no desktop e aberta como painel em
  telas menores.
- `Exportar` permanece indisponível até sua implementação, enquanto `Enviar
  outra planilha` volta à importação para substituir o conjunto atual.

## Visão geral

- O total de respostas corresponde ao número de registros importados.
- O total de perguntas corresponde às colunas classificadas como perguntas.
- Dados ausentes somam as respostas `null` de todas as perguntas. A porcentagem
  usa como denominador `respostas × perguntas`.
- O gráfico de tipos distribui cada pergunta em uma única categoria: discreta,
  contínua, nominal ou ordinal.
- A lista de ausências inclui somente perguntas com pelo menos uma resposta
  ausente e permite abrir diretamente sua análise.

## Respostas consideradas

- O total de respostas válidas de uma pergunta é a soma de suas frequências
  absolutas.
- Respostas ausentes não participam das frequências relativas nem das medidas
  estatísticas.
- A quantidade de ausências deve ser exibida separadamente.
- O valor zero é uma resposta válida e não pode ser tratado como ausência.

## Medidas estatísticas

Somente medidas aplicáveis ao tipo confirmado da variável devem ser devolvidas e
exibidas. Uma medida não aplicável deve ser omitida, e não representada como zero.

| Categoria | Medidas previstas na V1 |
| :--- | :--- |
| Quantitativa discreta | Média, mediana, moda, primeiro quartil e terceiro quartil |
| Quantitativa contínua | Média, mediana, moda, primeiro quartil e terceiro quartil |
| Qualitativa nominal | Moda |
| Qualitativa ordinal | Mediana e moda |

A convenção matemática dos quartis permanece pendente de confirmação. Os
quartis demonstrativos da interface não definem o cálculo que será adotado pelo
backend.

## Visualizações permitidas

| Categoria | Visualizações previstas na V1 |
| :--- | :--- |
| Quantitativa discreta | Colunas, pontos e boxplot |
| Quantitativa contínua | Histograma, boxplot e pontos |
| Qualitativa nominal | Barras e pizza |
| Qualitativa ordinal | Colunas e pontos |

O backend deverá devolver os gráficos permitidos e o gráfico recomendado para
cada pergunta. O frontend não deve oferecer uma visualização incompatível.

Colunas, barras, histogramas, pontos e boxplots são exibidos com eixo horizontal
e vertical. O eixo de categorias informa a grandeza da pergunta, como `Idade
(anos)`, e o eixo numérico usa `Quantidade`. As marcações numéricas usam uma
escala de intervalos arredondados da sequência 1, 2, 2,5, 5 e 10 multiplicada
por uma potência de dez, escolhida a partir do maior valor. O máximo divisor
comum não é usado porque pode gerar intervalos pouco legíveis.

No hover ou foco, o item ativo exibe tooltip e uma linha-guia pontilhada apenas
no eixo numérico. O clique fixa tooltip, linha-guia e cor selecionada. Clicar em
outro item transfere a seleção; clicar fora do gráfico ou pressionar `Escape`
limpa o estado. A interação também deve funcionar por teclado.

Barras usam três níveis da paleta: claro no estado básico, intermediário no
hover e forte na seleção. Elas têm espaçamento, contorno e base reta alinhada ao
eixo. Somente os cantos que não encostam no eixo podem ser arredondados. O
histograma mantém separação visual mínima entre classes. Os rótulos das
categorias permanecem horizontais e centralizados em relação às respectivas
barras ou marcas.

O gráfico de pizza é preenchido, sem abertura central. A rosca é reservada à
visão geral dos tipos de variável. Ao abrir o gráfico de pontos, a linha é
desenhada do primeiro ao último ponto e as marcas aparecem em sequência. A
animação deve ser desativada quando o usuário preferir movimento reduzido.

Na V4, as barras crescem a partir do eixo até o valor final. A cor de seleção
prevalece sobre hover e foco; clicar não deve produzir um contorno preto.
O foco de teclado continua identificável com as cores do projeto. O boxplot
apresenta mínimo, extensão até o máximo, máximo e caixa com mediana em sequência.
A pizza tem abertura circular no sentido horário e legenda compacta. Essas
animações são apenas de entrada e também respeitam movimento reduzido.

## Distribuição de frequências

A seção de distribuição usa as seguintes colunas:

| Coluna | Definição |
| :--- | :--- |
| Classe | Número sequencial de `1` até a última faixa ou categoria |
| Dados (intervalo de classe) | Valor, categoria ou intervalo representado pela classe |
| `fi` | Frequência absoluta |
| `fi (acu)` | Frequência absoluta acumulada |
| `fr` | Frequência relativa, calculada por `fi / respostas válidas` |
| `fr (acu)` | Frequência relativa acumulada |
| `fr%` | Frequência relativa multiplicada por 100 |
| `fr% (acu)` | Frequência relativa acumulada multiplicada por 100 |

O rótulo `Classe` é provisório e poderá voltar a ser `xi` após consulta ao
professor. No código, o conceito deve permanecer como índice sequencial para que
uma eventual troca altere somente o texto exibido.

Em variáveis nominais, as colunas acumuladas seguem apenas a ordem de exibição
das categorias e não representam uma ordenação estatística natural. A manutenção
dessas colunas para variáveis nominais também deverá ser confirmada com o
professor.

Em telas largas, a distribuição deve caber na área disponível sem rolagem
horizontal. Em telas menores, cada classe é apresentada como um card responsivo.
Os títulos `fi`, `fi (acu)`, `fr`, `fr (acu)`, `fr%` e `fr% (acu)` devem expor
suas definições em tooltip no hover e no foco de teclado.

## Contrato esperado do backend

Para cada pergunta, o frontend precisará receber pelo menos:

- identificador, código, enunciado, tipo e categoria;
- unidade, quando aplicável;
- total de respostas válidas e ausentes;
- medidas estatísticas aplicáveis;
- gráficos permitidos e gráfico recomendado;
- distribuição com rótulo da classe e frequência absoluta;
- resumo de cinco números para o boxplot quando ele for permitido.

O frontend pode calcular as frequências acumuladas e relativas a partir de `fi`,
mas a responsabilidade pelo cálculo das medidas estatísticas pertence ao
backend.
