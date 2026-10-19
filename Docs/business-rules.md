# Regras de negócio do dashboard

Este documento registra as regras funcionais do dashboard. As telas e o relatório
consomem as análises da pesquisa confirmada no SQLite, calculadas no backend.
O frontend formata os valores e desenha os gráficos.

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
- `Exportar` abre um modal de configuração sem alterar a rota atual. `Enviar
  outra planilha` volta à importação para substituir o conjunto atual após
  confirmação e limpeza pela API.

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

- Em perguntas de resposta única, o total válido é a soma das frequências
  absolutas. Em respostas múltiplas, conta os participantes que marcaram ao menos
  uma alternativa; total de marcações é informado separadamente.
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

Mediana e quartis numéricos usam interpolação linear na posição `(n - 1) × p`,
com os valores ordenados e p igual a 0,5, 0,25 ou 0,75. As medidas usam os valores
individuais, mesmo quando a distribuição é agrupada. Moda devolve todos os empates;
se todos os valores ocorrerem uma única vez e n > 1, a amostra é amodal. Uma única
resposta possui moda igual ao próprio valor. Sem respostas válidas, medidas e
boxplot são omitidos.

Categorias ordinais seguem a ordem confirmada na revisão. Para n par com duas
categorias centrais diferentes, a mediana devolve ambas, sem inventar uma média
entre rótulos. Categorias confirmadas sem observações aparecem com frequência zero.

Histogramas usam `ceil(1 + log2(n))` classes de mesma amplitude entre mínimo e
máximo, sem arredondar os limites utilizados no cálculo. Cada intervalo inclui
o limite inferior e exclui o superior; a última classe também inclui o máximo.
Uma amostra constante usa uma classe de amplitude 1, centrada no valor.
O boxplot usa mínimo, Q1, mediana, Q3 e máximo, sem remover outliers.

## Perguntas de respostas múltiplas

Cada alternativa é contada no máximo uma vez por participante. O percentual
principal usa participantes que responderam à pergunta como denominador, excluindo
ausências. Uma pessoa pode marcar várias alternativas; a soma dos percentuais
pode ultrapassar 100%. O total de marcações não é o total de participantes.

Essas perguntas usam gráfico de barras e tabela com alternativa, participantes e
percentual de participantes. Não usam pizza, pois os grupos se sobrepõem, nem
frequências acumuladas. Os acumulados da API são null. A medida apresentada é
Mais selecionadas: todas as alternativas com maior frequência, inclusive quando
há empate entre todas. Não se aplica a convenção de amodalidade das respostas
únicas a esse indicador. Média, mediana e quartis não são calculados.

A base por participantes é uma escolha entre as bases usuais de respostas
múltiplas descritas na documentação do
[IBM SPSS](https://www.ibm.com/docs/en/spss-statistics/32.0.0?topic=analysis-multiple-response-frequencies).
O sistema usa a base por participantes para responder quantas pessoas escolheram
cada opção, mantendo contagens e exportações brutas.

## Visualizações permitidas

| Categoria | Visualizações previstas na V1 |
| :--- | :--- |
| Quantitativa discreta | Colunas, pontos e boxplot |
| Quantitativa contínua | Histograma, boxplot e pontos |
| Qualitativa nominal | Barras e pizza |
| Qualitativa ordinal | Colunas e pontos |

O backend devolve os gráficos permitidos e o gráfico recomendado para
cada pergunta. O frontend não deve oferecer uma visualização incompatível.

Colunas, barras e pontos são exibidos com eixo horizontal e vertical. O eixo de
categorias informa a grandeza da pergunta, como `Idade (anos)`, e o eixo numérico
usa `Quantidade`. Histogramas usam limites numéricos no eixo horizontal e
`Densidade de frequência` no vertical. O boxplot horizontal usa somente o eixo
quantitativo, sem inventar uma segunda grandeza. As marcações numéricas usam uma
escala de intervalos arredondados da sequência 1, 2, 2,5, 5 e 10 multiplicada
por uma potência de dez, escolhida a partir dos valores recebidos. Contagens usam
marcações inteiras; densidades podem usar escalas inteiramente abaixo de 1.
Colunas, pontos, barras e histogramas acrescentam um intervalo ao limite da
escala de frequência, deixando um bloco livre além do maior valor. Por exemplo,
frequência máxima 10 e intervalo 2 produzem um eixo até 12.
O boxplot ajusta o eixo ao mínimo e máximo observados, inclusive negativos e
amostras constantes. O máximo divisor
comum não é usado porque pode gerar intervalos pouco legíveis.

No hover ou foco, o item ativo exibe tooltip e uma linha-guia pontilhada apenas
no eixo numérico. O clique fixa tooltip, linha-guia e cor selecionada. Clicar em
outro item transfere a seleção; clicar fora do gráfico ou pressionar `Escape`
limpa o estado. Enquanto uma seleção estiver fixada, o hover ou foco em outro
item exibe um segundo tooltip temporário sem ocultar o tooltip selecionado. A
interação também deve funcionar por teclado.

Barras usam três níveis da paleta: claro no estado básico, intermediário no
hover e forte na seleção. Elas têm espaçamento, contorno e base reta alinhada ao
eixo. Barras horizontais e colunas verticais têm todos os cantos retos. Os
rótulos das categorias permanecem horizontais e centralizados em relação às
respectivas barras ou marcas. Textos longos podem ocupar até três linhas. Quando
há muitos valores, somente os rótulos são espaçados; nenhuma marca ou frequência
é removida. O texto completo continua disponível no tooltip.

Nos pontos quantitativos, o eixo horizontal usa o valor numérico recebido, e não
a posição da categoria. Para classes contínuas, o backend fornece seu ponto médio.
Nos pontos ordinais, a distância entre categorias permanece uniforme. A sequência
de entrada de todos os pontos termina em aproximadamente 1,1 segundo, qualquer
que seja a quantidade de valores.

Histogramas têm barras contíguas, sem vãos ou cantos arredondados. A largura é
proporcional à amplitude de cada classe; a altura usa a densidade absoluta
`fi / amplitude`, recebida do backend. Assim, a área da barra representa a
frequência, inclusive quando os intervalos têm larguras diferentes. O tooltip
continua exibindo o intervalo, a quantidade de respostas e sua porcentagem.
O frontend não interpreta rótulos para descobrir limites nem calcula densidades.
Limites finitos, crescentes e contíguos são necessários; quando não estão
disponíveis, apresenta uma mensagem em vez de desenhar um histograma incorreto.
Os limites identificam as fronteiras das classes, sem representar categorias
independentes. A convenção de inclusão das fronteiras pertence ao backend.

O gráfico de pizza é preenchido, sem abertura central. A rosca é reservada à
visão geral dos tipos de variável. Uma categoria com 100% deve formar um círculo
completo (ou uma rosca completa na visão geral); categorias de frequência zero
não desenham setores. Mais de cinco categorias sem cor explícita recebem cores
distintas e correspondentes à legenda. Sem frequências positivas, pizza e rosca
exibem uma mensagem de ausência de dados. A caixa do boxplot tem cantos retos e mantém os cinco
valores recebidos, sem recalcular quartis ou definir um tratamento de outliers.
Ao abrir o gráfico de pontos, a linha é
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

## Exportação

- JPEG representa somente a tela atual, sem navegação lateral, cabeçalho móvel
  ou controles de troca de página, e preserva o enquadramento já aprovado.
- O PDF de tela atual ajusta o conteúdo principal a uma única página A4, sem
  corte, centralizado e com o fundo preenchido pela cor do tema visualizado.
- O dashboard completo está disponível somente em PDF. Ele começa com uma capa
  temática e segue com uma pergunta por página, na ordem do questionário. Cada
  página contém cabeçalho, medidas, gráfico e distribuição de frequências, sem
  controles interativos da aplicação.
- O título da capa é derivado do nome original da planilha: a extensão é
  removida, `_` e `-` viram espaços, espaços repetidos são condensados e a
  primeira letra do resultado é convertida para maiúscula.
- Antes de gerar o relatório completo, o usuário pode aplicar uma predefinição
  de gráficos a todas as perguntas e substituir individualmente apenas as que
  desejar. Cada seletor individual oferece somente gráficos compatíveis com a
  pergunta.
- XLSX permite exportar a pesquisa completa ou apenas uma pergunta. A pesquisa
  completa preserva as colunas e respostas da fonte importada.
- XLSX e CSV de uma pergunta contêm duas colunas: `ID da resposta` e a pergunta
  selecionada. CSV fica restrito a esse escopo para evitar um segundo formato
  redundante da pesquisa inteira.
- A seleção e geração dos arquivos de dados pertencem ao backend. O frontend
  envia formato, escopo, identificador da pesquisa e da pergunta para a API.
- PDF e JPEG são composições visuais e, por isso, são produzidos no frontend
  com o tema visualizado. Metadados como o nome original da planilha continuam
  vindo da API.
- Formato, escopo e pergunta devem ser validados novamente pelo backend; valores
  inválidos usam a estrutura de erro padrão da API.

## Contrato do backend

GET /api/pesquisas/:pesquisaId/dashboard fornece para cada pergunta:

- identificador, código, enunciado, tipo e categoria;
- unidade, quando aplicável;
- total de respostas válidas e ausentes;
- medidas estatísticas aplicáveis;
- gráficos permitidos e gráfico recomendado;
- distribuição com rótulo, frequências absolutas, relativas, acumuladas e percentuais;
- para histogramas, limites inferior e superior finitos de cada classe e sua
  densidade absoluta, calculados no backend;
- resumo de cinco números para o boxplot quando ele for permitido.

Todos os cálculos estatísticos pertencem ao backend, inclusive totais,
ausências, percentuais da visão geral e dos tooltips e frequências acumuladas
e relativas. O frontend apenas formata números e transforma valores em geometria
de tela. Não há fallback para dados demonstrativos; falhas da API mostram erro
com nova tentativa ou acesso à importação. A rota /home consulta a pesquisa atual.
