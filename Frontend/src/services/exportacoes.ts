import type { RefObject } from "react";
import { mockRequestDelay } from "./api";

export type ExportFormat = "jpeg" | "pdf" | "xlsx" | "csv";
export type VisualExportScope = "current" | "full";
export type DataExportScope = "all" | "question";

type VisualExportOptions = {
  format: "jpeg" | "pdf";
  scope: VisualExportScope;
  currentTarget: RefObject<HTMLElement | null>;
  fullTarget: RefObject<HTMLElement | null>;
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

function getExportFileName(scope: VisualExportScope, extension: string) {
  const suffix = scope === "full" ? "dashboard-completo" : "tela-atual";
  return `unifan-${suffix}.${extension}`;
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

const MAX_PDF_REDUCTION_TO_AVOID_TRAILING_PAGE = 0.15;
const MAX_TRAILING_PAGE_OCCUPANCY = 0.25;

function getPdfImageDimensions(
  image: HTMLImageElement,
  pageWidth: number,
  pageHeight: number,
) {
  const naturalHeight = (image.height * pageWidth) / image.width;
  const naturalPageCount = Math.max(1, Math.ceil(naturalHeight / pageHeight));

  if (naturalPageCount === 1) {
    return { width: pageWidth, height: naturalHeight, offsetX: 0 };
  }

  const precedingPagesHeight = (naturalPageCount - 1) * pageHeight;
  const trailingHeight = naturalHeight - precedingPagesHeight;
  const trailingOccupancy = trailingHeight / pageHeight;
  const reduction = 1 - precedingPagesHeight / naturalHeight;

  if (
    trailingOccupancy <= MAX_TRAILING_PAGE_OCCUPANCY &&
    reduction <= MAX_PDF_REDUCTION_TO_AVOID_TRAILING_PAGE
  ) {
    const scale = precedingPagesHeight / naturalHeight;
    const width = pageWidth * scale;
    return {
      width,
      height: precedingPagesHeight,
      offsetX: (pageWidth - width) / 2,
    };
  }

  return { width: pageWidth, height: naturalHeight, offsetX: 0 };
}

export async function exportVisual({
  format,
  scope,
  currentTarget,
  fullTarget,
}: VisualExportOptions) {
  const target = scope === "full" ? fullTarget.current : currentTarget.current;
  if (!target) throw new Error("A área do dashboard ainda não está pronta.");

  target.classList.add("export-capturing");
  const restoreChartStyles = lockChartsInFinalState(target);
  const restoreSvgStyles = lockSvgPresentationStyles(target);
  await waitForPaint();

  try {
    const { toJpeg, toPng } = await import("html-to-image");
    const backgroundColor = getComputedStyle(target).backgroundColor;
    const options = {
      backgroundColor,
      cacheBust: true,
      pixelRatio: 1.5,
      filter: (node: HTMLElement) =>
        node.dataset?.exportExclude !== "true",
    };

    if (format === "jpeg") {
      const dataUrl = await toJpeg(target, { ...options, quality: 0.95 });
      downloadDataUrl(dataUrl, getExportFileName(scope, "jpg"));
      return;
    }

    const dataUrl = await toPng(target, options);
    const image = await loadImage(dataUrl);
    const { jsPDF } = await import("jspdf");
    const orientation = image.width >= image.height ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const rendered = getPdfImageDimensions(
      image,
      pageWidth,
      pageHeight,
    );
    const pageCount = Math.max(1, Math.ceil(rendered.height / pageHeight));

    for (let page = 0; page < pageCount; page += 1) {
      if (page > 0) pdf.addPage("a4", orientation);
      pdf.addImage(
        dataUrl,
        "PNG",
        rendered.offsetX,
        -page * pageHeight,
        rendered.width,
        rendered.height,
        undefined,
        "FAST",
      );
    }

    pdf.save(getExportFileName(scope, "pdf"));
  } finally {
    restoreSvgStyles();
    restoreChartStyles();
    target.classList.remove("export-capturing");
  }
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
