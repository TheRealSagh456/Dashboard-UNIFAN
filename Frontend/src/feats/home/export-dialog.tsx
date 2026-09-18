import {
  Download,
  FileImage,
  FileSpreadsheet,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Button, Text } from "../../components";
import {
  exportCurrentVisual,
  exportDashboardPdf,
  exportData,
  type DataExportScope,
  type ExportFormat,
  type VisualExportScope,
} from "../../services/exportacoes";
import type { PerguntaDashboard, TipoGrafico } from "./dashboard-data";
import { ReportCoverPage, ReportQuestionPage } from "./report-pages";
import { formatarTituloDoArquivo } from "./report-utils";

type ExportDialogProps = {
  questions: PerguntaDashboard[];
  currentQuestionId?: string;
  currentTarget: RefObject<HTMLElement | null>;
  sourceFileName: string;
  totalResponses: number;
  onClose: () => void;
};

type GraphPreset =
  | "recommended"
  | "distribution"
  | "points"
  | "boxplot"
  | "pizza";

const selectClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60";

function isVisualFormat(format: ExportFormat): format is "jpeg" | "pdf" {
  return format === "jpeg" || format === "pdf";
}

function recommendedChart(question: PerguntaDashboard): TipoGrafico {
  if (question.categoria === "Nominal") return "Barras";
  if (question.categoria === "Contínua") return "Histograma";
  return "Colunas";
}

function chartForPreset(question: PerguntaDashboard, preset: GraphPreset) {
  const preferred: Partial<Record<GraphPreset, TipoGrafico>> = {
    points: "Pontos",
    boxplot: "Boxplot",
    pizza: "Pizza",
  };

  if (preset === "recommended" || preset === "distribution") {
    return recommendedChart(question);
  }

  const chosen = preferred[preset];
  return chosen && question.graficos.includes(chosen)
    ? chosen
    : recommendedChart(question);
}

function selectionsForPreset(
  questions: PerguntaDashboard[],
  preset: GraphPreset,
) {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      chartForPreset(question, preset),
    ]),
  ) as Record<string, TipoGrafico>;
}

export function ExportDialog({
  questions,
  currentQuestionId,
  currentTarget,
  sourceFileName,
  totalResponses,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [visualScope, setVisualScope] = useState<VisualExportScope>("current");
  const [dataScope, setDataScope] = useState<DataExportScope>("all");
  const [questionId, setQuestionId] = useState(
    currentQuestionId ?? questions[0]?.id ?? "",
  );
  const [graphPreset, setGraphPreset] = useState<GraphPreset>("recommended");
  const [charts, setCharts] = useState<Record<string, TipoGrafico>>(() =>
    selectionsForPreset(questions, "recommended"),
  );
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const reportPageRefs = useRef<Array<HTMLElement | null>>([]);
  const visualFormat = isVisualFormat(format);
  const fullDashboard = format === "pdf" && visualScope === "full";
  const effectiveDataScope = format === "csv" ? "question" : dataScope;
  const needsQuestion = !visualFormat && effectiveDataScope === "question";
  const reportTitle = useMemo(
    () => formatarTituloDoArquivo(sourceFileName),
    [sourceFileName],
  );

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !exporting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exporting, onClose]);

  const summary = useMemo(() => {
    if (format === "jpeg") {
      return "Exporta a tela atual em alta resolução, sem menus ou controles de navegação.";
    }

    if (format === "pdf") {
      return fullDashboard
        ? `Cria uma capa para “${reportTitle}” e organiza as ${questions.length} perguntas, uma por página.`
        : "Ajusta e centraliza a tela atual em uma única página A4, com o fundo do tema.";
    }

    if (effectiveDataScope === "all") {
      return "Gera uma planilha XLSX com todas as respostas da pesquisa.";
    }

    const question = questions.find((item) => item.id === questionId);
    return `Gera ${format.toUpperCase()} com o identificador da resposta e ${question?.codigo ?? "a pergunta selecionada"}.`;
  }, [
    effectiveDataScope,
    format,
    fullDashboard,
    questionId,
    questions,
    reportTitle,
  ]);

  function applyPreset() {
    setCharts(selectionsForPreset(questions, graphPreset));
  }

  async function handleExport() {
    setExporting(true);
    setProgress(null);
    setError(null);

    try {
      if (format === "pdf" && visualScope === "full") {
        const pageTargets = reportPageRefs.current.filter(
          (page): page is HTMLElement => page !== null,
        );
        if (pageTargets.length !== questions.length + 1) {
          throw new Error(
            "O relatório ainda está sendo preparado. Tente novamente em instantes.",
          );
        }
        await exportDashboardPdf({
          pageTargets,
          onProgress: (current, total) =>
            setProgress(
              current === 1
                ? "Preparando a capa..."
                : `Gerando pergunta ${current - 1} de ${total - 1}...`,
            ),
        });
      } else if (isVisualFormat(format)) {
        await exportCurrentVisual({ format, currentTarget });
      } else {
        await exportData({
          format,
          scope: effectiveDataScope,
          questionId: needsQuestion ? questionId : undefined,
        });
      }
      onClose();
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Não foi possível concluir a exportação.",
      );
    } finally {
      setExporting(false);
      setProgress(null);
    }
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] grid place-items-center p-4"
        data-export-exclude="true"
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#020611]/72 backdrop-blur-sm"
          aria-label="Fechar exportação"
          disabled={exporting}
          onClick={onClose}
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-title"
          aria-describedby="export-description"
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-paper p-6 shadow-soft sm:p-7"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            aria-label="Fechar"
            disabled={exporting}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          <div className="flex gap-10 justify-start">
            <span className="mb-5 grid size-15 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Download className="size-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <Text id="export-title" as="h2" variant="h2" className="pr-10">
                Exportar dashboard
              </Text>
              <Text id="export-description" tone="muted">
                Escolha o formato e o conteúdo que deseja baixar.
              </Text>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Formato
              <select
                className={selectClassName}
                value={format}
                disabled={exporting}
                onChange={(event) => {
                  const nextFormat = event.target.value as ExportFormat;
                  setFormat(nextFormat);
                  if (nextFormat === "csv") setDataScope("question");
                  if (nextFormat === "jpeg") setVisualScope("current");
                  setError(null);
                }}
              >
                <option value="pdf">PDF</option>
                <option value="jpeg">JPEG</option>
                <option value="xlsx">XLSX</option>
                <option value="csv">CSV</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Conteúdo
              {visualFormat ? (
                <select
                  className={selectClassName}
                  value={visualScope}
                  disabled={exporting || format === "jpeg"}
                  onChange={(event) =>
                    setVisualScope(event.target.value as VisualExportScope)
                  }
                >
                  <option value="current">Tela atual</option>
                  {format === "pdf" && (
                    <option value="full">Dashboard completo</option>
                  )}
                </select>
              ) : (
                <select
                  className={selectClassName}
                  value={effectiveDataScope}
                  disabled={exporting || format === "csv"}
                  onChange={(event) =>
                    setDataScope(event.target.value as DataExportScope)
                  }
                >
                  {format === "xlsx" && (
                    <option value="all">Pesquisa completa</option>
                  )}
                  <option value="question">Pergunta específica</option>
                </select>
              )}
            </label>

            {needsQuestion && (
              <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                Pergunta
                <select
                  className={selectClassName}
                  value={questionId}
                  disabled={exporting}
                  onChange={(event) => setQuestionId(event.target.value)}
                >
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.codigo} — {question.enunciado}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {fullDashboard && (
            <section className="mt-5 rounded-2xl border border-line bg-surface/65 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <WandSparkles
                  className="mt-0.5 size-5 shrink-0 text-brand-700"
                  aria-hidden="true"
                />
                <div>
                  <Text as="h3" variant="label">
                    Gráficos do relatório
                  </Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Aplique uma base para todas as perguntas e ajuste apenas as
                    exceções.
                  </Text>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  Predefinição
                  <select
                    className={selectClassName}
                    value={graphPreset}
                    disabled={exporting}
                    onChange={(event) =>
                      setGraphPreset(event.target.value as GraphPreset)
                    }
                  >
                    <option value="recommended">
                      Recomendado para cada pergunta
                    </option>
                    <option value="distribution">Distribuição em barras</option>
                    <option value="points">Pontos quando disponível</option>
                    <option value="boxplot">Boxplot quando disponível</option>
                    <option value="pizza">Pizza quando disponível</option>
                  </select>
                </label>
                <Button
                  variant="outline"
                  disabled={exporting}
                  onClick={applyPreset}
                >
                  Aplicar a todas
                </Button>
              </div>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                {questions.map((question) => (
                  <label
                    key={question.id}
                    className="grid gap-2 rounded-xl border border-line bg-paper p-3 text-sm font-semibold text-ink sm:grid-cols-[1fr_12rem] sm:items-center"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 text-brand-700">
                        {question.codigo}
                      </span>
                      <span className="font-normal text-muted">
                        {question.enunciado}
                      </span>
                    </span>
                    <select
                      className={selectClassName}
                      value={charts[question.id] ?? question.graficos[0]}
                      disabled={exporting}
                      onChange={(event) =>
                        setCharts((current) => ({
                          ...current,
                          [question.id]: event.target.value as TipoGrafico,
                        }))
                      }
                    >
                      {question.graficos.map((chart) => (
                        <option key={chart} value={chart}>
                          {chart}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          )}

          <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-surface/70 p-4">
            {visualFormat ? (
              <FileImage className="mt-0.5 size-5 shrink-0 text-brand-700" />
            ) : (
              <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-positive" />
            )}
            <Text variant="caption" tone="muted">
              {summary}
            </Text>
          </div>

          {progress && (
            <Text
              role="status"
              variant="caption"
              tone="accent"
              className="mt-4"
            >
              {progress}
            </Text>
          )}
          {error && (
            <Text
              role="alert"
              variant="caption"
              tone="negative"
              className="mt-4"
            >
              {error}
            </Text>
          )}

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              ref={cancelButtonRef}
              variant="ghost"
              disabled={exporting}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              loading={exporting}
              disabled={needsQuestion && !questionId}
              onClick={handleExport}
            >
              {exporting ? (progress ?? "Gerando arquivo...") : "Exportar"}
            </Button>
          </div>
        </section>
      </div>

      {fullDashboard && (
        <div
          className="pdf-report-staging"
          aria-hidden="true"
          data-export-exclude="true"
        >
          <div
            ref={(node) => {
              reportPageRefs.current[0] = node;
            }}
          >
            <ReportCoverPage
              title={reportTitle}
              totalQuestions={questions.length}
              totalResponses={totalResponses}
            />
          </div>
          {questions.map((question, index) => (
            <div
              key={question.id}
              ref={(node) => {
                reportPageRefs.current[index + 1] = node;
              }}
            >
              <ReportQuestionPage
                question={question}
                chart={charts[question.id] ?? question.graficos[0]}
                pageNumber={index + 2}
                totalPages={questions.length + 1}
              />
            </div>
          ))}
        </div>
      )}
    </>,
    document.body,
  );
}
