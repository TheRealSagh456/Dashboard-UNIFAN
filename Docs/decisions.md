# Registro de Decisões

Este documento registra escolhas que influenciam a arquitetura, o desenvolvimento
ou a manutenção do projeto. Cada decisão deve apresentar seu contexto, a escolha
realizada e suas consequências.

## DEC-001 - Gerenciador de pacotes

- **Situação:** aceita
- **Decisão:** utilizar npm no frontend e no backend.
- **Motivo:** os dois módulos já possuem `package-lock.json`, e o npm oferece um
  fluxo simples e conhecido para instalação e execução do projeto.
- **Consequências:** os comandos oficiais da documentação usarão `npm`; os
  lockfiles do Yarn e do pnpm são considerados legados e deverão ser removidos em
  uma tarefa de organização separada.

## DEC-002 - Referência do formulário da pesquisa

- **Situação:** aceita
- **Decisão:** utilizar a planilha `dashboard_tecnologia_pesquisa.xlsx` como
  referência para a estrutura inicial do questionário.
- **Contexto:** a planilha é um template com dados de exemplo. O formulário real
  ainda será criado no Google Forms e as respostas reais serão coletadas depois.
- **Consequências:** o sistema não poderá depender dos valores de exemplo, dos
  nomes abreviados das colunas nem das abas de análise do template. A exportação
  real do Google Forms será validada quando estiver disponível.

## DEC-003 - Respostas únicas no questionário inicial

- **Situação:** aceita com base no template
- **Decisão:** considerar que cada pergunta do questionário inicial produz um
  único valor por participante.
- **Motivo:** as 25 perguntas do template possuem respostas escalares e não há
  questão modelada como caixa de seleção com múltiplas alternativas.
- **Consequências:** perguntas qualitativas deverão ser configuradas no Google
  Forms como múltipla escolha, lista suspensa ou escala de resposta única. Se uma
  caixa de seleção for adicionada depois, seu formato de importação deverá ser
  definido antes da implementação.

## DEC-004 - Classificação de variáveis sem ordem natural

- **Situação:** aceita
- **Decisão:** classificar `Q14_FerramentaIA`, `Q16_FinalidadeIA` e
  `Q24_SistemaOperacional` como variáveis qualitativas nominais.
- **Motivo:** as categorias dessas perguntas identificam grupos diferentes, mas
  não possuem uma ordem estatística natural.
- **Consequências:** o sistema poderá calcular frequências, proporções e moda para
  essas variáveis, mas não deverá calcular mediana ou quartis.

## DEC-005 - Mocks compartilhados

- **Situação:** aceita
- **Decisão:** manter na raiz do repositório uma pasta `Mocks` compartilhada entre
  frontend e backend.
- **Conteúdo:** arquivos brutos equivalentes em XLSX e CSV, com 1.000 respostas
  sintéticas no formato esperado de uma exportação do Google Forms.
- **Motivo:** permitir o desenvolvimento paralelo das duas aplicações antes da
  criação do formulário e da coleta das respostas reais.
- **Consequências:** os mocks não fornecerão resultados estatísticos. A leitura,
  normalização, análise e validação dos cálculos serão responsabilidade dos
  integrantes que desenvolverem o backend.

## DEC-006 - Base visual e variantes do frontend

- **Situação:** aceita
- **Decisão:** utilizar Tailwind CSS para estilização, `class-variance-authority`
  para declarar variantes e o conjunto `clsx` + `tailwind-merge` em um helper
  `cn` para compor classes.
- **Motivo:** manter os componentes reutilizáveis, tipados e fáceis de adaptar sem
  duplicar combinações de estilos nas telas.
- **Consequências:** os tokens visuais ficam centralizados no tema do Tailwind;
  componentes compartilhados devem expor variantes em vez de replicar classes
  localmente; o catálogo da rota `/components` documenta o comportamento atual.
  Comportamentos auxiliares, como tooltips, devem ser associados por composição,
  sem criar dependência obrigatória entre a marca gráfica e a interação.

## DEC-007 - Grades tabulares do frontend

- **Situação:** substituída pela DEC-008
- **Decisão anterior:** utilizar a versão Community do MUI X Data Grid nas
  interfaces tabulares de configuração e visualização de dados.
- **Motivo da substituição:** a grade de configuração precisa de um conjunto
  pequeno de comportamentos e de integração direta com os componentes visuais do
  projeto. O MUI e o Emotion não chegaram a ser adicionados às dependências.

## DEC-008 - Grade reutilizável de perguntas

- **Situação:** aceita
- **Decisão:** manter uma `QuestionsGrid` própria, construída com React, Tailwind
  CSS e componentes do design system.
- **Motivo:** oferecer edição por tags, ordenação e personalização visual com uma
  implementação pequena, compatível com o estilo do projeto e sem dependências
  adicionais de grade.
- **Consequências:** a grade expõe paginação, densidade, separadores,
  alinhamentos, larguras, estilos de linha e ordenação controlada ou interna. A
  virtualização só será incluída quando o volume real justificar.

## DEC-009 - Estrutura e gráficos do dashboard

- **Situação:** aceita
- **Decisão:** separar visão geral, catálogo de perguntas e análise individual;
  manter uma navegação lateral recolhível compartilhada; e usar componentes
  cartesianos próprios para colunas, barras, histograma, pontos e boxplot.
- **Motivo:** tornar a consulta mais direta, preservar contexto entre telas e
  padronizar eixos, escalas, tooltips, estados de interação e acessibilidade sem
  duplicar implementações.
- **Consequências:** a rota `/home/:pesquisaId/perguntas` concentra busca e
  filtros; a visão geral fica dedicada aos indicadores da pesquisa; novos
  gráficos devem reutilizar `CartesianChart` ou seguir sua escala agradável e
  suas linhas-guia; o gráfico de pontos anima a linha ao abrir, salvo quando há
  preferência por movimento reduzido; e todo componente novo precisa aparecer
  no catálogo `/components`.

## DEC-010 - Interação e reutilização na V3

- **Situação:** aceita
- **Decisão:** permitir seleção persistente das marcas gráficas; separar pizza e
  rosca; compartilhar busca e filtros entre importação e catálogo; e extrair uma
  superfície tabular comum sem transformar tabelas estatísticas em grades de
  edição.
- **Motivo:** melhorar a comparação dos valores, manter comportamentos iguais em
  telas diferentes e evitar que componentes com responsabilidades distintas
  recebam APIs excessivamente complexas.
- **Consequências:** tooltips fixados são limpos por clique externo ou `Escape`;
  `PieChart` atende às visualizações de perguntas e `DonutChart` à visão geral;
  `QuestionFilters` concentra o popover de tipo e categoria; `QuestionsGrid` e
  a distribuição de frequências reutilizam `DataTableSurface` e preservam suas
  regras próprias.

## DEC-011 - Animações e estados dos gráficos na V4

- **Situação:** aceita
- **Decisão:** ancorar as animações de barras na geometria das marcas, construir
  o boxplot em etapas e revelar a pizza por máscara circular SVG.
- **Motivo:** dar continuidade visual aos eixos e às medidas, sem alterar valores
  ou introduzir dependências de animação nos gráficos.
- **Consequências:** seleção prevalece sobre hover e foco; o contorno preto de
  foco é substituído por indicação na paleta para teclado; a pizza usa composição
  compacta e responsiva; o boxplot é compartilhado entre dashboard e catálogo;
  todas as novas animações respeitam a preferência por movimento reduzido.

## Decisões pendentes

| Tema | Definição necessária | Impacto principal |
| :--- | :--- | :--- |
| Quartis | Confirmar a convenção matemática esperada. | Cálculos e testes estatísticos |
| Rótulo das classes | Confirmar com o professor se a primeira coluna da distribuição será `Classe` ou `xi`. | Interface e documentação estatística |
| Acumulados nominais | Confirmar se as frequências acumuladas devem permanecer nas perguntas qualitativas nominais. | Tabela de distribuição |
| Classes de Sturges | Definir o arredondamento dos limites das classes. | Histograma, ogivas e tabelas |
| Exportação JPEG | Confirmar se o dashboard completo precisa ser uma única imagem. | Interface e exportação |
| Limites de arquivo | Definir tamanho máximo e quantidade prática de respostas. | Validação e desempenho |
