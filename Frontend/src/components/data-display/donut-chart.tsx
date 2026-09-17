import { useState } from "react";
import { useChartInteraction } from "../../hooks/use-chart-interaction";
import { cn } from "../../lib/cn";
import { ChartSector } from "./chart-sector";
import { Tooltip } from "../ui/tooltip";
import { Text } from "../ui/typography";

type DonutTone = "brand" | "warm" | "soft" | "positive" | "muted";

export type DonutChartDatum = {
  label: string;
  value: number;
  tone?: DonutTone;
};

type DonutChartProps = {
  data: DonutChartDatum[];
  centerValue: string;
  centerLabel: string;
  ariaLabel?: string;
  className?: string;
  layout?: "side" | "stacked";
  size?: "default" | "large";
};

const tones: DonutTone[] = ["brand", "warm", "positive", "soft", "muted"];
const colors: Record<DonutTone, string> = {
  brand: "bg-brand-700",
  warm: "bg-brand-500",
  positive: "bg-positive",
  soft: "bg-brand-200",
  muted: "bg-muted/55",
};

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  ariaLabel = "Gráfico de setores",
  className,
  layout = "side",
  size = "default",
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { rootRef, selectedIndex, selectIndex } =
    useChartInteraction<HTMLDivElement>();
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  const sectors = data.map((item, index) => {
    const start = data
      .slice(0, index)
      .reduce((angle, sector) => angle + (sector.value / total) * 360, 0);
    return {
      ...item,
      start,
      end: start + (item.value / total) * 360,
      tone: item.tone ?? tones[index % tones.length],
    };
  });
  const stacked = layout === "stacked";

  return (
    <div
      ref={rootRef}
      className={cn(
        stacked
          ? "flex flex-col items-center gap-7"
          : "grid items-center gap-6 sm:grid-cols-[14rem_1fr]",
        className,
      )}
    >
      <div
        className={cn(
          "relative mx-auto",
          size === "large" ? "size-72" : "size-56",
        )}
      >
        <svg viewBox="0 0 200 200" className="size-full" role="img" aria-label={ariaLabel}>
          {sectors.map((sector, index) => {
            const selected = selectedIndex === index;
            return (
              <Tooltip<SVGPathElement>
                key={sector.label}
                pinned={selected}
                suppressTransient={selectedIndex !== null && !selected}
                content={
                  <span className="grid min-w-28 gap-0.5">
                    <span className="font-semibold">{sector.label}</span>
                    <span className="text-sm font-bold text-brand-200">
                      {sector.value.toLocaleString("pt-BR")} · {((sector.value / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </span>
                  </span>
                }
              >
                {(triggerProps) => (
                  <ChartSector
                    {...triggerProps}
                    data-chart-item
                    data-selected={selected}
                    startAngle={sector.start}
                    endAngle={sector.end}
                    tone={sector.tone}
                    aria-label={`${sector.label}: ${sector.value}`}
                    className={cn(
                      "cursor-pointer hover:brightness-100",
                      selected ? "opacity-100" : "opacity-70 hover:opacity-90 focus:opacity-90",
                    )}
                    onMouseEnter={(event) => {
                      setHoveredIndex(index);
                      triggerProps.onMouseEnter(event);
                    }}
                    onMouseLeave={(event) => {
                      setHoveredIndex(null);
                      triggerProps.onMouseLeave(event);
                    }}
                    onFocus={(event) => {
                      setHoveredIndex(index);
                      triggerProps.onFocus(event);
                    }}
                    onBlur={(event) => {
                      setHoveredIndex(null);
                      triggerProps.onBlur(event);
                    }}
                    onClick={(event) => {
                      triggerProps.onClick(event);
                      selectIndex(index);
                    }}
                    onKeyDown={(event) => {
                      triggerProps.onKeyDown(event);
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectIndex(index);
                      }
                    }}
                  />
                )}
              </Tooltip>
            );
          })}
        </svg>
        <span className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span>
            <Text variant="data" className={size === "large" ? "text-3xl" : "text-2xl"}>{centerValue}</Text>
            <Text variant="caption" tone="muted">{centerLabel}</Text>
          </span>
        </span>
      </div>
      <div
        className={cn(
          "grid gap-2",
          stacked && "w-full grid-cols-2",
        )}
      >
        {sectors.map((sector, index) => (
          <div
            key={sector.label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition",
              (hoveredIndex === index || selectedIndex === index) && "bg-brand-50",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", colors[sector.tone])} />
              <Text as="span" variant="caption" className={stacked ? undefined : "truncate"}>{sector.label}</Text>
            </span>
            <Text as="strong" variant="caption" className="tabular-nums">{sector.value}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
