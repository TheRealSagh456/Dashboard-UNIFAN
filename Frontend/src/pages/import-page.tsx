import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCloudUpload,
  LucideLink,
  LucideUpload,
} from "lucide-react";
import {
  Button,
  Card,
  QuestionsGrid,
  Stepper,
  Text,
  TextField,
} from "../components";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { PerguntaRow } from "../components/ui/question-grid";

const perguntasMockadas: PerguntaRow[] = [
  {
    id: "meta-data-hora",
    codigo: "META-01",
    enunciado: "Data e hora de envio",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "meta-identificador",
    codigo: "META-02",
    enunciado: "Identificador externo",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "meta-email",
    codigo: "META-03",
    enunciado: "E-mail",
    papel: "Metadado",
    tipo: null,
  },
  {
    id: "q01",
    codigo: "Q01",
    enunciado: "Qual é a sua idade?",
    papel: "Pergunta",
    tipo: "Quantitativa discreta",
  },
  {
    id: "q03",
    codigo: "Q03",
    enunciado: "Quantas horas por dia você usa a internet?",
    papel: "Pergunta",
    tipo: "Quantitativa contínua",
  },
  {
    id: "q11",
    codigo: "Q11",
    enunciado: "Qual é o seu gênero?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
  {
    id: "q12",
    codigo: "Q12",
    enunciado: "Qual é a sua escolaridade?",
    papel: "Pergunta",
    tipo: "Qualitativa ordinal",
  },
  {
    id: "q14",
    codigo: "Q14",
    enunciado: "Qual ferramenta de IA você mais utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
  {
    id: "q15",
    codigo: "Q15",
    enunciado: "Com que frequência você utiliza ferramentas de IA?",
    papel: "Pergunta",
    tipo: "Qualitativa ordinal",
  },
  {
    id: "q24",
    codigo: "Q24",
    enunciado: "Qual sistema operacional de celular você utiliza?",
    papel: "Pergunta",
    tipo: "Qualitativa nominal",
  },
];

export function ImportPage() {
  const [etapa, setEtapa] = useState<number>(1);

  const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center h-screen flex-col gap-10 w-auto">
      <Stepper
        currentStep={etapa}
        steps={["Importar", "Configurar", "Finalizar"]}
        className="w-2xl"
      />
      <div className="w-auto flex flex-col justify-center">
        {etapa == 2 && (
          <div className="flex flex-col gap-2 pb-5">
            <Text variant={"data"}>Configure suas perguntas</Text>
            <Text variant={"label"}>
              Analise a classificação das variáveis. Você pode editar as
              informações se necessário.
            </Text>
          </div>
        )}
        <Card className="flex flex-col items-center gap-4 w-auto">
          {etapa == 1 && (
            <>
              <LucideUpload size={50} color="#a9531f" />
              <Text variant={"h2"}>Adicionar formulário</Text>
              <Text variant={"label"} tone={"accent"}>
                Faça o upload de um arquivo CSV, XLSV ou cole o link do Google
                Sheets
              </Text>

              <div
                className={`
          w-full border border-gray-300 rounded-2xl flex flex-col gap-5 justify-center 
          items-center p-5 cursor-pointer hover:bg-brand-50 transition hover:border-brand-200
          `}
              >
                <LucideCloudUpload size={40} color="#a9531f" />
                <div className="flex flex-col items-center justify-center">
                  <Text variant={"label"}>
                    Arraste e solte seu arquivo aqui
                  </Text>
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
            </>
          )}
          {etapa == 2 && (
            <QuestionsGrid perguntasIniciais={perguntasMockadas} />
          )}
        </Card>
        <div className="flex justify-between items-center pt-5">
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
      </div>
    </div>
  );
}
