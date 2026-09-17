import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Text } from "../ui/typography";

const loadingMessages = [
  "Armazenando dados...",
  "Calculando...",
  "Atribuindo variáveis...",
  "Prevendo números da Mega-Sena...",
  "Fazendo um cafézinho...",
];

export function ImportLoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((currentIndex) =>
        (currentIndex + 1) % loadingMessages.length,
      );
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[#03060b]/72 px-6 text-center backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Processando planilha"
    >
      <div className="flex flex-col items-center">
        <span className="grid size-16 place-items-center rounded-3xl border border-brand-200/30 bg-paper/10 text-brand-100 shadow-soft">
          <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />
        </span>
        <Text as="p" variant="h3" className="mt-5 text-white">
          {loadingMessages[messageIndex]}
        </Text>
        <Text as="p" variant="caption" className="mt-2 text-white/65">
          Isso pode levar alguns instantes.
        </Text>
      </div>
    </div>
  );
}
