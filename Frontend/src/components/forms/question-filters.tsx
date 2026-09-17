import { Filter, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type {
  CategoriaVariavel,
  TipoVariavel,
} from "../ui/question-grid";
import { Button } from "../ui/button";
import { TextField } from "../ui/text-field";

type QuestionFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  typeValue: TipoVariavel | "todos";
  onTypeChange: (value: TipoVariavel | "todos") => void;
  categoryValue: CategoriaVariavel | "todas";
  onCategoryChange: (value: CategoriaVariavel | "todas") => void;
  categories: readonly CategoriaVariavel[];
  searchLabel?: string;
  placeholder?: string;
  className?: string;
};

const selectClassName =
  "h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100";

export function QuestionFilters({
  query,
  onQueryChange,
  typeValue,
  onTypeChange,
  categoryValue,
  onCategoryChange,
  categories,
  searchLabel = "Buscar perguntas",
  placeholder = "Buscar por código, pergunta, tipo ou categoria...",
  className,
}: QuestionFiltersProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const activeCount =
    Number(typeValue !== "todos") + Number(categoryValue !== "todas");

  useEffect(() => {
    if (!open) return;

    function close(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <TextField
          aria-label={searchLabel}
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          leadingIcon={<Search className="size-4" aria-hidden="true" />}
        />
        <Button
          variant={open ? "secondary" : "outline"}
          size="icon"
          aria-label="Exibir filtros"
          aria-controls={panelId}
          aria-expanded={open}
          aria-pressed={open}
          onClick={() => setOpen((current) => !current)}
          className="relative shrink-0"
        >
          <Filter className="size-4" aria-hidden="true" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand-700 text-[0.6rem] font-bold text-paper">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 grid w-full min-w-72 gap-3 rounded-2xl border border-line bg-paper p-4 shadow-soft sm:w-96 sm:grid-cols-2"
        >
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Tipo
            <select
              className={selectClassName}
              value={typeValue}
              onChange={(event) =>
                onTypeChange(event.target.value as TipoVariavel | "todos")
              }
            >
              <option value="todos">Todos os tipos</option>
              <option value="Quantitativa">Quantitativa</option>
              <option value="Qualitativa">Qualitativa</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Categoria
            <select
              className={selectClassName}
              value={categoryValue}
              onChange={(event) =>
                onCategoryChange(
                  event.target.value as CategoriaVariavel | "todas",
                )
              }
            >
              <option value="todas">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="sm:col-span-2 sm:justify-self-end"
            disabled={activeCount === 0}
            onClick={() => {
              onTypeChange("todos");
              onCategoryChange("todas");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
