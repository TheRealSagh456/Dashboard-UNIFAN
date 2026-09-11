import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCloudUpload,
  LucideLink,
  LucideUpload,
} from "lucide-react";
import { Button, Card, Stepper, Text, TextField } from "../components";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function ImportPage() {
  const [etapa, setEtapa] = useState<number>(1);

  const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center h-screen flex-col gap-10">
      <Stepper
        currentStep={etapa}
        steps={["Importar", "Configurar", "Finalizar"]}
        className="w-2xl"
      />
      <Card className="flex flex-col items-center gap-4 w-2xl">
        <LucideUpload size={50} color="#a9531f" />
        <Text variant={"h2"}>Adicionar formulário</Text>
        <Text variant={"label"} tone={"accent"}>
          Faça o upload de um arquivo CSV, XLSV ou cole o link do Google Sheets
        </Text>

        <div
          className={`
          w-full border border-gray-300 rounded-2xl flex flex-col gap-5 justify-center 
          items-center p-5 cursor-pointer hover:bg-brand-50 transition hover:border-brand-200
          `}
        >
          <LucideCloudUpload size={40} color="#a9531f" />
          <div className="flex flex-col items-center justify-center">
            <Text variant={"label"}>Arraste e solte seu arquivo aqui</Text>
            <Text>ou clique para selecionar</Text>
          </div>
        </div>
        <div className="flex gap-2 justify-center items-center">
          <Text variant={"eyebrow"}>Formatos aceitos: </Text>
          <Text variant={"eyebrow"} tone={"accent"} className="text-xs">
            CSV e XLSX
          </Text>
        </div>

        <div className="border-t border-line w-full flex flex-col items-center py-5 gap-4">
          <Text variant={"label"} tone={"accent"}>
            Ou cole o link do Google Sheets
          </Text>
          <div className="relative w-full">
            <TextField
              placeholder="https://docs.google/spreadssheets/d/..."
              className="w-full pr-11"
            />
            <LucideLink
              color="gray"
              className="pointer-events-none absolute top-1/2 right-3 z-10 size-5 -translate-y-1/2"
            />
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <Button
            variant={"ghost"}
            onClick={() => {
              if (etapa > 1) {
                setEtapa(etapa - 1);
              } else {
                navigate("/");
              }
            }}
          >
            <LucideArrowLeft />
            Voltar
          </Button>
          <Button
            onClick={() => {
              if (etapa < 3) {
                setEtapa(etapa + 1);
              }
            }}
          >
            {etapa == 3 ? "Finalizar" : "Continuar"}
            {etapa < 3 ? <LucideArrowRight /> : <LucideCheck />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
