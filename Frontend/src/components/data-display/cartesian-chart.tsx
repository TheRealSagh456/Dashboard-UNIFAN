import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { useChartInteraction } from "../../hooks/use-chart-interaction";
import { cn } from "../../lib/cn";
import { criarEscalaAgradavel } from "../../utils/chart-scale";
import { Tooltip, type TooltipTriggerProps } from "../ui/tooltip";

export type CartesianChartDatum = {
  label: string;
  value: number;
  detail?: string;
};

type CartesianChartProps = {
  data: CartesianChartDatum[];
  variant?: "bars" | "columns" | "histogram" | "line";
  xLabel: string;
  yLabel: string;
  ariaLabel?: string;
  className?: string;
};

function TooltipContent({ item }: { item: CartesianChartDatum }) {
  return (
    <span className="grid min-w-32 gap-0.5">
      <span className="font-semibold text-paper">{item.label}</span>
      <span className="text-sm font-bold text-brand-200">
        {item.value.toLocaleString("pt-BR")} respostas
      </span>
      {item.detail && <span className="text-paper/65">{item.detail}</span>}
    </span>
  );
}

function verticalBarPath(x: number, y: number, width: number, baseline: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, (baseline - y) / 2);
  return [
    `M ${x} ${baseline}`,
    `L ${x} ${y + safeRadius}`,
    `Q ${x} ${y} ${x + safeRadius} ${y}`,
    `L ${x + width - safeRadius} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + safeRadius}`,
    `L ${x + width} ${baseline}`,
    "Z",
  ].join(" ");
}

function horizontalBarPath(left: number, top: number, right: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, height / 2, (right - left) / 2);
  const bottom = top + height;
  return [
    `M ${left} ${top}`,
    `L ${right - safeRadius} ${top}`,
    `Q ${right} ${top} ${right} ${top + safeRadius}`,
    `L ${right} ${bottom - safeRadius}`,
    `Q ${right} ${bottom} ${right - safeRadius} ${bottom}`,
    `L ${left} ${bottom}`,
    "Z",
  ].join(" ");
}

export function CartesianChart({
  data,
  variant = "columns",
  xLabel,
  yLabel,
  ariaLabel = "Gráfico cartesiano",
  className,
}: CartesianChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { rootRef, selectedIndex, selectIndex } = useChartInteraction<HTMLDivElement>();
  const activeIndex = hoveredIndex ?? selectedIndex;
  const horizontal = variant === "bars";
  const width = 760;
  const height = Math.max(360, horizontal ? data.length * 52 + 125 : 360);
  const margin = { top: 24, right: 24, bottom: horizontal ? 64 : 92, left: horizontal ? 168 : 72 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const baseline = margin.top + chartHeight;
  const scale = criarEscalaAgradavel(Math.max(...data.map((item) => item.value), 1));
  const band = horizontal ? chartHeight / data.length : chartWidth / data.length;
  const gap = variant === "histogram" ? 5 : Math.min(18, band * 0.24);
  const points = data.map((item, index) => ({
    item,
    x: horizontal ? margin.left + (item.value / scale.limite) * chartWidth : margin.left + band * index + band / 2,
    y: horizontal ? margin.top + band * index + band / 2 : baseline - (item.value / scale.limite) * chartHeight,
  }));
  const activePoint = activeIndex === null ? null : points[activeIndex];

  function interactionProps<T extends SVGElement>(index: number, triggerProps: TooltipTriggerProps<T>) {
    return {
      onMouseEnter: (event: MouseEvent<T>) => {
        setHoveredIndex(index);
        triggerProps.onMouseEnter(event);
      },
      onMouseLeave: (event: MouseEvent<T>) => {
        setHoveredIndex(null);
        triggerProps.onMouseLeave(event);
      },
      onFocus: (event: FocusEvent<T>) => {
        setHoveredIndex(index);
        triggerProps.onFocus(event);
      },
      onBlur: (event: FocusEvent<T>) => {
        setHoveredIndex(null);
        triggerProps.onBlur(event);
      },
      onClick: (event: MouseEvent<T>) => {
        triggerProps.onClick(event);
        selectIndex(index);
      },
      onKeyDown: (event: KeyboardEvent<T>) => {
        triggerProps.onKeyDown(event);
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectIndex(index);
        }
      },
    };
  }

  function itemClasses(selected: boolean) {
    return cn(
      "cursor-pointer stroke-2 outline-none transition-colors focus-visible:[stroke-dasharray:4_3]",
      selected
        ? "fill-brand-500 stroke-brand-700"
        : "fill-brand-100 stroke-brand-500 hover:fill-brand-200 hover:stroke-brand-600 focus:fill-brand-200 focus:stroke-brand-600",
    );
  }

  return (
    <div ref={rootRef} className={cn("overflow-x-auto", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[42rem]" role="img" aria-label={ariaLabel}>
        {scale.marcacoes.map((tick) => {
          const x = margin.left + (tick / scale.limite) * chartWidth;
          const y = baseline - (tick / scale.limite) * chartHeight;
          return horizontal ? (
            <g key={tick}>
              <line x1={x} x2={x} y1={margin.top} y2={baseline} className="stroke-line stroke-1" />
              <text x={x} y={height - 42} textAnchor="middle" className="fill-muted text-[11px]">{tick.toLocaleString("pt-BR")}</text>
            </g>
          ) : (
            <g key={tick}>
              <line x1={margin.left} x2={margin.left + chartWidth} y1={y} y2={y} className="stroke-line stroke-1" />
              <text x={margin.left - 12} y={y + 4} textAnchor="end" className="fill-muted text-[11px]">{tick.toLocaleString("pt-BR")}</text>
            </g>
          );
        })}

        {horizontal ? (
          points.map((point, index) => {
            const selected = selectedIndex === index;
            const top = point.y - band * 0.3;
            return (
              <g key={point.item.label}>
                <text x={margin.left - 12} y={point.y + 4} textAnchor="end" className="fill-ink text-[11px]">
                  {point.item.label.length > 22 ? `${point.item.label.slice(0, 20)}…` : point.item.label}
                </text>
                <Tooltip<SVGPathElement> pinned={selected} content={<TooltipContent item={point.item} />}>
                  {(triggerProps) => (
                    <path
                      {...triggerProps}
                      {...interactionProps(index, triggerProps)}
                      data-chart-item
                      data-selected={selected}
                      d={horizontalBarPath(margin.left, top, point.x, band * 0.6, 7)}
                      className={cn("chart-bar-rise-horizontal", itemClasses(selected))}
                    />
                  )}
                </Tooltip>
              </g>
            );
          })
        ) : variant === "line" ? (
          <>
            <polyline pathLength="1" points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" className="chart-line-draw stroke-brand-600 stroke-[3]" />
            {points.map((point, index) => {
              const selected = selectedIndex === index;
              return (
                <Tooltip<SVGCircleElement> key={point.item.label} pinned={selected} content={<TooltipContent item={point.item} />}>
                  {(triggerProps) => (
                    <circle
                      {...triggerProps}
                      {...interactionProps(index, triggerProps)}
                      data-chart-item
                      data-selected={selected}
                      cx={point.x}
                      cy={point.y}
                      r="7"
                      className={cn(
                        itemClasses(selected),
                        "chart-point-enter stroke-[3]",
                      )}
                      style={{ animationDelay: `${220 + index * 90}ms` }}
                    />
                  )}
                </Tooltip>
              );
            })}
          </>
        ) : (
          points.map((point, index) => {
            const selected = selectedIndex === index;
            const barWidth = Math.max(3, band - gap);
            const x = margin.left + band * index + gap / 2;
            return (
              <Tooltip<SVGPathElement> key={point.item.label} pinned={selected} content={<TooltipContent item={point.item} />}>
                {(triggerProps) => (
                  <path
                    {...triggerProps}
                    {...interactionProps(index, triggerProps)}
                    data-chart-item
                    data-selected={selected}
                    d={verticalBarPath(x, point.y, barWidth, baseline, variant === "histogram" ? 4 : 8)}
                    className={cn("chart-bar-rise-vertical", itemClasses(selected))}
                  />
                )}
              </Tooltip>
            );
          })
        )}

        {activePoint && (horizontal ? (
          <line x1={activePoint.x} x2={activePoint.x} y1={margin.top} y2={baseline} className="pointer-events-none stroke-brand-500 stroke-1 [stroke-dasharray:5_5]" />
        ) : (
          <line x1={margin.left} x2={margin.left + chartWidth} y1={activePoint.y} y2={activePoint.y} className="pointer-events-none stroke-brand-500 stroke-1 [stroke-dasharray:5_5]" />
        ))}

        <line x1={margin.left} x2={margin.left + chartWidth} y1={baseline} y2={baseline} className="pointer-events-none stroke-ink stroke-[1.5]" />
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={baseline} className="pointer-events-none stroke-ink stroke-[1.5]" />

        {!horizontal && points.map((point) => (
          <text key={point.item.label} x={point.x} y={baseline + 20} textAnchor="middle" className="fill-muted text-[10px]">
            {point.item.label.length > 18 ? `${point.item.label.slice(0, 16)}…` : point.item.label}
          </text>
        ))}

        <text x={margin.left + chartWidth / 2} y={height - 8} textAnchor="middle" className="fill-ink text-xs font-semibold">{xLabel}</text>
        <text x="16" y={margin.top + chartHeight / 2} textAnchor="middle" transform={`rotate(-90 16 ${margin.top + chartHeight / 2})`} className="fill-ink text-xs font-semibold">{yLabel}</text>
      </svg>
    </div>
  );
}
