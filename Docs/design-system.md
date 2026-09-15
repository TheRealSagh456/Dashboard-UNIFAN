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
- `Tag`: marcador com ponto colorido nas variantes `chart` e `grid`; a variante
  de grade pode abrir um seletor nativo para edição;
- `ChartBar`: barras horizontais ou verticais, com animação alinhada à orientação;
- `ChartPoint`: marca circular independente para gráficos de pontos ou linhas;
- `ChartSector`: setor SVG independente para gráficos circulares;
- `Tooltip`: conteúdo flutuante associável a qualquer elemento HTML ou SVG;
- `MetricCard`: apresentação compacta de indicadores;
- `NavigationItem`: item padronizado de navegação lateral;
- `Stepper`: indicação de progresso entre etapas.
- `QuestionsGrid`: grade editável própria para revisar as perguntas importadas,
  seus tipos e suas categorias estatísticas.

## Tags de dados

A variante `chart` apresenta o valor como um marcador compacto de legenda. A
variante `grid` ocupa a célula disponível e, quando recebe opções e um callback,
usa um `select` nativo sobre toda a área clicável. As duas variantes aceitam as
cores `red`, `orange`, `yellow`, `l-green`, `d-green`, `blue` e `muted`.

Na configuração das perguntas, as cores representam os valores atuais:

| Valor | Cor |
| :--- | :--- |
| Quantitativa | Vermelho |
| Qualitativa | Verde claro |
| Discreta | Laranja |
| Contínua | Amarelo |
| Nominal | Azul |
| Ordinal | Verde escuro |

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
