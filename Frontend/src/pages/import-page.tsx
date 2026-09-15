import {
  CheckCircle2,
  FileSpreadsheet,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCloudUpload,
  LucideFilter,
  LucideLink,
  LucideSearch,
  LucideUpload,
} from "lucide-react";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  QuestionsGrid,
  Stepper,
  Text,
  TextField,
} from "../components";
import type { PerguntaRow } from "../components/ui/question-grid";
import { muiTheme } from "../lib/mui-theme";

const perguntasMockadas: PerguntaRow[] = [
  {
    id: "meta-data-hora",
    codigo: "META-01",
    enunciado: "Data e hora de envio",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "meta-identificador",
    codigo: "META-02",
    enunciado: "Identificador externo",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "meta-email",
    codigo: "META-03",
    enunciado: "E-mail",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "q01",
    codigo: "Q01",
    enunciado: "Qual é a sua idade?",
    papel: "Pergunta",
    tipo: "Quantitativa discreta",
  },
  {
    id: "q03",
    codigo: "Q03",
    enunciado: "Quantas horas por dia você usa a internet?",
    papel: "Pergunta",
    tipo: "Quantitativa contínua",
  },
  {
    id: "q11",
    codigo: "Q11",
    enunciado: "Qual é o seu gênero?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
  {
    id: "q12",
    codigo: "Q12",
    enunciado: "Qual é a sua escolaridade?",
    papel: "Pergunta",
    tipo: "Qualitativa ordinal",
  },
  {
    id: "q14",
    codigo: "Q14",
    enunciado: "Qual ferramenta de IA você mais utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
  {
    id: "q15",
    codigo: "Q15",
    enunciado: "Com que frequência você utiliza ferramentas de IA?",
    papel: "Pergunta",
    tipo: "Qualitativa ordinal",
  },
  {
    id: "q24",
    codigo: "Q24",
    enunciado: "Qual sistema operacional de celular você utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
];

const extensoesAceitas = [".csv", ".xls", ".xlsx"];

function arquivoAceito(arquivo: File) {
  const nome = arquivo.name.toLocaleLowerCase("pt-BR");
  return extensoesAceitas.some((extensao) => nome.endsWith(extensao));
}

function linkGoogleSheetsValido(valor: string) {
  if (!valor.trim()) return false;
  try {
    const url = new URL(valor);
    return (
      url.protocol === "https:" &&
      url.hostname === "docs.google.com" &&
      url.pathname.startsWith("/spreadsheets/")
    );
  } catch {
    return false;
  }
}

export function ImportPage() {
  const [etapa, setEtapa] = useState(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string>();
  const [linkPlanilha, setLinkPlanilha] = useState("");
  const [busca, setBusca] = useState("");
  const [somentePerguntas, setSomentePerguntas] = useState(false);
  const [perguntas, setPerguntas] = useState(perguntasMockadas);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const linkValido = linkGoogleSheetsValido(linkPlanilha);
  const origemSelecionada = arquivo !== null || linkValido;
  const quantidadePerguntas = perguntas.filter(
    (pergunta) => pergunta.papel === "Pergunta",
  ).length;
  const quantidadeMetadados = perguntas.length - quantidadePerguntas;

  function selecionarArquivo(novoArquivo?: File) {
    if (!novoArquivo) return;
    if (!arquivoAceito(novoArquivo)) {
      setArquivo(null);
      setErroArquivo("Selecione um arquivo CSV, XLS ou XLSX.");
      return;
    }
    setArquivo(novoArquivo);
    setLinkPlanilha("");
    setErroArquivo(undefined);
  }

  function receberArquivo(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    selecionarArquivo(event.dataTransfer.files[0]);
  }

  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={muiTheme}>
        <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Stepper
          currentStep={etapa}
          steps={["Importar", "Configurar", "Finalizar"]}
          className="mx-auto max-w-2xl"
        />

        {etapa === 2 && (
          <section className="flex flex-col gap-4">
            <div>
              <Text variant="data">Configure suas perguntas</Text>
              <Text variant="label" tone="muted" className="mt-2">
                Revise a classificação das variáveis e edite as informações se
                necessário.
              </Text>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextField
                aria-label="Buscar pergunta"
                placeholder="Buscar pergunta..."
                className="w-full"
                leadingIcon={<LucideSearch className="size-5" />}
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
              <Button
                variant={somentePerguntas ? "secondary" : "outline"}
                size="icon"
                aria-label="Mostrar somente perguntas"
                aria-pressed={somentePerguntas}
                title="Mostrar somente perguntas"
                onClick={() => setSomentePerguntas((ativo) => !ativo)}
              >
                <LucideFilter className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </section>
        )}

        <Card className="flex w-full flex-col items-center gap-5">
          {etapa === 1 && (
            <>
              <LucideUpload className="size-12 text-brand-600" aria-hidden="true" />
              <div className="text-center">
                <Text variant="h2">Adicionar formulário</Text>
                <Text variant="label" tone="accent" className="mt-2">
                  Faça o upload de um arquivo ou cole o link do Google Sheets.
                </Text>
              </div>

              <input
                ref={inputArquivo}
                id="arquivo-pesquisa"
                className="sr-only"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(event) => selecionarArquivo(event.target.files?.[0])}
              />
              <label
                htmlFor="arquivo-pesquisa"
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border border-line p-6 text-center transition hover:border-brand-200 hover:bg-brand-50 focus-within:ring-2 focus-within:ring-brand-500"
                onDragOver={(event) => event.preventDefault()}
                onDrop={receberArquivo}
              >
                {arquivo ? (
                  <FileSpreadsheet className="size-10 text-positive" aria-hidden="true" />
                ) : (
                  <LucideCloudUpload className="size-10 text-brand-600" aria-hidden="true" />
                )}
                <div>
                  <Text variant="label">
                    {arquivo ? arquivo.name : "Arraste e solte seu arquivo aqui"}
                  </Text>
                  <Text tone="muted">
                    {arquivo ? "Clique para trocar o arquivo" : "ou clique para selecionar"}
                  </Text>
                </div>
              </label>
              {erroArquivo && (
                <Text role="alert" variant="caption" tone="negative">
                  {erroArquivo}
                </Text>
              )}

              <Text variant="eyebrow" tone="accent">
                Formatos aceitos: CSV, XLS e XLSX
              </Text>

              <div className="flex w-full flex-col gap-4 border-t border-line pt-5">
                <Text variant="label" tone="accent" className="text-center">
                  Ou cole o link do Google Sheets
                </Text>
                <TextField
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  leadingIcon={<LucideLink className="size-5" />}
                  value={linkPlanilha}
                  error={
                    linkPlanilha && !linkValido
                      ? "Informe um link válido do Google Sheets."
                      : undefined
                  }
                  onChange={(event) => {
                    setLinkPlanilha(event.target.value);
                    if (event.target.value) {
                      setArquivo(null);
                      setErroArquivo(undefined);
                      if (inputArquivo.current) inputArquivo.current.value = "";
                    }
                  }}
                />
              </div>
            </>
          )}

          {etapa === 2 && (
            <QuestionsGrid
              perguntas={perguntas}
              onPerguntasChange={setPerguntas}
              busca={busca}
              somentePerguntas={somentePerguntas}
            />
          )}

          {etapa === 3 && (
            <section className="flex w-full max-w-2xl flex-col items-center gap-5 py-6 text-center">
              <CheckCircle2 className="size-12 text-positive" aria-hidden="true" />
              <div>
                <Text variant="h2">Revisão concluída</Text>
                <Text tone="muted" className="mt-2">
                  Confira o resumo antes de finalizar a configuração da importação.
                </Text>
              </div>
              <dl className="grid w-full gap-3 rounded-xl bg-surface p-5 text-left sm:grid-cols-3">
                <div>
                  <Text as="dt" variant="caption" tone="muted">Origem</Text>
                  <Text as="dd" variant="label" className="mt-1 break-words">
                    {arquivo?.name ?? "Google Sheets"}
                  </Text>
                </div>
                <div>
                  <Text as="dt" variant="caption" tone="muted">Perguntas</Text>
                  <Text as="dd" variant="data" className="mt-1">{quantidadePerguntas}</Text>
                </div>
                <div>
                  <Text as="dt" variant="caption" tone="muted">Metadados</Text>
                  <Text as="dd" variant="data" className="mt-1">{quantidadeMetadados}</Text>
                </div>
              </dl>
              <Text variant="caption" tone="muted">
                Nesta etapa de frontend, os dados continuam mockados até a integração
                com a API de importação.
              </Text>
            </section>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (etapa > 1) setEtapa((atual) => atual - 1);
              else navigate("/");
            }}
          >
            <LucideArrowLeft aria-hidden="true" />
            Voltar
          </Button>
          <Button
            disabled={etapa === 1 && !origemSelecionada}
            onClick={() => {
              if (etapa < 3) setEtapa((atual) => atual + 1);
              else navigate("/");
            }}
          >
            {etapa === 3 ? "Finalizar" : "Continuar"}
            {etapa < 3 ? (
              <LucideArrowRight aria-hidden="true" />
            ) : (
              <LucideCheck aria-hidden="true" />
            )}
          </Button>
        </div>
          </div>
        </main>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
