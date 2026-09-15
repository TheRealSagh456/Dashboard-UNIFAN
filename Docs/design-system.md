# Design system do frontend

Esta documentação descreve a base visual reutilizável do UNIFAN Analytics. O
catálogo interativo está disponível na rota `/components` da aplicação frontend.

## Direção visual

- Paleta quente baseada em creme, papel e terracota, com grafite para texto.
- Tipografia serifada para títulos e números de destaque; fonte sem serifa para
  leitura, rótulos e controles.
- Bordas suaves, sombras discretas e estados de interação claramente visíveis.
- Componentes responsivos e com atributos de acessibilidade pertinentes.

Os tokens estão declarados em `Frontend/src/index.css` por meio do tema do
Tailwind CSS.

## Componentes disponíveis

O índice `Frontend/src/components/index.ts` exporta:

- `Button`: variantes de ação, tamanhos, largura total e carregamento;
- `Text`: hierarquia tipográfica e tons semânticos;
- `Card`: superfícies elevada, contornada, tonal e interativa;
- `Badge`: indicadores neutro, de marca e semânticos;
- `TextField`: campo com rótulo, ajuda, erro e ícone;
- `ChartBar`: barras horizontais ou verticais, com animação alinhada à orientação;
- `ChartPoint`: marca circular independente para gráficos de pontos ou linhas;
- `ChartSector`: setor SVG independente para gráficos circulares;
- `Tooltip`: conteúdo flutuante associável a qualquer elemento HTML ou SVG;
- `MetricCard`: apresentação compacta de indicadores;
- `NavigationItem`: item padronizado de navegação lateral;
- `Stepper`: indicação de progresso entre etapas.
- `QuestionsGrid`: grade editável baseada no MUI X Data Grid para revisar o papel
  das colunas importadas e o tipo estatístico das perguntas.

## Grades de dados

O MUI X Data Grid é usado nas interfaces tabulares que precisam de recursos como
edição, ordenação, filtragem, paginação e virtualização. O Tailwind CSS continua
sendo a base visual geral da aplicação; o tema do Material UI apenas aproxima as
grades dos mesmos tokens de cor, tipografia e borda.

A primeira grade está na etapa `Configurar` da importação. Enquanto a API de
importação não estiver integrada, ela recebe linhas mockadas com perguntas e
metadados. As colunas `Classificação` e `Tipo da variável` podem ser editadas. A
busca filtra código, enunciado, papel e tipo; o botão de filtro alterna entre
todas as colunas importadas e somente as classificadas como perguntas.

## Fluxo visual de importação

A rota `/import` preserva o fluxo em três etapas criado para o frontend:

1. `Importar`: seleciona por clique ou arrastar e soltar um arquivo `.csv`,
   `.xls` ou `.xlsx`, ou valida um link do Google Sheets;
2. `Configurar`: revisa os mocks de perguntas e metadados na grade editável;
3. `Finalizar`: resume a origem e as quantidades classificadas antes de retornar
   à Home.

O arquivo e o link são mantidos apenas no estado da página. A leitura efetiva,
validação do conteúdo e persistência continuam pendentes da integração com a API
de importação.

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
    <ChartBar
      label="Computação"
      value={72}
      barProps={triggerProps}
    />
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
- Câmera em `[0, 3.3, 8.8]`, olhando para `[0, -0.1, -3.2]`, com `fov=43`:
  aproximadamente 16 graus abaixo da horizontal. Em larguras menores que
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

### Coroa luminosa a partir do clique

`Frontend/src/feats/home/ripple-field.ts` concentra `RIPPLE_SETTINGS`, o ciclo de
vida dos anéis e a referência numérica do brilho. O clique primário ou toque na
superfície cria uma coroa no ponto local da interseção. Arrastos acima de 5 px não
geram anéis; o botão HTML sobreposto continua interceptando seus próprios cliques.

- Velocidade de propagação: 3 unidades/s.
- Núcleo com largura de 0,085 unidade e halo com largura de 0,55 unidade.
- Cor base `#e7a878`, intensidade 3,8 e força relativa do halo 0,32.
- Entrada suave de 0,12 s, duração de 4,8 s, amortecimento exponencial de 0,24/s
  e desaparecimento suave nos últimos 1,15 s.
- Até quatro anéis simultâneos. Com o conjunto cheio, cliques adicionais são
  ignorados até um anel terminar, evitando cortes abruptos.

O shader em `wave-materials.ts` desloca superfície e partículas apenas pelo campo
procedural, recalcula a direção de iluminação por diferenças finitas com passo
`0.025` e acrescenta os anéis no fragment shader. Como o brilho não muda a
geometria, `wave-raycast.ts` usa somente a altura do campo procedural. As versões
JS e GLSL das fórmulas devem permanecer sincronizadas.

### Desempenho e acessibilidade

As densidades ficam em `WAVE_SETTINGS`, separando a silhueta da granulação:

| Perfil | Vértices da superfície | Triângulos | Partículas |
| :--- | ---: | ---: | ---: |
| Desktop | 12.513 | 24.576 | 20.769 |
| Largura abaixo de 640 px | 7.081 | 13.824 | 9.153 |

Em relação à versão GPU anterior, o desktop passa de 40.960 para 24.576 triângulos
e de 65.025 para 20.769 partículas. O DPR é 1, priorizando fluidez em vez de
resolução extra em telas de alta densidade. Materiais e enquadramento existentes
foram preservados; a granulação fica menos densa.

Não há atualização de todos os vértices nem `computeVertexNormals` na CPU por
frame. A GPU calcula alturas, normais e brilho; o JavaScript atualiza apenas tempo
e quatro vetores reutilizados de anéis. O amortecimento temporal dos anéis é
pré-calculado uma vez por anel/frame. A evolução usa tempo transcorrido,
independente do número de frames. A cena pausa fora da área visível ou com a aba
oculta e desconsidera o intervalo de pausa ao retomar.

O raycasting busca a primeira interseção com a fórmula em até 192 passos, com
refinamento por 12 bisseções; não percorre todos os triângulos. É uma aproximação
numérica, não uma interseção exata com os triângulos desenhados. Geometrias têm
limites de visibilidade expandidos para comportar a deformação na GPU. Geometrias,
materiais e máscara são descartados ao desmontar. `land-page.tsx` mantém a cena
em carregamento separado com `lazy`/`Suspense` e fundo creme durante a espera.

Com `prefers-reduced-motion`, esta cena mantém uma pose estática e não aplica
os impulsos de clique. O Canvas é decorativo (`aria-hidden`) e tem um fundo
alternativo quando WebGL não está disponível. O conteúdo HTML fica em outra
camada. Essas garantias dizem respeito à cena; as animações Motion do conteúdo
da Home continuam como estavam nesta etapa.

A propriedade `as` do componente `Text` é restrita a componentes compatíveis
com atributos HTML. Isso evita conflito de tipagem com os elementos 3D que o
React Three Fiber acrescenta ao JSX.

### Validação das ondas

Em `Frontend`, executar `npm run build`, `npm run lint` e
`node scripts/check-waves.mjs`. O script verifica equivalência da altura em
JS/GLSL em precisão dupla, propagação e amortecimento das coroas, reutilização do
conjunto de anéis e independência da taxa de frames. Compara também o raycast
numérico com uma malha densa deformada e confere a injeção dos uniforms de brilho,
a ausência de handlers de hover e as cores dos materiais.

Na validação da integração, 6.724 amostras de altura, 1.200 amostras de brilho e
675 raios passaram; o maior desvio de distância do raycast foi aproximadamente
0,011 unidade. Esses testes não compilam GLSL em WebGL nem medem FPS. A inspeção
visual da integração confirmou a Home, a navegação para `/import`, as três etapas,
a busca, o filtro e o retorno à página inicial. O build mantém avisos para os
chunks da cena e dos componentes acima de 500 kB, apesar do carregamento separado.
