import { Download, FileImage, FileSpreadsheet, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Button, Text } from "../../components";
import type { PerguntaDashboard } from "./dashboard-data";
import {
  exportData,
  exportVisual,
  type DataExportScope,
  type ExportFormat,
  type VisualExportScope,
} from "../../services/exportacoes";

type ExportDialogProps = {
  questions: PerguntaDashboard[];
  currentQuestionId?: string;
  currentTarget: RefObject<HTMLElement | null>;
  fullTarget: RefObject<HTMLElement | null>;
  onClose: () => void;
};

const selectClassName =
  "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60";

function isVisualFormat(format: ExportFormat): format is "jpeg" | "pdf" {
  return format === "jpeg" || format === "pdf";
}

export function ExportDialog({
  questions,
  currentQuestionId,
  currentTarget,
  fullTarget,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [visualScope, setVisualScope] = useState<VisualExportScope>("current");
  const [dataScope, setDataScope] = useState<DataExportScope>("all");
  const [questionId, setQuestionId] = useState(
    currentQuestionId ?? questions[0]?.id ?? "",
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const visualFormat = isVisualFormat(format);
  const effectiveDataScope = format === "csv" ? "question" : dataScope;
  const needsQuestion = !visualFormat && effectiveDataScope === "question";

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
    if (visualFormat) {
      return visualScope === "full"
        ? "Captura toda a altura do conteúdo, sem menus ou controles de navegação."
        : "Exporta o conteúdo principal da página atual, sem menus ou controles de navegação.";
    }

    if (effectiveDataScope === "all") {
      return "Gera uma planilha XLSX com todas as respostas da pesquisa.";
    }

    const question = questions.find((item) => item.id === questionId);
    return `Gera ${format.toUpperCase()} com o identificador da resposta e ${question?.codigo ?? "a pergunta selecionada"}.`;
  }, [effectiveDataScope, format, questionId, questions, visualFormat, visualScope]);

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      if (isVisualFormat(format)) {
        await exportVisual({
          format,
          scope: visualScope,
          currentTarget,
          fullTarget,
        });
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
    }
  }

  return createPortal(
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
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-paper p-6 shadow-soft sm:p-7"
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

        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <Download className="size-6" aria-hidden="true" />
        </span>
        <Text id="export-title" as="h2" variant="h2" className="pr-10">
          Exportar dashboard
        </Text>
        <Text id="export-description" tone="muted" className="mt-2">
          Escolha o formato e o conteúdo que deseja baixar.
        </Text>

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
                disabled={exporting}
                onChange={(event) =>
                  setVisualScope(event.target.value as VisualExportScope)
                }
              >
                <option value="current">Tela atual</option>
                <option value="full">Dashboard completo</option>
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

        {error && (
          <Text role="alert" variant="caption" tone="negative" className="mt-4">
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
            {exporting ? "Gerando arquivo..." : "Exportar"}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
