import type { ComponentProps } from "react";
import { Text } from "./typography";
import { cn } from "../../lib/cn";

export type TipoVariavel = "Quantitativa" | "Qualitativa";

export type SubtipoQuantitativa = "Discreta" | "Contínua";

export type SubtipoQualitativa = "Nominal" | "Ordinal";

export type PerguntaRow = ComponentProps<"div"> & {
  id: string;
  codigo: string;
  pergunta: string;
  papel: "Pergunta" | "Metadado";
  tipo: TipoVariavel | null;
  classificacao: SubtipoQualitativa | SubtipoQuantitativa | null;
};

export function QuestionsGrid({
  codigo,
  pergunta,
  tipo,
  classificacao,
  className,
  ...props
}: PerguntaRow) {
  return (
    <div className={cn("flex w-full", className)} {...props}>
      <Text>{codigo}</Text>
      <Text>{pergunta}</Text>
      <Text>{tipo}</Text>
      <Text>{classificacao}</Text>
    </div>
  );
}
