import type { RefObject } from "react";
import { mockRequestDelay } from "./api";

export type ExportFormat = "jpeg" | "pdf" | "xlsx" | "csv";
export type VisualExportScope = "current" | "full";
export type DataExportScope = "all" | "question";

type CurrentVisualExportOptions = {
  format: "jpeg" | "pdf";
  currentTarget: RefObject<HTMLElement | null>;
};

type DashboardPdfExportOptions = {
  pageTargets: HTMLElement[];
  onProgress?: (current: number, total: number) => void;
};

type DataExportOptions = {
  format: "xlsx" | "csv";
  scope: DataExportScope;
  questionId?: string;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function waitForPaint() {
  return new Promise<void>((resolve) =>
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => resolve()),
    ),
  );
}

async function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível preparar a imagem."));
    image.src = dataUrl;
  });
}

type TemporaryAnimationClasses = {
  element: SVGElement;
  classNames: string[];
};

type TemporarySvgStyle = {
  element: SVGElement;
  property: string;
  value: string;
  priority: string;
};

function lockChartsInFinalState(target: HTMLElement) {
  const animationClassNames = [
    "chart-bar-rise-horizontal",
    "chart-bar-rise-vertical",
    "chart-line-draw",
    "chart-point-enter",
    "chart-boxplot-cap",
    "chart-boxplot-span",
    "chart-boxplot-box",
    "chart-pie-reveal",
  ];
  const selector = animationClassNames
    .map((className) => `.${className}`)
    .join(",");
  const animatedElements: TemporaryAnimationClasses[] = Array.from(
    target.querySelectorAll<SVGElement>(selector),
    (element) => ({
      element,
      classNames: animationClassNames.filter((className) =>
        element.classList.contains(className),
      ),
    }),
  );

  animatedElements.forEach(({ element, classNames }) => {
    element.classList.remove(...classNames);
  });

  return () => {
    animatedElements.forEach(({ element, classNames }) => {
      element.classList.add(...classNames);
    });
  };
}

function lockSvgPresentationStyles(target: HTMLElement) {
  const properties = [
    "color",
    "fill",
    "fill-opacity",
    "opacity",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-opacity",
    "stroke-width",
  ];
  const previousStyles: TemporarySvgStyle[] = [];

  target.querySelectorAll<SVGElement>("svg *").forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    properties.forEach((property) => {
      const computedValue = computedStyle.getPropertyValue(property);
      if (!computedValue) return;

      previousStyles.push({
        element,
        property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      });
      element.style.setProperty(property, computedValue, "important");
    });
  });

  return () => {
    previousStyles.forEach(({ element, property, value, priority }) => {
      if (value) {
        element.style.setProperty(property, value, priority);
      } else {
        element.style.removeProperty(property);
      }
    });
  };
}

function parseCssColor(color: string): [number, number, number] | null {
  const rgb = color.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  const hex = color.match(/^#([\da-f]{6})$/i)?.[1];
  if (!hex) return null;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function fillPdfBackground(
  pdf: import("jspdf").jsPDF,
  color: string,
  width: number,
  height: number,
) {
  const [red, green, blue] = parseCssColor(color) ?? [242, 232, 220];
  pdf.setFillColor(red, green, blue);
  pdf.rect(0, 0, width, height, "F");
}

function prepareTargetForCapture(target: HTMLElement) {
  target.classList.add("export-capturing");
  const restoreChartStyles = lockChartsInFinalState(target);
  const restoreSvgStyles = lockSvgPresentationStyles(target);

  return () => {
    restoreSvgStyles();
    restoreChartStyles();
    target.classList.remove("export-capturing");
  };
}

export async function exportCurrentVisual({
  format,
  currentTarget,
}: CurrentVisualExportOptions) {
  const screenTarget = currentTarget.current;
  if (!screenTarget) throw new Error("A área do dashboard ainda não está pronta.");

  const target =
    format === "pdf"
      ? screenTarget.querySelector<HTMLElement>(":scope > main") ?? screenTarget
      : screenTarget;
  const restoreTarget = prepareTargetForCapture(target);
  await waitForPaint();

  try {
    const { toJpeg, toPng } = await import("html-to-image");
    const backgroundColor = getComputedStyle(screenTarget).backgroundColor;
    const options = {
      backgroundColor,
      cacheBust: true,
      pixelRatio: 1.5,
      filter: (node: HTMLElement) =>
        node.dataset?.exportExclude !== "true",
    };

    if (format === "jpeg") {
      const dataUrl = await toJpeg(target, { ...options, quality: 0.95 });
      downloadDataUrl(dataUrl, "unifan-tela-atual.jpg");
      return;
    }

    const dataUrl = await toPng(target, options);
    const image = await loadImage(dataUrl);
    const { jsPDF } = await import("jspdf");
    const orientation = image.width >= image.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scale = Math.min(
      availableWidth / image.width,
      availableHeight / image.height,
    );
    const renderedWidth = image.width * scale;
    const renderedHeight = image.height * scale;
    const offsetX = (pageWidth - renderedWidth) / 2;
    const offsetY = (pageHeight - renderedHeight) / 2;

    fillPdfBackground(pdf, backgroundColor, pageWidth, pageHeight);
    pdf.addImage(
      dataUrl,
      "PNG",
      offsetX,
      offsetY,
      renderedWidth,
      renderedHeight,
      undefined,
      "FAST",
    );
    pdf.save("unifan-tela-atual.pdf");
  } finally {
    restoreTarget();
  }
}

export async function exportDashboardPdf({
  pageTargets,
  onProgress,
}: DashboardPdfExportOptions) {
  if (pageTargets.length === 0) {
    throw new Error("As páginas do relatório ainda não estão prontas.");
  }

  await document.fonts.ready;
  const { toJpeg } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let index = 0; index < pageTargets.length; index += 1) {
    const target = pageTargets[index];
    const restoreTarget = prepareTargetForCapture(target);
    onProgress?.(index + 1, pageTargets.length);
    await waitForPaint();

    try {
      const backgroundColor = getComputedStyle(target).backgroundColor;
      const dataUrl = await toJpeg(target, {
        backgroundColor,
        cacheBust: true,
        pixelRatio: 1.25,
        quality: 0.92,
        filter: (node: HTMLElement) => node.dataset?.exportExclude !== "true",
      });

      if (index > 0) pdf.addPage("a4", "portrait");
      fillPdfBackground(pdf, backgroundColor, pageWidth, pageHeight);
      pdf.addImage(
        dataUrl,
        "JPEG",
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        "FAST",
      );
    } finally {
      restoreTarget();
    }
  }

  pdf.save("unifan-dashboard-completo.pdf");
}

function fileNameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function exportData({
  format,
  scope,
  questionId,
}: DataExportOptions) {
  const params = new URLSearchParams({ format, scope });
  if (questionId) params.set("questionId", questionId);

  const [response] = await Promise.all([
    fetch(`/api/exportacoes/dados?${params}`, {
      headers: { Accept: "application/octet-stream, application/json" },
    }),
    mockRequestDelay(),
  ]);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      body?.error?.message ?? "Não foi possível gerar a exportação de dados.",
    );
  }

  const fallback = `unifan-exportacao.${format}`;
  const fileName = fileNameFromDisposition(
    response.headers.get("Content-Disposition"),
    fallback,
  );
  downloadBlob(await response.blob(), fileName);
}
