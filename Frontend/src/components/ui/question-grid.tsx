import { useState } from "react";
import { DataGrid, type GridColDef, type GridRowsProp } from "@mui/x-data-grid";

export type TipoVariavel =
  | "Quantitativa discreta"
  | "Quantitativa contínua"
  | "Qualitativa nominal"
  | "Qualitativa ordinal";

export type PerguntaRow = {
  id: string;
  codigo: string;
  enunciado: string;
  papel: "Pergunta" | "Metadado";
  tipo: TipoVariavel | null;
};

const colunas: GridColDef<PerguntaRow>[] = [
  {
    field: "codigo",
    headerName: "Código",
    width: 150,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "enunciado",
    headerName: "Pergunta",
    flex: 1,
    minWidth: 300,

    headerAlign: "center",
    align: "center",
  },
  {
    field: "papel",
    headerName: "Classificação",
    type: "singleSelect",
    valueOptions: ["Pergunta", "Metadado"],
    editable: true,
    width: 160,

    headerAlign: "center",
    align: "center",
  },
  {
    field: "tipo",
    headerName: "Tipo da variável",
    type: "singleSelect",
    valueOptions: [
      "Quantitativa discreta",
      "Quantitativa contínua",
      "Qualitativa nominal",
      "Qualitativa ordinal",
    ],
    editable: true,
    width: 180,

    headerAlign: "center",
    align: "center",
  },
];

export function QuestionsGrid({
  perguntasIniciais,
}: {
  perguntasIniciais: GridRowsProp<PerguntaRow>;
}) {
  const [perguntas, setPerguntas] = useState(perguntasIniciais);

  return (
    <div className="h-140 w-full">
      <DataGrid
        rows={perguntas}
        columns={colunas}
        editMode="row"
        showToolbar
        ignoreDiacritics
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        processRowUpdate={(perguntaAtualizada) => {
          setPerguntas((atuais) =>
            atuais.map((pergunta) =>
              pergunta.id === perguntaAtualizada.id
                ? perguntaAtualizada
                : pergunta,
            ),
          );

          return perguntaAtualizada;
        }}
        onProcessRowUpdateError={(erro) => {
          console.error("Não foi possível atualizar a pergunta.", erro);
        }}
        sx={{
          borderColor: "var(--color-line)",
          backgroundColor: "var(--color-paper)",
          color: "var(--color-ink)",
          borderRadius: "16px",

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "var(--color-surface)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "var(--color-brand-50)",
          },
        }}
      />
    </div>
  );
}
