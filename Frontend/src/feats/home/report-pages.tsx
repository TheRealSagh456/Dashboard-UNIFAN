import {
  BarChart3,
  Calculator,
  Equal,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, MetricCard, Tag, Text } from "../../components";
import {
  pesquisaDemo,
  totalRespostasValidas,
  type PerguntaDashboard,
  type TipoGrafico,
} from "./dashboard-data";
import { TabelaFrequencias } from "./frequency-table";
import { VisualizacaoPergunta } from "./question-charts";

const REPORT_PAGE_WIDTH = 1240;
const REPORT_PAGE_HEIGHT = 1754;

const reportPageStyle = {
  width: `${REPORT_PAGE_WIDTH}px`,
  height: `${REPORT_PAGE_HEIGHT}px`,
} as const;

function MarcaRelatorio() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-brand-600 font-serif text-xl font-bold text-white shadow-card">
        Σ
      </span>
      <span>
        <Text as="strong" variant="label" tone="accent" className="block tracking-[0.12em]">
          UNIFAN
        </Text>
        <Text variant="caption" tone="muted">Analytics report</Text>
      </span>
    </div>
  );
}

export function ReportCoverPage({
  title,
  totalQuestions,
  totalResponses,
}: {
  title: string;
  totalQuestions: number;
  totalResponses: number;
}) {
  return (
    <article
      className="relative isolate flex overflow-hidden bg-canvas p-20 text-ink"
      style={reportPageStyle}
      data-pdf-report-page="cover"
    >
      <div className="absolute -right-40 -top-52 size-[700px] rounded-full bg-brand-100/70" />
      <div className="absolute -bottom-64 -left-52 size-[760px] rounded-full border-[92px] border-brand-100/55" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative z-10 flex w-full flex-col">
        <MarcaRelatorio />

        <div className="my-auto max-w-[890px]">
          <Badge tone="brand">Dashboard completo</Badge>
          <Text as="h1" className="mt-8 font-serif text-[72px] font-bold leading-[1.05] tracking-[-0.045em]">
            {title}
          </Text>
          <Text className="mt-7 max-w-[700px] text-2xl leading-relaxed" tone="muted">
            Relatório estatístico consolidado com visualizações e distribuições de frequência.
          </Text>
        </div>

        <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-4">
          <Card variant="outline" className="bg-paper/90">
            <Text variant="eyebrow" tone="muted">Perguntas</Text>
            <Text as="strong" variant="data" className="mt-2 block text-4xl">
              {totalQuestions}
            </Text>
          </Card>
          <Card variant="outline" className="bg-paper/90">
            <Text variant="eyebrow" tone="muted">Respostas</Text>
            <Text as="strong" variant="data" className="mt-2 block text-4xl">
              {totalResponses.toLocaleString("pt-BR")}
            </Text>
          </Card>
          <Card variant="outline" className="relative overflow-hidden bg-brand-600 text-white">
            <div className="absolute inset-x-0 bottom-0 flex h-24 items-end gap-3 px-6 opacity-35" aria-hidden="true">
              {[36, 62, 45, 82, 56, 94, 70].map((height, index) => (
                <span key={index} className="flex-1 rounded-t-lg bg-white" style={{ height: `${height}%` }} />
              ))}
            </div>
            <Text variant="eyebrow" className="relative text-white/75">Conteúdo</Text>
            <Text as="strong" className="relative mt-2 block text-xl font-semibold text-white">
              Dados · gráficos · aritmética
            </Text>
          </Card>
        </div>
      </div>
    </article>
  );
}

function MedidasRelatorio({ pergunta }: { pergunta: PerguntaDashboard }) {
  const medidas: Array<{ label: string; value: string; icon: LucideIcon }> = [];
  if (pergunta.medidas.media) medidas.push({ label: "Média", value: pergunta.medidas.media, icon: Calculator });
  if (pergunta.medidas.mediana) medidas.push({ label: "Mediana", value: pergunta.medidas.mediana, icon: Equal });
  if (pergunta.medidas.moda) medidas.push({ label: "Moda", value: pergunta.medidas.moda, icon: BarChart3 });
  if (pergunta.medidas.primeiroQuartil) medidas.push({ label: "Primeiro quartil", value: pergunta.medidas.primeiroQuartil, icon: Sigma });
  if (pergunta.medidas.terceiroQuartil) medidas.push({ label: "Terceiro quartil", value: pergunta.medidas.terceiroQuartil, icon: Sigma });

  if (medidas.length === 0) return null;

  return (
    <section>
      <Text as="h2" variant="h3">Medidas estatísticas</Text>
      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${medidas.length}, minmax(0, 1fr))` }}>
        {medidas.map((medida) => (
          <MetricCard
            key={medida.label}
            label={medida.label}
            value={medida.value}
            icon={medida.icon}
            className="min-h-24"
          />
        ))}
      </div>
    </section>
  );
}

export function ReportQuestionPage({
  question,
  chart,
  pageNumber,
  totalPages,
}: {
  question: PerguntaDashboard;
  chart: TipoGrafico;
  pageNumber: number;
  totalPages: number;
}) {
  const validas = totalRespostasValidas(question);
  const ausentes = pesquisaDemo.totalRespostas - validas;

  return (
    <article
      className="flex flex-col gap-5 overflow-hidden bg-canvas px-14 py-12 text-ink"
      style={reportPageStyle}
      data-pdf-report-page={question.id}
    >
      <Card className="shrink-0">
        <div className="flex items-start justify-between gap-4">
          <Badge tone="brand">{question.codigo}</Badge>
          <div className="flex gap-2">
            <Tag tag={question.tipo} />
            <Tag tag={question.categoria} />
          </div>
        </div>
        <Text as="h1" variant="h2" className="mt-4 max-w-[920px]">
          {question.enunciado}
        </Text>
        <div className="mt-5 flex gap-7 border-t border-line pt-4">
          <Text variant="caption" tone="muted"><strong className="text-ink">{validas}</strong> respostas válidas</Text>
          <Text variant="caption" tone="muted"><strong className="text-ink">{ausentes}</strong> ausentes</Text>
          {question.unidade && <Text variant="caption" tone="muted">Unidade: <strong className="text-ink">{question.unidade}</strong></Text>}
        </div>
      </Card>

      <MedidasRelatorio pergunta={question} />

      <Card className="shrink-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Text as="h2" variant="h3">Visualização</Text>
            <Text variant="caption" tone="muted" className="mt-1">
              Representação selecionada para esta pergunta.
            </Text>
          </div>
          <Badge tone="brand">{chart}</Badge>
        </div>
        <VisualizacaoPergunta pergunta={question} grafico={chart} />
      </Card>

      <div className="min-h-0 shrink">
        <TabelaFrequencias pergunta={question} />
      </div>

      <footer className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <MarcaRelatorio />
        <Text variant="caption" tone="muted">
          Página {pageNumber} de {totalPages}
        </Text>
      </footer>
    </article>
  );
}
