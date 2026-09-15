import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { cn } from "../../lib/cn";
import { Tag, type TagOption } from "./tag";

export type TipoVariavel = "Quantitativa" | "Qualitativa";
export type CategoriaQuantitativa = "Discreta" | "Contínua";
export type CategoriaQualitativa = "Nominal" | "Ordinal";
export type CategoriaVariavel = CategoriaQualitativa | CategoriaQuantitativa;

export type PerguntaRow = {
  id: string;
  codigo: string;
  enunciado: string;
  papel: "Pergunta" | "Metadado";
  tipo: TipoVariavel | null;
  categoria: CategoriaVariavel | null;
};

export type QuestionGridColumn =
  | "codigo"
  | "enunciado"
  | "tipo"
  | "categoria";
export type QuestionGridAlignment = "left" | "center" | "right";
export type QuestionGridSize = "compact" | "default" | "comfortable";
export type QuestionGridSort = {
  column: QuestionGridColumn;
  direction: "asc" | "desc";
};

const tipoOptions: readonly TagOption[] = [
  { value: "Quantitativa", dotColor: "red" },
  { value: "Qualitativa", dotColor: "l-green" },
];

const categoriaOptions: Record<TipoVariavel, readonly TagOption[]> = {
  Quantitativa: [
    { value: "Discreta", dotColor: "orange" },
    { value: "Contínua", dotColor: "yellow" },
  ],
  Qualitativa: [
    { value: "Nominal", dotColor: "blue" },
    { value: "Ordinal", dotColor: "d-green" },
  ],
};

const columnLabels: Record<QuestionGridColumn, string> = {
  codigo: "Código",
  enunciado: "Pergunta",
  tipo: "Tipo",
  categoria: "Categoria",
};

const defaultColumnWidths: Record<QuestionGridColumn, string> = {
  codigo: "minmax(5.5rem, 0.55fr)",
  enunciado: "minmax(17rem, 2.4fr)",
  tipo: "minmax(10rem, 1fr)",
  categoria: "minmax(10rem, 1fr)",
};

const sizeStyles: Record<
  QuestionGridSize,
  { header: string; cell: string; minWidth: string }
> = {
  compact: {
    header: "px-3 py-2",
    cell: "px-3 py-1.5",
    minWidth: "min-w-[42rem]",
  },
  default: {
    header: "px-4 py-3",
    cell: "px-4 py-2.5",
    minWidth: "min-w-[46rem]",
  },
  comfortable: {
    header: "px-5 py-4",
    cell: "px-5 py-4",
    minWidth: "min-w-[50rem]",
  },
};

const alignmentStyles: Record<QuestionGridAlignment, string> = {
  left: "justify-start text-left",
  center: "justify-center text-center",
  right: "justify-end text-right",
};

export type QuestionsGridProps = Omit<ComponentProps<"div">, "onChange"> & {
  rows: readonly PerguntaRow[];
  onRowChange?: (row: PerguntaRow) => void;
  editable?: boolean;
  sortable?: boolean;
  sort?: QuestionGridSort | null;
  defaultSort?: QuestionGridSort | null;
  onSortChange?: (sort: QuestionGridSort | null) => void;
  itemsPerPage?: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  size?: QuestionGridSize;
  showCellSeparators?: boolean;
  striped?: boolean;
  hoverHighlight?: boolean;
  stickyHeader?: boolean;
  showHeader?: boolean;
  alignments?: Partial<Record<QuestionGridColumn, QuestionGridAlignment>>;
  columnWidths?: Partial<Record<QuestionGridColumn, string>>;
  cellClassNames?: Partial<Record<QuestionGridColumn, string>>;
  getRowClassName?: (row: PerguntaRow, index: number) => string | undefined;
  emptyMessage?: string;
  ariaLabel?: string;
};

function compareRows(
  first: PerguntaRow,
  second: PerguntaRow,
  sort: QuestionGridSort,
) {
  const firstValue = first[sort.column] ?? "";
  const secondValue = second[sort.column] ?? "";
  const comparison = firstValue.localeCompare(secondValue, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });

  return sort.direction === "asc" ? comparison : -comparison;
}

function normalizePositiveInteger(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function SortIcon({ sort }: { sort: QuestionGridSort | null }) {
  if (!sort) return <ArrowUpDown className="size-3.5 opacity-45" />;
  return sort.direction === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

export function QuestionsGrid({
  rows,
  onRowChange,
  editable = true,
  sortable = true,
  sort,
  defaultSort = null,
  onSortChange,
  itemsPerPage,
  page,
  defaultPage = 1,
  onPageChange,
  size = "default",
  showCellSeparators = false,
  striped = false,
  hoverHighlight = true,
  stickyHeader = false,
  showHeader = true,
  alignments,
  columnWidths,
  cellClassNames,
  getRowClassName,
  emptyMessage = "Nenhuma pergunta encontrada.",
  ariaLabel = "Configuração das perguntas",
  className,
  ...props
}: QuestionsGridProps) {
  const [internalSort, setInternalSort] = useState<QuestionGridSort | null>(
    defaultSort,
  );
  const [internalPage, setInternalPage] = useState(() =>
    normalizePositiveInteger(defaultPage, 1),
  );
  const activeSort = sort === undefined ? internalSort : sort;
  const requestedPage = page === undefined ? internalPage : page;
  const normalizedItemsPerPage =
    itemsPerPage === undefined
      ? null
      : normalizePositiveInteger(itemsPerPage, 1);
  const totalPages = normalizedItemsPerPage
    ? Math.max(1, Math.ceil(rows.length / normalizedItemsPerPage))
    : 1;
  const activePage = Math.min(
    normalizePositiveInteger(requestedPage, 1),
    totalPages,
  );
  const columns = Object.keys(columnLabels) as QuestionGridColumn[];
  const templateColumns = columns
    .map((column) => columnWidths?.[column] ?? defaultColumnWidths[column])
    .join(" ");
  const rowStyle = { gridTemplateColumns: templateColumns } as CSSProperties;

  const sortedRows = useMemo(() => {
    if (!activeSort) return [...rows];
    return [...rows].sort((first, second) =>
      compareRows(first, second, activeSort),
    );
  }, [activeSort, rows]);

  const displayedRows = useMemo(() => {
    if (!normalizedItemsPerPage) return sortedRows;
    const start = (activePage - 1) * normalizedItemsPerPage;
    return sortedRows.slice(start, start + normalizedItemsPerPage);
  }, [activePage, normalizedItemsPerPage, sortedRows]);

  function changePage(nextPage: number) {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);
    if (safePage === activePage) return;
    if (page === undefined) setInternalPage(safePage);
    onPageChange?.(safePage);
  }

  function updateSort(column: QuestionGridColumn) {
    if (!sortable) return;

    const nextSort: QuestionGridSort = {
      column,
      direction:
        activeSort?.column === column && activeSort.direction === "asc"
          ? "desc"
          : "asc",
    };

    if (sort === undefined) setInternalSort(nextSort);
    onSortChange?.(nextSort);
    changePage(1);
  }

  function changeTipo(row: PerguntaRow, tipo: TipoVariavel) {
    const categoriaCompativel = categoriaOptions[tipo].some(
      (option) => option.value === row.categoria,
    );

    onRowChange?.({
      ...row,
      tipo,
      categoria: categoriaCompativel
        ? row.categoria
        : (categoriaOptions[tipo][0].value as CategoriaVariavel),
    });
  }

  function changeCategoria(row: PerguntaRow, categoria: CategoriaVariavel) {
    onRowChange?.({ ...row, categoria });
  }

  function cellClasses(column: QuestionGridColumn) {
    return cn(
      "flex min-w-0 items-center text-sm text-ink",
      sizeStyles[size].cell,
      alignmentStyles[alignments?.[column] ?? "left"],
      showCellSeparators && "border-r border-line last:border-r-0",
      cellClassNames?.[column],
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-line bg-paper",
        normalizedItemsPerPage && "pb-10",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <div
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={rows.length + (showHeader ? 1 : 0)}
          aria-colcount={columns.length}
          className={sizeStyles[size].minWidth}
        >
          {showHeader && (
            <div
              role="row"
              className={cn(
                "grid border-b border-line bg-surface/80",
                stickyHeader && "sticky top-0 z-10",
              )}
              style={rowStyle}
            >
              {columns.map((column) => {
                const columnSort =
                  activeSort?.column === column ? activeSort : null;

                return (
                  <div
                    key={column}
                    role="columnheader"
                    aria-sort={
                      columnSort
                        ? columnSort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cn(
                      "flex min-w-0 items-center text-xs font-bold uppercase tracking-[0.08em] text-muted",
                      sizeStyles[size].header,
                      alignmentStyles[alignments?.[column] ?? "left"],
                      showCellSeparators &&
                        "border-r border-line last:border-r-0",
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-1.5 rounded-md outline-none hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-200",
                          alignmentStyles[alignments?.[column] ?? "left"],
                        )}
                        onClick={() => updateSort(column)}
                      >
                        {columnLabels[column]}
                        <SortIcon sort={columnSort} />
                      </button>
                    ) : (
                      columnLabels[column]
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {displayedRows.length === 0 ? (
            <div
              role="row"
              className="border-b border-line px-4 py-10 text-center text-sm text-muted last:border-b-0"
            >
              <span role="gridcell" aria-colspan={columns.length}>
                {emptyMessage}
              </span>
            </div>
          ) : (
            displayedRows.map((row, index) => (
              <div
                key={row.id}
                role="row"
                className={cn(
                  "grid border-b border-line transition-colors last:border-b-0",
                  striped && index % 2 === 1 && "bg-surface/45",
                  hoverHighlight && "hover:bg-brand-50/55",
                  getRowClassName?.(row, index),
                )}
                style={rowStyle}
              >
                <div role="gridcell" className={cellClasses("codigo")}>
                  <span className="font-semibold tabular-nums">
                    {row.codigo}
                  </span>
                </div>
                <div role="gridcell" className={cellClasses("enunciado")}>
                  <span className="leading-5">{row.enunciado}</span>
                </div>
                <div role="gridcell" className={cellClasses("tipo")}>
                  <Tag
                    variant="grid"
                    tag={row.tipo}
                    options={tipoOptions}
                    disabled={!editable}
                    onValueChange={
                      editable
                        ? (value) => changeTipo(row, value as TipoVariavel)
                        : undefined
                    }
                    selectLabel={`Alterar o tipo de ${row.codigo}`}
                  />
                </div>
                <div role="gridcell" className={cellClasses("categoria")}>
                  <Tag
                    variant="grid"
                    tag={row.categoria}
                    options={row.tipo ? categoriaOptions[row.tipo] : undefined}
                    disabled={!editable || !row.tipo}
                    onValueChange={
                      editable && row.tipo
                        ? (value) =>
                            changeCategoria(row, value as CategoriaVariavel)
                        : undefined
                    }
                    selectLabel={`Alterar a categoria de ${row.codigo}`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {normalizedItemsPerPage && (
        <nav
          className="absolute bottom-1 right-2 z-10 flex items-center bg-transparent opacity-60 transition-opacity hover:opacity-100 focus-within:opacity-100"
          aria-label="Paginação da grade"
        >
          <button
            type="button"
            className="grid size-8 place-items-center bg-transparent text-muted transition hover:scale-110 hover:text-brand-700 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:pointer-events-none disabled:opacity-30"
            onClick={() => changePage(activePage - 1)}
            disabled={activePage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span
            className="min-w-12 text-center text-xs font-semibold tabular-nums text-ink"
            aria-live="polite"
          >
            {activePage}/{totalPages}
          </span>
          <button
            type="button"
            className="grid size-8 place-items-center bg-transparent text-muted transition hover:scale-110 hover:text-brand-700 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:pointer-events-none disabled:opacity-30"
            onClick={() => changePage(activePage + 1)}
            disabled={activePage === totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
