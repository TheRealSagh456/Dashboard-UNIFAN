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

A única deformação interativa é a ondulação do clique/toque. Mover o cursor
não dobra nem atrai a superfície: os handlers de hover, seus uniforms e os
cálculos de influência foram removidos da CPU e da GPU. O movimento procedural
de fundo continua. O ponto do clique é obtido por raycasting numérico na fórmula
da superfície deformada e convertido para coordenadas locais com `worldToLocal`.

### Ondulação a partir do clique

`Frontend/src/feats/home/ripple-field.ts` concentra `RIPPLE_SETTINGS`, o ciclo de
vida dos impulsos e a referência numérica da ondulação. O clique primário ou toque
na superfície cria um pacote radial no ponto local da interseção. Arrastos acima
de 5 px não geram impulsos; o botão HTML sobreposto continua interceptando seus
próprios cliques.

- Velocidade de propagação: 3 unidades/s; comprimento de onda: 1,6 unidade.
- Largura do pacote: 3,2 unidades, contendo cristas e vales alternados.
- Amplitude base: 0,38; amortecimento temporal exponencial de coeficiente 0,38/s
  e atenuação espacial proporcional a `1 / sqrt(1 + 0.65 * raio)`.
- Entrada suave de 0,16 s, duração de 4,8 s e desaparecimento suave nos últimos
  0,8 s. A função é zero fora do pacote e suavizada no centro do clique.
- Até quatro impulsos simultâneos, somados linearmente: podem se reforçar ou
  cancelar parcialmente. Com o conjunto cheio, cliques adicionais são ignorados
  até um impulso terminar; nenhuma onda ativa é cortada abruptamente.

É uma aproximação analítica de ondas em uma membrana com propagação radial nas
coordenadas do plano, não uma solução completa da dinâmica de fluidos. Não há
reflexão nas bordas, transporte de massa nem interação não linear. A aparência
ondulada preexistente continua sendo um campo procedural, somado aos impulsos.

O shader em `wave-materials.ts` desloca tanto superfície quanto partículas e
recalcula a direção de iluminação por diferenças finitas, com passo `0.025`.
`wave-raycast.ts` inclui os mesmos impulsos para localizar novos cliques sobre
o relevo em movimento. As versões JS e GLSL devem permanecer sincronizadas.

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
frame. A GPU calcula alturas e normais; o JavaScript atualiza apenas tempo
e quatro vetores reutilizados de impulsos. O amortecimento temporal dos impulsos
é pré-calculado uma vez por impulso/frame. A evolução usa tempo transcorrido,
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
`node scripts/check-waves.mjs`. O script verifica equivalência das expressões
JS/GLSL em precisão dupla, propagação localizada, amortecimento, superposição,
reutilização do conjunto de impulsos e independência da taxa de frames. Compara
também o raycast numérico com uma malha densa deformada, incluindo raios da câmera
inclinada e quatro impulsos ativos. Confere a ausência de handlers/uniforms de
hover e a correspondência das cores dos materiais com os tokens da paleta.

Após remover os cenários de intensidade do hover, 20.172 amostras de fórmulas
e 675 raios passaram;
o maior desvio de distância do raycast foi aproximadamente 0,016 unidade. Esses
testes não compilam GLSL em WebGL nem medem FPS. A inspeção visual desta versão
com impulsos ficou pendente porque a ferramenta de navegador foi bloqueada por
falta de créditos do ambiente. O build mantém o aviso de chunk da cena acima de
500 kB, apesar do carregamento separado.
