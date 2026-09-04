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

## Decisões pendentes

| Tema | Definição necessária | Impacto principal |
| :--- | :--- | :--- |
| Quartis | Confirmar a convenção matemática esperada. | Cálculos e testes estatísticos |
| Classes de Sturges | Definir o arredondamento dos limites das classes. | Histograma, ogivas e tabelas |
| Exportação JPEG | Confirmar se o dashboard completo precisa ser uma única imagem. | Interface e exportação |
| Limites de arquivo | Definir tamanho máximo e quantidade prática de respostas. | Validação e desempenho |
