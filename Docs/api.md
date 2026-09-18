# Contratos da API

Este documento registra os contratos HTTP já expostos pelo backend. As respostas
de sucesso usam `{ data: ... }` e as falhas usam
`{ error: { message: string, code: string } }`.

## Saúde da aplicação

### `GET /health`

Confirma que o servidor está disponível.

```json
{
  "data": {
    "status": "vivinho da silva"
  }
}
```

## Pesquisa atual

### `GET /api/pesquisas/atual`

Retorna os metadados da pesquisa importada. O nome original do arquivo é
preservado no backend para que a capa do relatório completo possa derivar seu
título sem receber regras de persistência no frontend.

```json
{
  "data": {
    "id": "pesquisa-tecnologia-2026",
    "nome": "Pesquisa sobre tecnologia",
    "nomeArquivoOriginal": "pesquisa_tecnologia-2026.xlsx",
    "totalRespostas": 1000,
    "totalPerguntas": 25
  }
}
```

Quando não existe uma pesquisa atual, a rota responde `404` com o código
`PESQUISA_NOT_FOUND`. Enquanto a importação persistente não está integrada, o
serviço expõe os metadados do mock na mesma camada que mantém o estado da V5.

### `DELETE /api/pesquisas/atual`

Invalida os dados da pesquisa atual antes de o usuário importar outra planilha.
A interface deve chamar esse endpoint somente depois da confirmação explícita do
usuário e só deve navegar para `/import` após uma resposta de sucesso.

Resposta de sucesso:

```json
{
  "data": {
    "cleared": true
  }
}
```

Resposta de erro:

```json
{
  "error": {
    "message": "Não foi possível limpar os dados da pesquisa atual.",
    "code": "PESQUISA_CLEAR_FAILED"
  }
}
```

O controller delega a operação ao serviço de pesquisas. Na V5, como o repositório
ainda não possui o esquema SQLite nem a importação integrada, o serviço mantém o
estado corrente no processo do backend. Quando a persistência for implementada,
a transação de exclusão deve substituir esse estado dentro do serviço, preservando
o contrato HTTP e sem transferir lógica de banco para o frontend.

## Exportações de dados

### `GET /api/exportacoes/dados`

Gera arquivos com os dados brutos da pesquisa. A rota não calcula estatísticas e
mantém a leitura e a seleção de colunas no backend.

Query parameters:

| Parâmetro | Valores | Obrigatório |
| :--- | :--- | :--- |
| `format` | `xlsx` ou `csv` | sim |
| `scope` | `all` ou `question` | sim |
| `questionId` | `q01` a `q25` | quando `scope=question` |

Combinações disponíveis:

- `format=xlsx&scope=all`: planilha completa;
- `format=xlsx&scope=question&questionId=q01`: ID da resposta e pergunta em XLSX;
- `format=csv&scope=question&questionId=q01`: ID da resposta e pergunta em CSV.

O sucesso retorna o arquivo binário com `Content-Type` correspondente e
`Content-Disposition: attachment`. Exemplos de nomes são
`unifan-pesquisa-completa.xlsx`, `unifan-q01.xlsx` e `unifan-q01.csv`.

Parâmetros inválidos retornam status `400` e o envelope padrão, por exemplo:

```json
{
  "error": {
    "message": "A exportação CSV está disponível apenas para uma pergunta específica.",
    "code": "EXPORT_SCOPE_UNAVAILABLE"
  }
}
```

Na V6, enquanto o armazenamento SQLite da importação ainda não existe, o serviço
usa os mocks equivalentes em `Mocks/forms` como fonte bruta. A futura integração
deve trocar somente essa leitura pelo repositório da pesquisa atual, preservando
a rota, as validações e a projeção das colunas no backend.
