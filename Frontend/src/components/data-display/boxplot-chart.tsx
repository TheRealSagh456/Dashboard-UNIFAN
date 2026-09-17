import { useState } from "react";
import { useChartInteraction } from "../../hooks/use-chart-interaction";
import { cn } from "../../lib/cn";
import { criarEscalaAgradavel } from "../../utils/chart-scale";
import { Tooltip } from "../ui/tooltip";

type BoxplotChartProps = {
  data: {
    minimum: number;
    firstQuartile: number;
    median: number;
    thirdQuartile: number;
    maximum: number;
  };
  xLabel?: string;
  ariaLabel?: string;
  className?: string;
};

export function BoxplotChart({
  data,
  xLabel = "Valor",
  ariaLabel = "Gráfico boxplot",
  className,
}: BoxplotChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { rootRef, selectedIndex, selectIndex } =
    useChartInteraction<HTMLDivElement>();
  const width = 760;
  const height = 260;
  const margin = { top: 28, right: 24, bottom: 62, left: 72 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const scale = criarEscalaAgradavel(data.maximum);
  const position = (value: number) =>
    margin.left + (value / scale.limite) * chartWidth;
  const values = [
    ["Mínimo", data.minimum],
    ["Q1", data.firstQuartile],
    ["Mediana", data.median],
    ["Q3", data.thirdQuartile],
    ["Máximo", data.maximum],
  ] as const;
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeValue = activeIndex === null ? null : values[activeIndex][1];
  const centerY = margin.top + chartHeight / 2;

  return (
    <div ref={rootRef} className={cn("overflow-x-auto py-4", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[42rem]" role="img" aria-label={ariaLabel}>
        {scale.marcacoes.map((tick) => {
          const x = position(tick);
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={margin.top} y2={margin.top + chartHeight} className="stroke-line stroke-1" />
              <text x={x} y={height - 38} textAnchor="middle" className="fill-muted text-[11px]">
                {tick.toLocaleString("pt-BR")}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} x2={margin.left + chartWidth} y1={margin.top + chartHeight} y2={margin.top + chartHeight} className="stroke-ink stroke-[1.5]" />
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + chartHeight} className="stroke-ink stroke-[1.5]" />
        {activeValue !== null && (
          <line x1={position(activeValue)} x2={position(activeValue)} y1={margin.top} y2={margin.top + chartHeight} className="stroke-brand-500 stroke-1 [stroke-dasharray:5_5]" />
        )}
        <line x1={position(data.minimum)} y1={centerY} x2={position(data.maximum)} y2={centerY} className="chart-boxplot-span stroke-muted stroke-2" />
        <line x1={position(data.minimum)} y1={centerY - 28} x2={position(data.minimum)} y2={centerY + 28} className="chart-boxplot-cap stroke-ink stroke-2" />
        <line x1={position(data.maximum)} y1={centerY - 28} x2={position(data.maximum)} y2={centerY + 28} className="chart-boxplot-cap stroke-ink stroke-2" style={{ animationDelay: "650ms" }} />
        <g className="chart-boxplot-box">
          <rect
            x={position(data.firstQuartile)}
            y={centerY - 46}
            width={Math.max(2, position(data.thirdQuartile) - position(data.firstQuartile))}
            height="92"
            rx="12"
            className="fill-brand-100 stroke-brand-600 stroke-2"
          />
          <line x1={position(data.median)} y1={centerY - 46} x2={position(data.median)} y2={centerY + 46} className="stroke-brand-700 stroke-[4]" />
        </g>
        {values.map(([label, value], index) => (
          <Tooltip<SVGRectElement>
            key={label}
            pinned={selectedIndex === index}
            content={
              <span className="grid gap-0.5">
                <span className="font-semibold">{label}</span>
                <span className="text-sm font-bold text-brand-200">{value.toLocaleString("pt-BR")}</span>
              </span>
            }
          >
            {(triggerProps) => (
              <rect
                {...triggerProps}
                data-chart-item
                data-selected={selectedIndex === index}
                aria-label={`${label}: ${value.toLocaleString("pt-BR")}`}
                x={position(value) - 12}
                y={centerY - 62}
                width="24"
                height="124"
                className="fill-transparent outline-none focus-visible:stroke-brand-500 focus-visible:stroke-1"
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
        ))}
        <text x={margin.left + chartWidth / 2} y={height - 8} textAnchor="middle" className="fill-ink text-xs font-semibold">
          {xLabel}
        </text>
        <text x="16" y={centerY} textAnchor="middle" transform={`rotate(-90 16 ${centerY})`} className="fill-ink text-xs font-semibold">
          Distribuição
        </text>
      </svg>
    </div>
  );
}
