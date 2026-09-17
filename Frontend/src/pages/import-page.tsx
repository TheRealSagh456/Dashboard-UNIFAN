import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCloudUpload,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideLink,
  LucideUpload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  QuestionFilters,
  QuestionsGrid,
  Stepper,
  Text,
  TextField,
} from "../components";
import type {
  CategoriaVariavel,
  PerguntaRow,
  TipoVariavel,
} from "../components/ui/question-grid";
import { cn } from "../lib/cn";

const perguntasMockadas: PerguntaRow[] = [
  {
    id: "q01",
    codigo: "Q01",
    enunciado: "Qual é a sua idade?",
    papel: "Pergunta",
    tipo: "Quantitativa",
    categoria: "Discreta",
  },
  {
    id: "q02",
    codigo: "Q02",
    enunciado: "Quantos dispositivos eletrônicos você possui?",
    papel: "Pergunta",
    tipo: "Quantitativa",
    categoria: "Discreta",
  },
  {
    id: "q03",
    codigo: "Q03",
    enunciado: "Quantas horas por dia você usa a internet?",
    papel: "Pergunta",
    tipo: "Quantitativa",
    categoria: "Contínua",
  },
  {
    id: "q04",
    codigo: "Q04",
    enunciado: "Quantas horas por dia você passa em redes sociais?",
    papel: "Pergunta",
    tipo: "Quantitativa",
    categoria: "Contínua",
  },
  {
    id: "q11",
    codigo: "Q11",
    enunciado: "Qual é o seu gênero?",
    papel: "Pergunta",
    tipo: "Qualitativa",
    categoria: "Nominal",
  },
  {
    id: "q12",
    codigo: "Q12",
    enunciado: "Qual é a sua escolaridade?",
    papel: "Pergunta",
    tipo: "Qualitativa",
    categoria: "Ordinal",
  },
  {
    id: "q14",
    codigo: "Q14",
    enunciado: "Qual ferramenta de IA você mais utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa",
    categoria: "Nominal",
  },
  {
    id: "q15",
    codigo: "Q15",
    enunciado: "Com que frequência você utiliza ferramentas de IA?",
    papel: "Pergunta",
    tipo: "Qualitativa",
    categoria: "Ordinal",
  },
  {
    id: "q24",
    codigo: "Q24",
    enunciado: "Qual sistema operacional de celular você utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa",
    categoria: "Nominal",
  },
];

const categoriasPorTipo: Record<TipoVariavel, CategoriaVariavel[]> = {
  Quantitativa: ["Discreta", "Contínua"],
  Qualitativa: ["Nominal", "Ordinal"],
};

function normalizarBusca(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function obterExtensaoArquivo(file: File) {
  return file.name.split(".").pop()?.toLocaleLowerCase("pt-BR") ?? "";
}

function formatarTamanhoArquivo(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportPage() {
  const [etapa, setEtapa] = useState(1);
  const [perguntas, setPerguntas] = useState<PerguntaRow[]>(perguntasMockadas);
  const [busca, setBusca] = useState("");
  const [buscaComDelay, setBuscaComDelay] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoVariavel | "todos">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<
    CategoriaVariavel | "todas"
  >("todas");
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(
    null,
  );
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [linkPlanilha, setLinkPlanilha] = useState("");
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const contadorArrasteRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaComDelay(busca), 300);
    return () => window.clearTimeout(timer);
  }, [busca]);

  const categoriasDisponiveis =
    filtroTipo === "todos"
      ? (["Discreta", "Contínua", "Nominal", "Ordinal"] as const)
      : categoriasPorTipo[filtroTipo];

  const perguntasFiltradas = useMemo(() => {
    const termo = normalizarBusca(buscaComDelay);

    return perguntas.filter((item) => {
      const correspondeAoTexto =
        termo.length === 0 ||
        normalizarBusca(
          [item.codigo, item.enunciado, item.tipo, item.categoria]
            .filter(Boolean)
            .join(" "),
        ).includes(termo);
      const correspondeAoTipo =
        filtroTipo === "todos" || item.tipo === filtroTipo;
      const correspondeACategoria =
        filtroCategoria === "todas" || item.categoria === filtroCategoria;

      return correspondeAoTexto && correspondeAoTipo && correspondeACategoria;
    });
  }, [buscaComDelay, filtroCategoria, filtroTipo, perguntas]);

  function atualizarPergunta(perguntaAtualizada: PerguntaRow) {
    setPerguntas((items) =>
      items.map((item) =>
        item.id === perguntaAtualizada.id ? perguntaAtualizada : item,
      ),
    );
  }

  function alterarFiltroTipo(value: TipoVariavel | "todos") {
    setFiltroTipo(value);
    if (
      value !== "todos" &&
      filtroCategoria !== "todas" &&
      !categoriasPorTipo[value].includes(filtroCategoria)
    ) {
      setFiltroCategoria("todas");
    }
  }

  function selecionarArquivo(file: File | undefined) {
    if (!file) return;

    const extensao = obterExtensaoArquivo(file);
    if (!["csv", "xls", "xlsx"].includes(extensao)) {
      setArquivoSelecionado(null);
      setErroArquivo("Selecione um arquivo CSV, XLS ou XLSX.");
      return;
    }

    setArquivoSelecionado(file);
    setErroArquivo(null);
  }

  function iniciarArraste(event: DragEvent<HTMLElement>) {
    if (etapa !== 1 || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    contadorArrasteRef.current += 1;
    setArrastandoArquivo(true);
  }

  function continuarArraste(event: DragEvent<HTMLElement>) {
    if (etapa !== 1 || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function encerrarArraste(event: DragEvent<HTMLElement>) {
    if (etapa !== 1 || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    contadorArrasteRef.current = Math.max(0, contadorArrasteRef.current - 1);
    if (contadorArrasteRef.current === 0) setArrastandoArquivo(false);
  }

  function soltarArquivo(event: DragEvent<HTMLElement>) {
    if (etapa !== 1 || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    contadorArrasteRef.current = 0;
    setArrastandoArquivo(false);
    selecionarArquivo(event.dataTransfer.files[0]);
  }

  function buscarPlanilha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!linkPlanilha.trim()) return;
  }

  return (
    <main
      className="relative min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:py-12"
      onDragEnter={iniciarArraste}
      onDragOver={continuarArraste}
      onDragLeave={encerrarArraste}
      onDrop={soltarArquivo}
    >
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-40 bg-ink/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-200",
          arrastandoArquivo && "opacity-100",
        )}
        aria-hidden
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:gap-10">
        <Stepper
          currentStep={etapa}
          steps={["Importar", "Configurar", "Finalizar"]}
          className="mx-auto w-full max-w-3xl"
        />

        <section className="flex min-w-0 flex-col">
          {etapa === 2 && (
            <>
              <div className="mb-5 flex flex-col gap-2">
                <Text as="h1" variant="data">
                  Configure suas perguntas
                </Text>
                <Text variant="label" tone="muted" className="max-w-2xl">
                  Analise o tipo e a categoria das variáveis. Clique nas tags
                  para editar as informações quando necessário.
                </Text>
              </div>

              <QuestionFilters
                className="mb-3 ml-auto w-full sm:max-w-md"
                query={busca}
                onQueryChange={setBusca}
                typeValue={filtroTipo}
                onTypeChange={alterarFiltroTipo}
                categoryValue={filtroCategoria}
                onCategoryChange={setFiltroCategoria}
                categories={categoriasDisponiveis}
              />

              <Text variant="caption" tone="muted" className="mb-2">
                {perguntasFiltradas.length} de {perguntas.length} perguntas
              </Text>
              <QuestionsGrid
                rows={perguntasFiltradas}
                onRowChange={atualizarPergunta}
                defaultSort={{ column: "codigo", direction: "asc" }}
                itemsPerPage={8}
                size="default"
                showCellSeparators
                hoverHighlight
                ariaLabel="Perguntas importadas"
              />
            </>
          )}

          {etapa === 1 && (
            <Card className="mx-auto flex w-full max-w-3xl flex-col gap-6 overflow-visible p-6 sm:p-8">
              <div className="text-center">
                <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <LucideUpload className="size-7" />
                </span>
                <Text as="h1" variant="h2">
                  Adicionar formulário
                </Text>
                <Text
                  variant="label"
                  tone="muted"
                  className="mx-auto mt-2 max-w-xl"
                >
                  Importe as respostas em CSV ou Excel, ou informe um link do
                  Google Sheets.
                </Text>
              </div>

              <input
                ref={inputArquivoRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                aria-label="Selecionar arquivo de respostas"
                onChange={(event) => {
                  selecionarArquivo(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                className={cn(
                  "relative flex min-h-56 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-brand-200 bg-surface/45 p-6 text-center outline-none transition duration-200 hover:border-brand-500 hover:bg-brand-50/70 focus-visible:ring-3 focus-visible:ring-brand-200",
                  arrastandoArquivo &&
                    "import-drop-active z-50 border-brand-500 bg-paper",
                )}
                onClick={() => inputArquivoRef.current?.click()}
              >
                <span className="import-drop-content grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  {arquivoSelecionado ? (
                    obterExtensaoArquivo(arquivoSelecionado) === "csv" ? (
                      <LucideFileText className="size-8 text-purple-500" />
                    ) : (
                      <LucideFileSpreadsheet className="size-8 text-positive" />
                    )
                  ) : (
                    <LucideCloudUpload className="size-8" />
                  )}
                </span>
                <div className="import-drop-content min-w-0">
                  {arquivoSelecionado ? (
                    <>
                      <Text
                        as="span"
                        variant="label"
                        className={cn(
                          "block max-w-lg truncate",
                          obterExtensaoArquivo(arquivoSelecionado) === "csv"
                            ? "text-purple-500"
                            : "text-positive",
                        )}
                      >
                        {arquivoSelecionado.name}
                      </Text>
                      <Text
                        as="span"
                        variant="caption"
                        tone="muted"
                        className="mt-1 block"
                      >
                        {formatarTamanhoArquivo(arquivoSelecionado.size)} ·
                        Clique para substituir
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text as="span" variant="label" className="block">
                        Arraste e solte seu arquivo aqui
                      </Text>
                      <Text as="span" tone="muted" className="mt-1 block">
                        ou clique para selecionar
                      </Text>
                    </>
                  )}
                </div>
                <div className="import-drop-content flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-500">
                    CSV
                  </span>
                  <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-bold text-positive">
                    XLS
                  </span>
                  <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-bold text-positive">
                    XLSX
                  </span>
                </div>
              </button>
              {erroArquivo && (
                <Text role="alert" variant="caption" tone="negative">
                  {erroArquivo}
                </Text>
              )}

              <div className="flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                <Text as="span" variant="eyebrow" tone="muted">
                  ou
                </Text>
                <span className="h-px flex-1 bg-line" />
              </div>

              <form className="grid gap-2" onSubmit={buscarPlanilha}>
                <label
                  htmlFor="link-google-sheets"
                  className="text-sm font-semibold leading-5 text-ink"
                >
                  Link do Google Sheets
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <TextField
                    id="link-google-sheets"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={linkPlanilha}
                    onChange={(event) => setLinkPlanilha(event.target.value)}
                    className="h-13 text-base"
                    leadingIcon={<LucideLink className="size-5" />}
                  />
                  <Button
                    type="submit"
                    className="h-13 px-5"
                    disabled={!linkPlanilha.trim()}
                  >
                    Buscar
                  </Button>
                </div>
                <Text variant="caption" tone="muted">
                  A verificação do link será conectada em uma próxima etapa.
                </Text>
              </form>
            </Card>
          )}

          {etapa === 3 && (
            <Card className="mx-auto w-full max-w-3xl text-center">
              <LucideCheck className="mx-auto mb-3 size-9 text-positive" />
              <Text as="h1" variant="h2">
                Configuração concluída
              </Text>
              <Text tone="muted" className="mt-2">
                As perguntas estão prontas para a próxima etapa da importação.
              </Text>
            </Card>
          )}

          <div
            className={cn(
              "flex items-center justify-between gap-3 pt-6",
              etapa === 2 && "pt-5",
              etapa === 1 && "mx-auto w-full max-w-3xl",
              etapa === 3 && "mx-auto w-full max-w-3xl justify-center",
            )}
          >
            <Button
              variant="ghost"
              onClick={() => {
                if (etapa > 1) setEtapa((current) => current - 1);
                else navigate("/");
              }}
            >
              <LucideArrowLeft className="size-4" />
              Voltar
            </Button>
            <Button
              onClick={() => {
                if (etapa < 3) setEtapa((current) => current + 1);
                if (etapa === 3) navigate("/home/pesquisa-tecnologia-2026");
              }}
            >
              {etapa === 3 ? "Finalizar" : "Continuar"}
              {etapa < 3 ? (
                <LucideArrowRight className="size-4" />
              ) : (
                <LucideCheck className="size-4" />
              )}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
