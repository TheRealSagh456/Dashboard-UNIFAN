import { DataGrid, type GridColDef } from "@mui/x-data-grid";

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
    width: 120,
    headerAlign: "center",
    align: "center",
  },
  {
    field: "enunciado",
    headerName: "Pergunta",
    flex: 1,
    minWidth: 280,
  },
  {
    field: "papel",
    headerName: "Classificação",
    type: "singleSelect",
    valueOptions: ["Pergunta", "Metadado"],
    editable: true,
    width: 160,
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
    width: 210,
  },
];

type QuestionsGridProps = {
  perguntas: PerguntaRow[];
  onPerguntasChange: (perguntas: PerguntaRow[]) => void;
  busca?: string;
  somentePerguntas?: boolean;
};

export function QuestionsGrid({
  perguntas,
  onPerguntasChange,
  busca = "",
  somentePerguntas = false,
}: QuestionsGridProps) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const linhas = perguntas.filter((pergunta) => {
    if (somentePerguntas && pergunta.papel !== "Pergunta") return false;
    if (!termo) return true;
    return `${pergunta.codigo} ${pergunta.enunciado} ${pergunta.papel} ${pergunta.tipo ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(termo);
  });

  return (
    <div className="h-[34rem] w-full">
      <DataGrid
        rows={linhas}
        columns={colunas}
        editMode="row"
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        isCellEditable={(params) =>
          params.field === "papel" ||
          (params.field === "tipo" && params.row.papel === "Pergunta")
        }
        processRowUpdate={(atualizada) => {
          const normalizada =
            atualizada.papel === "Metadado"
              ? { ...atualizada, tipo: null }
              : atualizada;
          onPerguntasChange(
            perguntas.map((pergunta) =>
              pergunta.id === normalizada.id ? normalizada : pergunta,
            ),
          );
          return normalizada;
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
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "var(--color-brand-50)",
          },
        }}
      />
    </div>
  );
}
