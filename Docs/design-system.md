# Design system do frontend

Esta documentação descreve a base visual reutilizável do UNIFAN Analytics. O
catálogo interativo está disponível na rota `/components` da aplicação frontend.

## Direção visual

- Tema claro baseado em creme, papel, terracota e grafite; tema escuro com
  preto, cinzas, azul vivo (`#0874f9`) e azul-marinho profundo (`#050b18`).
- Tipografia serifada para títulos e números de destaque; fonte sem serifa para
  leitura, rótulos e controles.
- Bordas suaves, sombras discretas e estados de interação claramente visíveis.
- Componentes responsivos e com atributos de acessibilidade pertinentes.

Os tokens estão declarados em `Frontend/src/index.css` por meio do tema do
Tailwind CSS.

## Tema escuro e preferência do usuário

O `ThemeProvider` escolhe o tema inicial nesta ordem:

1. valor `light` ou `dark` salvo em `localStorage` sob a chave `unifan-theme`;
2. preferência do sistema informada por `prefers-color-scheme`.

Enquanto não houver escolha manual, mudanças na preferência do sistema também
atualizam a aplicação. Ao usar o botão fixo no canto superior direito, a escolha
é persistida e passa a prevalecer. O provider escreve `data-theme` no elemento
`html`; `Frontend/src/index.css` redefine os mesmos tokens de cor e sombra para
o tema escuro. Assim, classes como `bg-paper`, `text-ink` e `border-line`
continuam iguais nos componentes, mas resolvem para outra paleta globalmente.

A cena da página inicial acompanha o contexto de tema. No modo escuro, o fundo e
as ondas usam preto, azul e partículas azul-claras. As coroas e faíscas iniciadas
por clique são brancas nos dois temas.

## Carregamentos da V5

O atraso demonstrativo é `2000 ms` e fica em
`Frontend/src/services/api.ts`. Ele permanece intencionalmente no projeto para
inspeção visual.

- a importação bloqueia e escurece a tela, apresenta spinner e alterna as
  mensagens a cada 3 segundos;
- visão geral, catálogo e análise individual usam skeletons que preservam a
  estrutura aproximada do conteúdo final durante trocas de rota;
- o skeleton respeita `prefers-reduced-motion`, removendo o brilho animado;
- a limpeza da pesquisa usa o estado de carregamento do botão dentro do modal e
  mantém qualquer erro da API visível para nova tentativa.

Na V5, `Enviar outra planilha` não navega imediatamente. O item abre uma
confirmação; ao aceitar, o frontend chama `DELETE /api/pesquisas/atual` e só
então segue para `/import`.

## Animações e exportação da V6

A Home revela a cena 3D com um fade de 900 ms. Somente depois dessa etapa o
bloco introdutório aparece em 700 ms, combinando fade com subida de 24 px. Uma
salvaguarda libera o conteúdo após 1.800 ms caso o Canvas não sinalize prontidão.
Com `prefers-reduced-motion`, cena e conteúdo assumem o estado final sem
transição. A câmera mais fechada evita que as bordas da malha entrem no quadro.

O item `Exportar` da `DashboardSidebar` abre `ExportDialog`, renderizado em
portal. O modal oferece PDF, JPEG, XLSX e CSV e altera os controles conforme o
formato:

- PDF: tela atual ou dashboard completo;
- JPEG: somente tela atual;
- XLSX: pesquisa completa ou pergunta específica;
- CSV: pergunta específica, com o seletor de escopo bloqueado;
- ao exportar uma pergunta, o seletor inicia na pergunta aberta, quando houver.

`Frontend/src/services/exportacoes.ts` captura os conteúdos visuais com
`html-to-image` e monta PDFs A4 com `jsPDF`. Durante a captura, transições,
animações e cursor de texto são desativados para produzir uma imagem estável; os
gráficos são fixados no último quadro da animação para preservar linhas, pontos e
revelações circulares. A tela atual é centralizada e ajustada em uma única folha,
cujo fundo recebe a cor do canvas do tema.

O dashboard completo é montado fora da área visível por
`Frontend/src/feats/home/report-pages.tsx`: uma capa usa o nome original recebido
por `GET /api/pesquisas/atual`, seguida por uma página A4 fixa para cada pergunta.
O modal oferece uma predefinição global e seletores por pergunta limitados aos
gráficos compatíveis. As páginas são capturadas sequencialmente, com progresso
visível, e reunidas no mesmo PDF. Os formatos de dados chamam
`GET /api/exportacoes/dados`; a regra de seleção das
colunas e a geração do arquivo permanecem no backend. O atraso mockado de 2
segundos também é aplicado à chamada de dados para manter o estado de loading
visível durante o desenvolvimento.

## Componentes disponíveis

O índice `Frontend/src/components/index.ts` exporta:

- `Button`: variantes de ação, tamanhos, largura total e carregamento;
- `ThemeToggle`: controle global fixo para alternar os temas claro e escuro;
- `Skeleton`: placeholders animados nas variantes de texto e card;
- `ConfirmationDialog`: confirmação modal acessível para ações destrutivas;
- `ImportLoadingOverlay`: bloqueio visual da importação com spinner e mensagens;
- `Text`: hierarquia tipográfica e tons semânticos;
- `Card`: superfícies elevada, contornada, tonal e interativa;
- `Badge`: indicadores neutro, de marca e semânticos;
- `TextField`: campo com rótulo, ajuda, erro e ícone;
- `Tag`: marcador com ponto colorido nas variantes `chart` e `grid`; a variante
  de grade pode abrir um seletor nativo para edição;
- `ChartBar`: barras horizontais ou verticais, com animação alinhada à orientação;
- `CartesianChart`: colunas, barras, histograma e linha com eixos, escala,
  tooltips e linhas-guia nas coordenadas do item ativo;
- `BoxplotChart`: resumo de cinco números com eixos, tooltips e montagem animada;
- `DataTableSurface`: superfície, recorte, rolagem e área de paginação
  compartilhados pelas grades e tabelas;
- `ChartPoint`: marca circular independente para gráficos de pontos ou linhas;
- `ChartSector`: setor SVG independente para gráficos circulares;
- `DonutChart`: composição de setores, legenda, total central e tooltips;
- `PieChart`: gráfico circular preenchido, com legenda e seleção persistente;
- `Tooltip`: conteúdo flutuante associável a qualquer elemento HTML ou SVG;
- `MetricCard`: apresentação compacta de indicadores;
- `NavigationItem`: item padronizado de navegação lateral;
- `DashboardSidebar`: navegação completa do dashboard nos estados expandido e
  recolhido;
- `QuestionFilters`: busca e filtros sobrepostos de tipo e categoria;
- `Stepper`: indicação de progresso entre etapas.
- `QuestionsGrid`: grade editável própria para revisar as perguntas importadas,
  seus tipos e suas categorias estatísticas.

## Tags de dados

A variante `chart` apresenta o valor como um marcador compacto de legenda. A
variante `grid` ocupa a célula disponível e, quando recebe opções e um callback,
usa um `select` nativo sobre toda a área clicável. As duas variantes aceitam as
cores `red`, `orange`, `yellow`, `l-green`, `d-green`, `blue` e `muted`.

Na configuração das perguntas, as cores representam os valores atuais:

| Valor        | Cor          |
| :----------- | :----------- |
| Quantitativa | Vermelho     |
| Qualitativa  | Verde claro  |
| Discreta     | Laranja      |
| Contínua     | Amarelo      |
| Nominal      | Azul         |
| Ordinal      | Verde escuro |

## Grades de dados

A `QuestionsGrid` implementa somente os recursos necessários à revisão das
perguntas, sem depender de uma biblioteca de grade. Ela oferece edição por tags,
ordenação crescente e decrescente por coluna, paginação opcional e estado vazio.
A API também permite controlar a quantidade de itens por página, página inicial
ou controlada, densidade, separadores verticais, linhas alternadas, destaque no
hover, cabeçalho fixo ou oculto, alinhamento e largura de cada coluna, classes por
célula e por linha, além de ordenação controlada ou interna. A navegação fica
absoluta no canto inferior direito da própria grade, no formato `< 1/2 >`, sem
fundo ou contorno. O conjunto tem baixa opacidade em repouso, enquanto os
chevrons recebem destaque no hover e a opacidade também aumenta com hover ou
foco.

A primeira grade está na etapa `Configurar` da importação. Enquanto a API de
importação não estiver integrada, ela recebe linhas mockadas. As colunas `Tipo` e
`Categoria` podem ser editadas. Ao trocar o tipo, uma categoria incompatível é
substituída pela primeira categoria válida do novo tipo.

A busca da etapa usa um atraso de 300 ms, ignora diferenças de caixa e acentos e
consulta código, pergunta, tipo e categoria. O botão de filtros permite combinar
tipo e categoria com a busca textual.

## Entrada de dados na importação

A primeira etapa aceita a seleção local de arquivos `.csv`, `.xls` e `.xlsx` por
clique ou arrastar e soltar. O arquivo escolhido permanece somente no estado do
frontend até a integração da API. CSV usa o token roxo e arquivos Excel usam o
tom semântico positivo. Durante o arraste de um arquivo sobre a página, o restante
da interface escurece e a área de importação recebe brilho e destaque animados,
respeitando a preferência de redução de movimento.

O campo do Google Sheets mantém o link em estado controlado e possui um botão
`Buscar`. O envio do formulário apenas evita a navegação do navegador; a futura
chamada de validação deverá ser conectada nesse manipulador quando o endpoint
estiver disponível.

## Dashboard de perguntas

O dashboard usa `/home/:pesquisaId` para a visão geral,
`/home/:pesquisaId/perguntas` para o catálogo e
`/home/:pesquisaId/perguntas/:perguntaId` para a análise individual. Enquanto a
API não estiver integrada, as telas consomem os dados demonstrativos de
`Frontend/src/feats/home/dashboard-data.ts`.

A visão geral apresenta os totais de respostas, perguntas e ausências, um
gráfico de rosca com as quatro categorias de variável e a lista de perguntas com
dados ausentes. A rosca fica centralizada e usa uma legenda abaixo dos setores.
O catálogo combina busca e um popover de filtros por tipo e categoria, sem
deslocar os cards quando é aberto. Em cada card, tipo e categoria aparecem lado
a lado com o mesmo componente `Tag` usado nas grades, e o enunciado ocupa o
centro do espaço entre os metadados.

A `DashboardSidebar` permanece disponível nas três telas. No desktop, pode ser
recolhida até a faixa de ícones e guarda essa preferência no navegador. Em telas
menores, transforma-se em um painel aberto pelo cabeçalho. `Exportar` abre o
modal configurável da V6 e `Enviar outra planilha` pede confirmação, limpa a
pesquisa pela API e então retorna à importação.

Cada análise apresenta somente as medidas e visualizações compatíveis com o tipo
da variável. A visualização `Pizza` usa o `PieChart`; o `DonutChart` permanece na
visão geral. Colunas, barras, histograma, pontos e boxplot usam uma área
cartesiana com eixos, rótulos e escala de intervalos agradáveis. O hover e o foco
de teclado mostram o valor e uma linha-guia pontilhada apenas no eixo numérico.
Os rótulos das categorias permanecem horizontais e alinhados às marcas. O
gráfico de pontos desenha a linha progressivamente ao ser aberto e revela as
marcas em sequência; `prefers-reduced-motion` remove essa animação.

As marcas gráficas usam três níveis visuais: base clara, hover intermediário e
seleção forte. O clique fixa tooltip e seleção; outro item transfere a seleção,
enquanto clique externo ou `Escape` limpa o estado. Uma seleção fixada continua
visível quando outro item recebe hover ou foco, permitindo dois tooltips
simultâneos. Barras verticais têm somente os cantos superiores arredondados,
barras horizontais somente a extremidade de valor, e os eixos são desenhados
acima das bases.

Na V4, a seleção tem prioridade sobre hover e foco, sem contorno preto ao
clicar. A navegação por teclado conserva um indicador na paleta do projeto.
As barras usam sua própria geometria como referência da transformação, mantendo
a base presa ao eixo durante todos os quadros da animação.

O `BoxplotChart` recebe os cinco valores, o rótulo do eixo e a descrição acessível.
Sua entrada dura 1.250 ms: mínimo (180 ms), extensão até o máximo (470 ms),
máximo (180 ms) e projeção vertical da caixa com a mediana (420 ms).
O `PieChart` revela o círculo no sentido horário em 900 ms com uma máscara SVG,
sem alterar as proporções dos setores. Gráfico e legenda formam um conjunto
centralizado e responsivo, com fonte de 12 px e marcadores menores na legenda.
As duas animações acontecem na abertura, não se repetem ao selecionar um valor
e mostram o resultado completo imediatamente com `prefers-reduced-motion`.
O catálogo usa os mesmos componentes do dashboard.

Arquivos da V4:

- `Frontend/src/components/data-display/`: `cartesian-chart.tsx`,
  `boxplot-chart.tsx`, `pie-chart.tsx`, `donut-chart.tsx`, `chart-sector.tsx` e
  `chart-point.tsx`;
- `Frontend/src/components/index.ts`, `Frontend/src/index.css`,
  `Frontend/src/feats/home/question-charts.tsx` e
  `Frontend/src/pages/components-page.tsx`;
- `Docs/design-system.md`, `Docs/business-rules.md` e `Docs/decisions.md`.

Nenhuma dependência foi adicionada. A validação inclui lint, build e conferência
no navegador das origens das barras durante o crescimento, seleção por clique,
teclado e `Escape`, sequência do boxplot, abertura da pizza e catálogo. A pizza
também foi conferida em viewport de 390 px, sem overflow horizontal da página.
O build conserva o aviso anterior de tamanho do pacote da cena decorativa.

A `QuestionsGrid` e a distribuição compartilham `DataTableSurface`, mantendo
borda, recorte e comportamento de superfície consistentes. A distribuição de
frequências usa uma tabela fixa de oito colunas a partir do
breakpoint `lg`. Em larguras menores, cada classe vira um card com os seis valores
de frequência, evitando rolagem horizontal. Os títulos das abreviações usam
tooltips com suas definições. As regras estatísticas e o formato esperado dos
dados estão em [business-rules.md](./business-rules.md).

## Variantes e composição de classes

As variantes são declaradas com `class-variance-authority`. O helper `cn`, em
`Frontend/src/lib/cn.ts`, combina `clsx` e `tailwind-merge`, permitindo acrescentar
classes no uso do componente e resolver conflitos de utilitários do Tailwind.

## Associação opcional de tooltips

As marcas gráficas não importam nem conhecem o componente `Tooltip`. A associação
é feita externamente pela tela, usando as propriedades de gatilho fornecidas pelo
tooltip:

```tsx
<Tooltip<HTMLDivElement> content="Detalhes da categoria">
  {(triggerProps) => (
    <ChartBar label="Computação" value={72} barProps={triggerProps} />
  )}
</Tooltip>
```

Sem essa composição, `ChartBar`, `ChartPoint` e `ChartSector` continuam funcionando
normalmente. O tooltip responde a hover e foco de teclado, fecha com `Escape` ou
quando o elemento perde o foco e inverte sua posição quando estiver próximo à
borda da janela.

As barras usam uma animação `ease-out` de 500 ms alinhada à sua orientação: as
horizontais são preenchidas da esquerda para a direita e as verticais crescem da
base para o topo. Usuários que solicitam redução de movimento recebem a versão
sem animação.

## Catálogo

Durante o desenvolvimento, execute `npm run dev` dentro de `Frontend` e acesse
`http://localhost:5173/components`. A página contém busca e exemplos interativos
dos estados e variantes disponíveis.

## Fundo interativo da Home

A cena em `Frontend/src/feats/home/hero-scene.tsx` interpreta a referência visual
como uma membrana acetinada com partículas claras, cristas largas e vales
arredondados. A imagem não permite identificar o material original nem sua
velocidade: os valores abaixo são escolhas de implementação, não medições da
referência. A cena é decorativa e não representa resultados da pesquisa.

- Superfície contínua com `MeshPhysicalMaterial`: `roughness=0.88`,
  `metalness=0`, `sheen=0.55`, `sheenRoughness=0.85` e
  `specularIntensity=0.25`, renderizando somente a frente (`FrontSide`).
  Não há transmissão, clearcoat ou bloom.
- A superfície usa o terracota alaranjado `brand-500` (`#c56e32`); o brilho
  acetinado usa `brand-50` (`#fff3e8`) e as partículas, `brand-100` (`#f8dfca`).
  São os mesmos valores sRGB dos tokens em `Frontend/src/index.css`, conferidos
  pelo teste das ondas. Fundo, névoa, iluminação e acabamento foram mantidos.
- Partículas em `PointsMaterial`, creme, atualmente com máscara uniforme quadrada,
  variação determinística de luminosidade, opacidade `0.72` e tamanho `0.034`
  (`0.048` em telas estreitas). O depth test preserva a oclusão dos vales pelas
  cristas; apenas as partículas deixam de escrever no depth buffer.
- Superfície e partículas têm geometrias independentes, mas compartilham as
  fórmulas de deformação e os uniforms dos shaders. As partículas não possuem
  índices, desenhando cada ponto uma única vez, com deslocamento local de `0.025`
  para reduzir conflito de profundidade. Suas posições têm pequena irregularidade
  fixa para suavizar a aparência de grade.
- Câmera em `[0, 3, 7.35]`, olhando para `[0, -0.45, -4.35]`, com `fov=32`.
  O enquadramento mais fechado mantém a malha além das bordas visíveis. Em
  larguras menores que
  640 px, câmera e alvo se deslocam `2.1` unidades no eixo X para manter a crista
  direita no enquadramento.
- Fundo e névoa usam `#fae8d5`; a névoa vai de 9 a 24 unidades de profundidade
  da câmera. Luz hemisférica, duas luzes direcionais e um véu visual atrás do
  conteúdo preservam o contraste dos textos.

### Forma, amplitude e interação

`Frontend/src/feats/home/wave-field.ts` concentra `WAVE_SETTINGS` e a função
pura `sampleWaveHeight`. A superfície mede 28 × 22 unidades. Combina senos com
coordenadas deformadas, uma crista gaussiana à direita, um vale central e uma
dobra no primeiro plano. A amplitude global é `1.15` e a velocidade de fase é
`0.24`; as componentes têm velocidades diferentes. Não é uma simulação física
de fluido. Em uma amostragem de 36.360 posições nos tempos 0, 10, 30 e 60 s,
as alturas locais ficaram entre aproximadamente −1,66 e +3,06 unidades,
antes da interação; esse intervalo amostrado não é um limite matemático.

O movimento procedural é a única deformação da superfície. Mover o cursor não
dobra nem atrai a malha, e clicar ou tocar cria apenas uma coroa luminosa, sem
alterar sua altura. O ponto do clique é obtido por raycasting numérico na fórmula
da superfície e convertido para coordenadas locais com `worldToLocal`.

### Coroas luminosas, colisões e faíscas

`Frontend/src/feats/home/ripple-field.ts` concentra `RIPPLE_SETTINGS`, o ciclo de
vida dos anéis, a detecção de colisões e a referência numérica do brilho. O
clique primário ou toque na superfície cria uma coroa no ponto local da
interseção. Arrastos acima de 5 px não geram anéis; o botão HTML sobreposto
continua interceptando seus próprios cliques.

- Velocidade de propagação: 3 unidades/s.
- Núcleo com largura de 0,085 unidade e halo com largura de 0,55 unidade.
- Cor base branca (`#ffffff`) nos dois temas, intensidade 3,8 e força relativa
  do halo 0,32.
- Entrada suave de 0,12 s, duração de 4,8 s, amortecimento exponencial de 0,24/s
  e desaparecimento suave nos últimos 1,15 s.
- Até 20 efeitos simultâneos. Com o conjunto cheio, cliques adicionais são
  ignorados até uma coroa ou sua rebatida terminar, evitando cortes abruptos.
- Duas coroas iniciadas em pontos separados colidem quando a soma de seus raios
  alcança a distância entre as origens. O instante e o ponto do primeiro contato
  são calculados no JavaScript, independentemente da taxa de quadros.
- No contato, as coroas circulares dão lugar a dois arcos direcionais que se
  afastam em sentidos opostos durante 1,65 s.
- Os arcos continuam sendo frentes ativas. Quando um deles encontra uma nova
  coroa criada por clique, os dois efeitos geram faíscas e passam a se afastar
  do novo ponto de contato, permitindo colisões encadeadas enquanto estiverem
  visíveis. Os participantes reutilizam seus próprios slots, sem ampliar a
  capacidade fixa da cena.
- Cada colisão dispara 14 faíscas por 0,78 s, divididas entre as duas direções da
  rebatida. As faíscas usam buffers fixos para até 20 explosões e acompanham
  a altura procedural da superfície durante sua trajetória.

O shader em `wave-materials.ts` desloca superfície e partículas apenas pelo campo
procedural, recalcula a direção de iluminação por diferenças finitas com passo
`0.025` e acrescenta as coroas e os arcos direcionais no fragment shader. As
faíscas são pontos aditivos com núcleo branco e borda creme, atualizados em um
buffer pequeno separado. Como o brilho não muda a geometria, `wave-raycast.ts`
usa somente a altura do campo procedural. As versões JS e GLSL das fórmulas
devem permanecer sincronizadas.

### Desempenho e acessibilidade

As densidades ficam em `WAVE_SETTINGS`, separando a silhueta da granulação:

| Perfil                   | Vértices da superfície | Triângulos | Partículas |
| :----------------------- | ---------------------: | ---------: | ---------: |
| Desktop                  |                 12.513 |     24.576 |     20.769 |
| Largura abaixo de 640 px |                  7.081 |     13.824 |      9.153 |

Em relação à versão GPU anterior, o desktop passa de 40.960 para 24.576 triângulos
e de 65.025 para 20.769 partículas. O DPR é 1, priorizando fluidez em vez de
resolução extra em telas de alta densidade. Materiais e enquadramento existentes
foram preservados; a granulação fica menos densa.

Não há atualização de todos os vértices nem `computeVertexNormals` na CPU por
frame. A GPU calcula alturas, normais e brilho; o JavaScript atualiza apenas o
tempo, 20 frentes reutilizadas de coroas e rebatidas e, quando há colisão, no
máximo 280 posições de faíscas. O amortecimento temporal é pré-calculado uma vez
por efeito/frame. A evolução usa tempo transcorrido, independente do número de
frames. A cena pausa fora da área visível ou com a aba oculta e desconsidera o
intervalo de pausa ao retomar.

A detecção compara no máximo 190 pares por frame. Coroas circulares usam o
instante analítico do primeiro contato; pares que incluem arcos direcionais
percorrem apenas o intervalo transcorrido desde o frame anterior, em passos de
1/90 s com refinamento local. Isso evita perder colisões em aparelhos com taxas
de quadros diferentes sem simular a malha na CPU.

O raycasting busca a primeira interseção com a fórmula em até 192 passos, com
refinamento por 12 bisseções; não percorre todos os triângulos. É uma aproximação
numérica, não uma interseção exata com os triângulos desenhados. Geometrias têm
limites de visibilidade expandidos para comportar a deformação na GPU. Geometrias,
materiais e máscara são descartados ao desmontar. `land-page.tsx` mantém a cena
em carregamento separado com `lazy`/`Suspense` e fundo creme durante a espera.

Com `prefers-reduced-motion`, esta cena mantém uma pose estática e não aplica os
impulsos de clique, colisões ou faíscas. O Canvas é decorativo (`aria-hidden`) e
tem um fundo alternativo quando WebGL não está disponível. O conteúdo HTML fica
em outra camada e sua entrada também é instantânea nessa preferência.

A propriedade `as` do componente `Text` é restrita a componentes compatíveis
com atributos HTML. Isso evita conflito de tipagem com os elementos 3D que o
React Three Fiber acrescenta ao JSX.

### Validação das ondas

Em `Frontend`, executar `npm run build`, `npm run lint` e
`node scripts/check-waves.mjs`. O script verifica equivalência da altura em
JS/GLSL em precisão dupla, propagação e amortecimento das coroas, instante e
direção das colisões, ciclo das rebatidas, trajetória das faíscas, reutilização
dos conjuntos fixos, colisões encadeadas e independência da taxa de frames.
Compara também o raycast numérico com uma malha densa deformada e confere a
injeção dos uniforms de brilho, a ausência de handlers de hover e as cores dos
materiais.

Na validação da integração, 6.724 amostras de altura, 1.200 amostras de brilho e
675 raios passaram; o maior desvio de distância do raycast foi aproximadamente
0,011 unidade. Esses testes não compilam GLSL em WebGL nem medem FPS. A inspeção
visual da integração confirmou a ordem de entrada cena → conteúdo, o enquadramento
sem bordas da malha, as coroas brancas nos dois temas, o modal em viewport
estreito e as exportações CSV, JPEG e PDF. O build mantém avisos para os chunks da
cena e dos componentes acima de 500 kB, apesar do carregamento separado.
