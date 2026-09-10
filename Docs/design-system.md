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
  `specularIntensity=0.25`. Não há transmissão, clearcoat ou bloom.
- Partículas em `PointsMaterial`, creme, com máscara circular procedural,
  variação determinística de luminosidade, opacidade `0.72` e tamanho `0.034`
  (`0.048` em telas estreitas). O depth test preserva a oclusão dos vales pelas
  cristas; apenas as partículas deixam de escrever no depth buffer.
- Superfície e partículas compartilham o buffer de posições. A geometria das
  partículas não possui os índices dos triângulos, para desenhar cada ponto
  uma única vez. A posição dos pontos tem
  um deslocamento local de `0.012` para evitar conflito de profundidade. As
  subdivisões têm pequena irregularidade fixa para suavizar a aparência de grade.
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

O cursor é obtido por raycasting na superfície deformada e convertido para
coordenadas locais com `worldToLocal`. O raio de influência é `0.8` e a
depressão máxima é `0.65`. Posição e intensidade usam amortecimento exponencial;
a influência desaparece gradualmente ao sair da superfície.

### Desempenho e acessibilidade

A geometria tem 65.025 vértices no desktop e 25.665 em larguras abaixo de 640 px.
As alturas continuam sendo calculadas no JavaScript para manter o código de
aprendizagem inspecionável. Posições e normais são atualizadas até 30 vezes por
segundo, compartilhadas pelas duas passagens de desenho. O DPR fica limitado
ao intervalo de 1 a 1,5. As geometrias e a máscara são descartadas ao desmontar.
Migrar a deformação para a GPU permanece uma possibilidade de otimização.

Com `prefers-reduced-motion`, esta cena mantém uma pose estática e não aplica
a deformação pelo cursor. O Canvas é decorativo (`aria-hidden`) e tem um fundo
alternativo quando WebGL não está disponível. O conteúdo HTML fica em outra
camada. Essas garantias dizem respeito à cena; as animações Motion do conteúdo
da Home continuam como estavam nesta etapa.

A propriedade `as` do componente `Text` é restrita a componentes compatíveis
com atributos HTML. Isso evita conflito de tipagem com os elementos 3D que o
React Three Fiber acrescenta ao JSX.
