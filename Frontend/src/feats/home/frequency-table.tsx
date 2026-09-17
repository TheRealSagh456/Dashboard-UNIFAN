import { Info, Table2 } from "lucide-react";
import { Card, DataTableSurface, Text, Tooltip } from "../../components";
import {
  totalRespostasValidas,
  type PerguntaDashboard,
} from "./dashboard-data";

type LinhaFrequencia = {
  classe: number;
  dados: string;
  fi: number;
  fiAcumulada: number;
  fr: number;
  frAcumulada: number;
};

const formatadorInteiro = new Intl.NumberFormat("pt-BR");
const formatadorDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const formatadorPercentual = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const definicoes = {
  Classe: "Número sequencial da faixa ou categoria.",
  Dados: "Valor, categoria ou intervalo representado pela classe.",
  fi: "Frequência absoluta: quantidade de respostas na classe.",
  "fi (acu)": "Frequência absoluta acumulada até a classe atual.",
  fr: "Frequência relativa: fi dividida pelo total de respostas válidas.",
  "fr (acu)": "Soma das frequências relativas até a classe atual.",
  "fr%": "Frequência relativa multiplicada por 100.",
  "fr% (acu)": "Frequência relativa acumulada multiplicada por 100.",
};

function calcularFrequencias(pergunta: PerguntaDashboard): LinhaFrequencia[] {
  const total = totalRespostasValidas(pergunta);
  let fiAcumulada = 0;

  return pergunta.distribuicao.map((item, index) => {
    fiAcumulada += item.fi;
    return {
      classe: index + 1,
      dados: item.dados,
      fi: item.fi,
      fiAcumulada,
      fr: item.fi / total,
      frAcumulada: fiAcumulada / total,
    };
  });
}

function CabecalhoTabela({ nome }: { nome: keyof typeof definicoes }) {
  return (
    <Tooltip<HTMLSpanElement> content={definicoes[nome]}>
      {(triggerProps) => (
        <span
          {...triggerProps}
          className="inline-flex cursor-help items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {nome}
          <Info className="size-3" aria-hidden="true" />
        </span>
      )}
    </Tooltip>
  );
}

function CampoFrequencia({
  label,
  value,
}: {
  label: keyof typeof definicoes;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface px-3 py-2">
      <Tooltip<HTMLSpanElement> content={definicoes[label]}>
        {(triggerProps) => (
          <span
            {...triggerProps}
            className="inline-flex cursor-help items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {label}
            <Info className="size-3" aria-hidden="true" />
          </span>
        )}
      </Tooltip>
      <Text
        as="strong"
        variant="label"
        className="mt-1 block truncate tabular-nums"
      >
        {value}
      </Text>
    </div>
  );
}

export function TabelaFrequencias({
  pergunta,
}: {
  pergunta: PerguntaDashboard;
}) {
  const linhas = calcularFrequencias(pergunta);
  const total = totalRespostasValidas(pergunta);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <span className="flex items-center gap-2 text-brand-700">
            <Table2 className="size-4" aria-hidden="true" />
            <Text as="h2" variant="h3">
              Distribuição de frequências
            </Text>
          </span>
          <Text variant="caption" tone="muted" className="mt-1">
            Passe o cursor ou use o teclado nos títulos para consultar cada
            definição.
          </Text>
        </div>
        <Text variant="caption" tone="muted">
          {formatadorInteiro.format(total)} respostas válidas
        </Text>
      </div>

      <DataTableSurface embedded scrollable={false} className="hidden lg:block">
        <table className="w-full table-fixed border-collapse text-left text-xs xl:text-sm">
          <caption className="sr-only">
            Tabela de distribuição de frequências da pergunta {pergunta.codigo}
          </caption>
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[24%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="bg-surface text-[0.65rem] uppercase tracking-[0.05em] text-muted">
            <tr>
              {(Object.keys(definicoes) as Array<keyof typeof definicoes>).map(
                (coluna) => (
                  <th
                    key={coluna}
                    scope="col"
                    className="border-b border-line px-2 py-3 font-semibold xl:px-3"
                  >
                    <CabecalhoTabela nome={coluna} />
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr
                key={linha.classe}
                className="border-b border-line/70 last:border-0 hover:bg-brand-50/55"
              >
                <th scope="row" className="px-2 py-3 font-semibold xl:px-3">
                  {linha.classe}
                </th>
                <td className="truncate px-2 py-3 xl:px-3" title={linha.dados}>
                  {linha.dados}
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorInteiro.format(linha.fi)}
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorInteiro.format(linha.fiAcumulada)}
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorDecimal.format(linha.fr)}
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorDecimal.format(linha.frAcumulada)}
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorPercentual.format(linha.fr * 100)}%
                </td>
                <td className="px-2 py-3 tabular-nums xl:px-3">
                  {formatadorPercentual.format(linha.frAcumulada * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface font-semibold">
            <tr>
              <th className="px-2 py-3 xl:px-3" colSpan={2}>
                Total
              </th>
              <td className="px-2 py-3 tabular-nums xl:px-3">
                {formatadorInteiro.format(total)}
              </td>
              <td className="px-2 py-3 tabular-nums xl:px-3">
                {formatadorInteiro.format(total)}
              </td>
              <td className="px-2 py-3 tabular-nums xl:px-3">1,000</td>
              <td className="px-2 py-3 tabular-nums xl:px-3">1,000</td>
              <td className="px-2 py-3 tabular-nums xl:px-3">100,0%</td>
              <td className="px-2 py-3 tabular-nums xl:px-3">100,0%</td>
            </tr>
          </tfoot>
        </table>
      </DataTableSurface>

      <div className="grid gap-3 p-4 lg:hidden">
        {linhas.map((linha) => (
          <section
            key={linha.classe}
            className="rounded-2xl border border-line bg-paper p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <BadgeClasse classe={linha.classe} />
              <Text as="strong" variant="label" className="truncate">
                {linha.dados}
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              <CampoFrequencia
                label="fi"
                value={formatadorInteiro.format(linha.fi)}
              />
              <CampoFrequencia
                label="fi (acu)"
                value={formatadorInteiro.format(linha.fiAcumulada)}
              />
              <CampoFrequencia
                label="fr"
                value={formatadorDecimal.format(linha.fr)}
              />
              <CampoFrequencia
                label="fr (acu)"
                value={formatadorDecimal.format(linha.frAcumulada)}
              />
              <CampoFrequencia
                label="fr%"
                value={`${formatadorPercentual.format(linha.fr * 100)}%`}
              />
              <CampoFrequencia
                label="fr% (acu)"
                value={`${formatadorPercentual.format(linha.frAcumulada * 100)}%`}
              />
            </div>
          </section>
        ))}
      </div>

      <Text
        variant="caption"
        tone="muted"
        className="border-t border-line px-5 py-3 sm:px-6"
      >
        Nas variáveis nominais, os acumulados seguem apenas a ordem em que as
        categorias são exibidas.
      </Text>
    </Card>
  );
}

function BadgeClasse({ classe }: { classe: number }) {
  return (
    <span className="rounded-full border border-brand-200 bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
      Classe {classe}
    </span>
  );
}
