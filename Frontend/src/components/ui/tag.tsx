import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

const tagStyles = cva(
  "relative items-center gap-2 text-sm leading-5 text-ink transition",
  {
    variants: {
      variant: {
        grid:
          "flex min-h-9 w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-brand-50 focus-within:bg-brand-50 focus-within:ring-2 focus-within:ring-brand-200",
        chart:
          "inline-flex rounded-full border border-line bg-paper px-3 py-1.5 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "chart",
    },
  },
);

const dotStyles = cva("size-2.5 shrink-0 rounded-full", {
  variants: {
    dotColor: {
      red: "bg-negative",
      orange: "bg-brand-500",
      yellow: "bg-yellow-400",
      "l-green": "bg-green-300",
      "d-green": "bg-green-700",
      blue: "bg-blue-400",
      muted: "bg-muted",
    },
  },
  defaultVariants: {
    dotColor: "muted",
  },
});

export type TagDotColor = NonNullable<
  VariantProps<typeof dotStyles>["dotColor"]
>;

export type TagOption = {
  value: string;
  label?: string;
  dotColor?: TagDotColor;
};

const dotColorByTag: Record<string, TagDotColor> = {
  Quantitativa: "red",
  Qualitativa: "l-green",
  Discreta: "orange",
  Contínua: "yellow",
  Nominal: "blue",
  Ordinal: "d-green",
};

export type TagProps = Omit<
  ComponentProps<"div">,
  "children" | "onChange"
> &
  VariantProps<typeof tagStyles> & {
    dot?: boolean;
    dotColor?: TagDotColor;
    tag: string | null;
    options?: readonly TagOption[];
    onValueChange?: (value: string) => void;
    selectLabel?: string;
    disabled?: boolean;
  };

export function Tag({
  dot = true,
  dotColor,
  tag,
  variant = "chart",
  options,
  onValueChange,
  selectLabel,
  disabled = false,
  className,
  ...props
}: TagProps) {
  const selectedOption = options?.find((option) => option.value === tag);
  const resolvedColor =
    selectedOption?.dotColor ??
    dotColor ??
    dotColorByTag[tag ?? ""] ??
    "muted";
  const label = selectedOption?.label ?? tag ?? "Não definido";
  const isEditable =
    variant === "grid" && Boolean(options?.length && onValueChange);
  const content = (
    <>
      {dot && (
        <span className={dotStyles({ dotColor: resolvedColor })} aria-hidden />
      )}
      <span className="min-w-0 truncate font-medium">{label}</span>
    </>
  );

  if (isEditable) {
    return (
      <div
        className={cn(
          tagStyles({ variant }),
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
          className,
        )}
        {...props}
      >
        {content}
        <select
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          value={tag ?? ""}
          aria-label={selectLabel ?? "Alterar valor"}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
        >
          {!tag && <option value="">Não definido</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label ?? option.value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className={cn(
        tagStyles({ variant }),
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
}
