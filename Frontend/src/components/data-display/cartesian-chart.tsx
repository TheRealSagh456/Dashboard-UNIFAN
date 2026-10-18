import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from "react";
import { useChartInteraction } from "../../hooks/use-chart-interaction";
import { cn } from "../../lib/cn";
import { criarEscalaAgradavel, criarEscalaIntervalo } from "../../utils/chart-scale";
import { formatarValorDoEixo, quebrarRotulo } from "../../utils/chart-layout";
import { Tooltip, type TooltipTriggerProps } from "../ui/tooltip";

export type CartesianChartDatum = {
  label: string;
  value: number;
  xValue?: number;
  detail?: string;
  histogram?: {
    lowerBound: number;
    upperBound: number;
    density: number;
  };
};

type HistogramDatum = CartesianChartDatum & {
  histogram: NonNullable<CartesianChartDatum["histogram"]>;
};

function hasHistogramIntervals(data: CartesianChartDatum[]): data is HistogramDatum[] {
  return data.length > 0 && data.every(({ histogram }, index) =>
    histogram !== undefined &&
    Number.isFinite(histogram.lowerBound) &&
    Number.isFinite(histogram.upperBound) &&
    histogram.upperBound > histogram.lowerBound &&
    Number.isFinite(histogram.density) &&
    histogram.density >= 0 &&
    (index === 0 || data[index - 1].histogram?.upperBound === histogram.lowerBound),
  );
}

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
  const histogramData = variant === "histogram" && hasHistogramIntervals(data) ? data : null;

  if (variant === "histogram" && !histogramData) {
    return <p role="status" className="py-8 text-center text-sm text-muted">Os intervalos do histograma ainda não estão disponíveis.</p>;
  }

  if (!data.length) return <p role="status" className="py-8 text-center text-sm text-muted">Não há dados para exibir.</p>;

  const width = 760;
  const height = Math.max(360, horizontal ? data.length * 52 + 125 : 360);
  const margin = { top: 24, right: 24, bottom: horizontal ? 64 : 92, left: horizontal ? 210 : 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const baseline = margin.top + chartHeight;
  const maiorValor = data.reduce((maior, item, index) => Math.max(maior, histogramData?.[index].histogram.density ?? item.value), 0);
  const scale = criarEscalaAgradavel(maiorValor, 5, !histogramData);
  const numerico = variant === "line" && data.every((item) => item.xValue !== undefined);
  const valoresX = data.map((item) => item.xValue ?? 0);
  const escalaX = numerico ? criarEscalaIntervalo(Math.min(...valoresX), Math.max(...valoresX)) : null;
  const posicaoX = (valor: number) => margin.left + ((valor - escalaX!.inicio) / (escalaX!.limite - escalaX!.inicio)) * chartWidth;
  const band = horizontal ? chartHeight / data.length : chartWidth / data.length;
  const gap = histogramData ? 0 : Math.min(18, band * 0.24);
  const lowerBound = histogramData?.[0].histogram.lowerBound ?? 0;
  const upperBound = histogramData?.[histogramData.length - 1].histogram.upperBound ?? 1;
  const boundaries = histogramData ? [lowerBound, ...histogramData.map((item) => item.histogram.upperBound)] : [];
  const boundaryLabelStep = Math.max(1, Math.ceil(
    (boundaries.reduce((maior, valor) => Math.max(maior, formatarValorDoEixo(valor).length), 0) * 6 + 12)
      / (chartWidth / Math.max(1, boundaries.length - 1)),
  ));
  const intervalPosition = (value: number) =>
    margin.left + ((value - lowerBound) / (upperBound - lowerBound)) * chartWidth;
  const points = data.map((item, index) => {
    const interval = histogramData?.[index].histogram;
    const left = interval ? intervalPosition(interval.lowerBound) : margin.left + band * index + gap / 2;
    const right = interval ? intervalPosition(interval.upperBound) : left + band - gap;

    return {
      item,
      left,
      barWidth: right - left,
      x: horizontal ? margin.left + (item.value / scale.limite) * chartWidth : numerico ? posicaoX(item.xValue!) : (left + right) / 2,
      y: horizontal ? margin.top + band * index + band / 2 : baseline - ((interval?.density ?? item.value) / scale.limite) * chartHeight,
    };
  });
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
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full min-w-[42rem]" role="img" aria-label={ariaLabel}>
        {scale.marcacoes.map((tick) => {
          const x = margin.left + (tick / scale.limite) * chartWidth;
          const y = baseline - (tick / scale.limite) * chartHeight;
          return horizontal ? (
            <g key={tick}>
              <line x1={x} x2={x} y1={margin.top} y2={baseline} className="stroke-line stroke-1" />
              <text x={x} y={height - 42} textAnchor="middle" className="fill-muted text-[11px]">{formatarValorDoEixo(tick)}</text>
            </g>
          ) : (
            <g key={tick}>
              <line x1={margin.left} x2={margin.left + chartWidth} y1={y} y2={y} className="stroke-line stroke-1" />
              <text x={margin.left - 12} y={y + 4} textAnchor="end" className="fill-muted text-[11px]">{formatarValorDoEixo(tick)}</text>
            </g>
          );
        })}

        {horizontal ? (
          points.map((point, index) => {
            const selected = selectedIndex === index;
            const top = point.y - band * 0.3;
            return (
              <g key={index}>
                <text x={margin.left - 12} y={point.y + 4} textAnchor="end" className="fill-ink text-[11px]">
                  <title>{point.item.label}</title>
                  {quebrarRotulo(point.item.label, 27, 2).map((linha, i) => <tspan key={i} x={margin.left - 12} dy={i === 0 ? -4 : 14}>{linha}</tspan>)}
                </text>
                <Tooltip<SVGPathElement> pinned={selected} content={<TooltipContent item={point.item} />}>
                  {(triggerProps) => (
                    <path
                      {...triggerProps}
                      {...interactionProps(index, triggerProps)}
                      data-chart-item
                      data-selected={selected}
                      d={horizontalBarPath(margin.left, top, point.x, band * 0.6, 0)}
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
                <Tooltip<SVGCircleElement> key={index} pinned={selected} content={<TooltipContent item={point.item} />}>
                  {(triggerProps) => (
                    <circle
                      {...triggerProps}
                      {...interactionProps(index, triggerProps)}
                      data-chart-item
                      data-selected={selected}
                      cx={point.x}
                      cy={point.y}
                      r={Math.max(2, Math.min(6, chartWidth / data.length / 4))}
                      className={cn(
                        itemClasses(selected),
                        "chart-point-enter stroke-[3]",
                      )}
                      style={{ animationDelay: `${220 + (index / Math.max(1, data.length - 1)) * 600}ms` }}
                    />
                  )}
                </Tooltip>
              );
            })}
          </>
        ) : (
          points.map((point, index) => {
            const selected = selectedIndex === index;
            return (
              <Tooltip<SVGPathElement> key={point.item.label} pinned={selected} content={<TooltipContent item={point.item} />}>
                {(triggerProps) => (
                  <path
                    {...triggerProps}
                    {...interactionProps(index, triggerProps)}
                    data-chart-item
                    data-selected={selected}
                    d={verticalBarPath(point.left, point.y, point.barWidth, baseline, 0)}
                    className={cn("chart-bar-rise-vertical", itemClasses(selected))}
                    style={{ strokeWidth: Math.min(2, point.barWidth / 4) }}
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

        {boundaries.map((boundary, index) => (
          <g key={boundary}>
            <line x1={intervalPosition(boundary)} x2={intervalPosition(boundary)} y1={baseline} y2={baseline + 5} className="stroke-ink stroke-1" />
            {(index === boundaries.length - 1 || (index % boundaryLabelStep === 0 && index < boundaries.length - 1 - boundaryLabelStep / 2)) && <text x={intervalPosition(boundary)} y={baseline + 20} textAnchor="middle" className="fill-muted text-[10px]">
              {formatarValorDoEixo(boundary)}
            </text>}
          </g>
        ))}

        {escalaX && escalaX.marcacoes.map((tick) => (
          <g key={tick}>
            <line x1={posicaoX(tick)} x2={posicaoX(tick)} y1={baseline} y2={baseline + 5} className="stroke-ink" />
            <text x={posicaoX(tick)} y={baseline + 20} textAnchor="middle" className="fill-muted text-[10px]">{formatarValorDoEixo(tick)}</text>
          </g>
        ))}
        {!horizontal && !histogramData && !numerico && points.map((point, index) => {
          const passo = Math.max(1, Math.ceil(data.length / 10));
          if (index % passo !== 0 && index !== points.length - 1) return null;
          // Os dados permanecem completos; apenas os rótulos são espaçados.
          if (index === points.length - 1 && index % passo !== 0 && index % passo < passo / 2) return null;
          return (
            <text key={index} x={point.x} y={baseline + 20} textAnchor="middle" className="fill-muted text-[10px]">
              <title>{point.item.label}</title>
              {quebrarRotulo(point.item.label, Math.max(7, Math.floor(band * passo / 6)), 3).map((linha, i) => (
                <tspan key={i} x={point.x} dy={i === 0 ? 0 : 13}>{linha}</tspan>
              ))}
            </text>
          );
        })}

        <text x={margin.left + chartWidth / 2} y={height - 8} textAnchor="middle" className="fill-ink text-xs font-semibold">{xLabel}</text>
        <text x="16" y={margin.top + chartHeight / 2} textAnchor="middle" transform={`rotate(-90 16 ${margin.top + chartHeight / 2})`} className="fill-ink text-xs font-semibold">{yLabel}</text>
      </svg>
    </div>
  );
}
