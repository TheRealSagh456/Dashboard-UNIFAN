import { useId, useState } from "react";
import { useChartInteraction } from "../../hooks/use-chart-interaction";
import { cn } from "../../lib/cn";
import { ChartSector } from "./chart-sector";
import { Tooltip } from "../ui/tooltip";
import { Text } from "../ui/typography";

type PieTone = "brand" | "warm" | "soft" | "positive" | "muted";

export type PieChartDatum = {
  label: string;
  value: number;
  tone?: PieTone;
};

type PieChartProps = {
  data: PieChartDatum[];
  ariaLabel?: string;
  className?: string;
};

const tones: PieTone[] = ["brand", "warm", "positive", "soft", "muted"];
const colors: Record<PieTone, string> = {
  brand: "bg-brand-700",
  warm: "bg-brand-500",
  positive: "bg-positive",
  soft: "bg-brand-200",
  muted: "bg-muted/55",
};

export function PieChart({
  data,
  ariaLabel = "Gráfico de pizza",
  className,
}: PieChartProps) {
  const revealId = useId();
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

  return (
    <div ref={rootRef} className={cn("mx-auto grid w-full max-w-2xl items-center justify-center gap-4 sm:grid-cols-[minmax(0,17rem)_minmax(0,15rem)] sm:gap-6", className)}>
      <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-64 sm:max-w-68" role="img" aria-label={ariaLabel}>
        <defs>
          <mask id={revealId} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
            <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="100" pathLength="1" transform="rotate(-90 100 100)" className="chart-pie-reveal" />
          </mask>
        </defs>
        <g mask={`url(#${revealId})`}>
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
                    innerRadius={0}
                    outerRadius={88}
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
        </g>
      </svg>
      <div className="mx-auto grid w-full max-w-72 gap-1 sm:max-w-none">
        {sectors.map((sector, index) => (
          <div
            key={sector.label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition",
              (hoveredIndex === index || selectedIndex === index) && "bg-brand-50",
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={cn("size-2 shrink-0 rounded-full", colors[sector.tone])} />
              <Text as="span" variant="caption" className="text-xs leading-4 wrap-anywhere">{sector.label}</Text>
            </span>
            <Text as="strong" variant="caption" className="shrink-0 text-xs tabular-nums">
              {sector.value.toLocaleString("pt-BR")}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
