# Branches

As alterações devem ser feitas através de branches.
Para criar uma branch:
Com o Gitlens:

1. Encontre a branch atual selecionada ao olhar para o canto inferior
   esquerdo da janela, lá estará escrito "main".
2. Clique em "main" e serão abertas opções no input superior central do code.
3. Clique "Create new branch" ou "Criar nova branch".
4. Escreva o nome da branch e aperte enter

Sem o Gitlens:

1. Abra o terminal
2. Rode o comando "git switch -c nome-da-branch"

Os nomes das branches devem ser identicos
aos nomes dos cards respectivo à implementação atual (Ex: Vai criar uma
rota? Crie uma branch chamada Rotas-e-controllers-get por exemplo, caso
a rota seja o get)

Após alterações:
Com o Gitlens:

1. Acesse a aba Source Control, a terceira aba na lateral esquerda, abaixo da lupa
2. Nela, em Changes, estão exibidas suas alterações.
3. Passe o mouse em cima do arquivo alterado e clique no + (stage changes), ou
   caso sejam vários arquivos, passe o mouse no dropdown "Changes" e clique no + que
   aí todas as alterações serão adicionadas no stage sem precisar clicar em uma de
   cada vez
4. Após adicionar todas suas alterações, escreva o commit no input "Message"
5. Por fim, clique em Commit
6. Caso a branch não tenha sido publicada, lá em baixo na esquerda no nome da
   branch, clique no ícone de nuvem na direita dele. E caso já tenha sido publicada,
   clique no ícone de sincronização para que o commit seja de fato enviado.

Sem o Gitlens:

1. Abra o terminal
2. Digite "git add ." para adicionar as alterações no "Stage"
3. Depois digite git commit -m "nome-do-commit"
4. E pra finalizar "git push -u origin/nome-da-branch

Não fique com medo de alterar os arquivos e nem de cometer erros. A partir da
hora que você clona o repositório, todas as alterações que você fez ficam apenas
na sua cópia. A branch principal está protegida de alterações, então mesmo que
sem querer você aplique uma alteração diretamente nela, não será permitido, e caso
seja, é reversível, não se preocupe.
Para evitar confusões, sempre que você começar uma implementação nova, crie a
branch antes de qualquer coisa, e a partir daí comece seus trabalhos.

# Padronização de Commits

Commits podem ser feitos seguindo o Gitmoji pra padronizar e ser mais organizado. Provavelmente não vamos chegar a usar todos mas fica aqui a título de curiosidade e aprendizado também

## Estrutura

## Tipos e Emojis

| Tipo            | Emoji | Código               | Exemplo                              |
| :-------------- | :---- | :------------------- | :----------------------------------- |
| Novo recurso    | ✨    | `:sparkles:`         | `✨ feat: adiciona login social`     |
| Correção de bug | 🐛    | `:bug:`              | `🐛 fix: corrige erro no cálculo`    |
| Documentação    | 📚    | `:books:`            | `📚 docs: atualiza README`           |
| Refatoração     | ♻️    | `:recycle:`          | `♻️ refactor: simplifica função`     |
| Testes          | 🧪    | `:test_tube:`        | `🧪 test: adiciona testes unitários` |
| Configuração    | 🔧    | `:wrench:`           | `🔧 chore: atualiza dependências`    |
| Deploy          | 🚀    | `:rocket:`           | `🚀 deploy: versão 1.0.0`            |
| Performance     | ⚡    | `:zap:`              | `⚡ perf: otimiza consulta SQL`      |
| Estilo/Visual   | 💄    | `:lipstick:`         | `💄 style: ajusta cores do botão`    |
| Em progresso    | 🚧    | `:construction:`     | `🚧 wip: desenvolvendo API`          |
| Build           | 📦    | `:package:`          | `📦 build: atualiza webpack`         |
| CI/CD           | ✅    | `:white_check_mark:` | `✅ ci: corrige pipeline`            |
| Revert          | ⏪    | `:rewind:`           | `⏪ revert: desfaz merge`            |
