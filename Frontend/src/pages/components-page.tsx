import {
  ArrowRight,
  BarChart3,
  Boxes,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  Download,
  Eye,
  EyeOff,
  Filter,
  LayoutDashboard,
  Menu,
  MousePointerClick,
  Search,
  Settings2,
  Sparkles,
  TriangleAlert,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  ChartBar,
  ChartPoint,
  ChartSector,
  MetricCard,
  NavigationItem,
  Stepper,
  Text,
  TextField,
  Tooltip,
} from "../components";
import { cn } from "../lib/cn";

const sections = [
  {
    id: "foundation",
    label: "Fundamentos",
    icon: Sparkles,
    keywords: "texto tipografia cores",
  },
  {
    id: "actions",
    label: "Ações",
    icon: MousePointerClick,
    keywords: "botão button badge",
  },
  {
    id: "surfaces",
    label: "Superfícies",
    icon: LayoutDashboard,
    keywords: "card métrica",
  },
  {
    id: "forms",
    label: "Formulários",
    icon: Settings2,
    keywords: "input busca campo",
  },
  {
    id: "data",
    label: "Dados",
    icon: BarChart3,
    keywords: "gráfico barra chart",
  },
  {
    id: "navigation",
    label: "Navegação",
    icon: Menu,
    keywords: "menu progresso stepper",
  },
];

const chartData = [
  {
    label: "Computação",
    value: 99,
    detail: "627 respostas",
    tone: "brand" as const,
  },
  {
    label: "Design",
    value: 67,
    detail: "424 respostas",
    tone: "soft" as const,
  },
  {
    label: "Administração",
    value: 41,
    detail: "259 respostas",
    tone: "positive" as const,
  },
  {
    label: "Direito",
    value: 18,
    detail: "114 respostas",
    tone: "muted" as const,
  },
];

const pointData = [
  {
    label: "Segunda",
    x: 32,
    y: 126,
    value: "42 acessos",
    detail: "4,1% do total semanal",
  },
  {
    label: "Terça",
    x: 108,
    y: 92,
    value: "68 acessos",
    detail: "6,6% do total semanal",
  },
  {
    label: "Quarta",
    x: 184,
    y: 108,
    value: "55 acessos",
    detail: "5,4% do total semanal",
  },
  {
    label: "Quinta",
    x: 260,
    y: 54,
    value: "94 acessos",
    detail: "9,2% do total semanal",
  },
  {
    label: "Sexta",
    x: 336,
    y: 72,
    value: "81 acessos",
    detail: "7,9% do total semanal",
  },
];

const sectorData = [
  {
    label: "ChatGPT",
    value: "63,2%",
    detail: "608 respostas",
    startAngle: 0,
    endAngle: 227.52,
    tone: "brand" as const,
  },
  {
    label: "Gemini",
    value: "21,4%",
    detail: "206 respostas",
    startAngle: 227.52,
    endAngle: 304.56,
    tone: "warm" as const,
  },
  {
    label: "Copilot",
    value: "8,7%",
    detail: "84 respostas",
    startAngle: 304.56,
    endAngle: 335.88,
    tone: "positive" as const,
  },
  {
    label: "Outras",
    value: "6,7%",
    detail: "66 respostas",
    startAngle: 335.88,
    endAngle: 360,
    tone: "soft" as const,
  },
];

const colors = [
  { name: "Marca", value: "#A9531F", className: "bg-brand-600" },
  { name: "Canvas", value: "#F2E8DC", className: "bg-canvas" },
  { name: "Papel", value: "#FFFAF4", className: "bg-paper" },
  { name: "Texto", value: "#392B23", className: "bg-ink" },
  { name: "Positivo", value: "#47705C", className: "bg-positive" },
];

type ShowcaseSectionProps = {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  hidden?: boolean;
};

function ShowcaseSection({
  id,
  title,
  description,
  children,
  hidden,
}: ShowcaseSectionProps) {
  if (hidden) return null;

  return (
    <section id={id} className="gallery-enter scroll-mt-24">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <Text variant="eyebrow" tone="accent" className="mb-2">
            Componente reutilizável
          </Text>
          <Text as="h2" variant="h2">
            {title}
          </Text>
        </div>
        <Text tone="muted" className="max-w-md sm:text-right">
          {description}
        </Text>
      </div>
      {children}
    </section>
  );
}

type TooltipDetailsProps = {
  label: string;
  value: string;
  detail: string;
};

function TooltipDetails({ label, value, detail }: TooltipDetailsProps) {
  return (
    <span className="grid min-w-32 gap-0.5">
      <span className="font-semibold text-paper">{label}</span>
      <span className="text-sm font-bold text-brand-200">{value}</span>
      <span className="text-paper/65">{detail}</span>
    </span>
  );
}

export function ComponentsPage() {
  const [query, setQuery] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(2);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleSections = useMemo(
    () =>
      new Set(
        sections
          .filter((section) =>
            `${section.label} ${section.keywords}`
              .toLocaleLowerCase("pt-BR")
              .includes(normalizedQuery),
          )
          .map((section) => section.id),
      ),
    [normalizedQuery],
  );
  const noResults = normalizedQuery.length > 0 && visibleSections.size === 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 12% 8%, rgba(255,255,255,.92), transparent 31%), radial-gradient(circle at 84% 12%, rgba(229,176,132,.28), transparent 27%), radial-gradient(circle at 62% 86%, rgba(255,255,255,.72), transparent 28%)",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-line bg-paper text-ink lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </button>
          <a
            href="#top"
            className="flex items-baseline gap-2"
            aria-label="UNIFAN Analytics"
          >
            <span className="font-display text-xl tracking-[0.06em] text-brand-700">
              UNIFAN
            </span>
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.13em] text-muted">
              Analytics
            </span>
          </a>
          <Badge tone="brand" className="hidden sm:inline-flex">
            Design system · v0.1
          </Badge>
          <div className="ml-auto hidden w-full max-w-xs md:block">
            <TextField
              aria-label="Buscar componente"
              placeholder="Buscar componente..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leadingIcon={<Search className="size-4" />}
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Ajuda">
            <CircleHelp className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1500px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside
          className={cn(
            "fixed inset-x-4 top-20 z-30 rounded-2xl border border-line bg-paper p-3 shadow-soft transition lg:sticky lg:inset-auto lg:top-17 lg:block lg:h-[calc(100vh-4.25rem)] lg:rounded-none lg:border-0 lg:border-r lg:bg-transparent lg:px-6 lg:py-8 lg:shadow-none",
            mobileMenuOpen ? "block" : "hidden",
          )}
        >
          <Text variant="eyebrow" tone="muted" className="mb-3 px-3">
            Catálogo
          </Text>
          <nav className="grid gap-1" aria-label="Seções dos componentes">
            {sections.map((section, index) => (
              <NavigationItem
                key={section.id}
                href={`#${section.id}`}
                label={section.label}
                icon={section.icon}
                active={index === 0}
                onClick={() => setMobileMenuOpen(false)}
              />
            ))}
          </nav>
          <Card variant="tinted" padding="sm" className="mt-8 hidden lg:block">
            <Text variant="label">Pronto para compor</Text>
            <Text variant="caption" tone="muted" className="mt-1">
              Importe tudo pelo índice de componentes e combine as variantes com
              o helper cn.
            </Text>
          </Card>
        </aside>

        <main
          id="top"
          className="min-w-0 px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:px-14"
        >
          <div className="mb-8 md:hidden">
            <TextField
              aria-label="Buscar componente"
              placeholder="Buscar componente..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leadingIcon={<Search className="size-4" />}
            />
          </div>

          <div className="mb-14 grid items-end gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
            <div>
              <Badge tone="brand" className="mb-5">
                Biblioteca de interface
              </Badge>
              <Text as="h1" variant="display" className="max-w-3xl">
                Componentes para transformar respostas em{" "}
                <span className="italic text-brand-600">insights.</span>
              </Text>
              <Text tone="muted" className="mt-5 max-w-2xl text-base leading-7">
                Uma base visual quente, clara e acessível para montar as telas
                do UNIFAN Analytics com consistência.
              </Text>
            </div>
            <Card variant="tinted" className="relative overflow-hidden">
              <div className="absolute -right-12 -top-14 size-36 rounded-full bg-brand-200/40 blur-2xl" />
              <Text variant="eyebrow" tone="accent">
                Princípios
              </Text>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["Reutilizável", "Responsivo", "Acessível"].map(
                  (principle, index) => (
                    <div key={principle}>
                      <Text variant="data" className="text-2xl text-brand-600">
                        0{index + 1}
                      </Text>
                      <Text variant="caption" tone="muted" className="mt-1">
                        {principle}
                      </Text>
                    </div>
                  ),
                )}
              </div>
            </Card>
          </div>

          {noResults && (
            <Card className="mb-10 text-center">
              <Search className="mx-auto mb-3 size-6 text-brand-600" />
              <Text as="h2" variant="h3">
                Nenhum componente encontrado
              </Text>
              <Text tone="muted" className="mt-1">
                Tente buscar por botão, texto, card, formulário, gráfico ou
                navegação.
              </Text>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => setQuery("")}
              >
                Limpar busca
              </Button>
            </Card>
          )}

          <div className="grid gap-16">
            <ShowcaseSection
              id="foundation"
              title="Tipografia e cores"
              description="Hierarquia editorial para títulos e uma fonte neutra para leitura e dados."
              hidden={!visibleSections.has("foundation")}
            >
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
                <Card className="min-w-0 overflow-hidden">
                  <div className="grid gap-6">
                    <div>
                      <Text variant="eyebrow" tone="accent">
                        Display · Serif
                      </Text>
                      <Text as="p" variant="h1" className="mt-2">
                        Visão geral da pesquisa
                      </Text>
                    </div>
                    <div className="grid gap-1 border-t border-line pt-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                      <Text variant="caption" tone="muted">
                        Título H2
                      </Text>
                      <Text variant="h2">Distribuição das perguntas</Text>
                    </div>
                    <div className="grid gap-1 border-t border-line pt-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                      <Text variant="caption" tone="muted">
                        Corpo
                      </Text>
                      <Text>
                        Analise e classifique as variáveis do seu formulário com
                        uma leitura confortável e objetiva.
                      </Text>
                    </div>
                    <div className="grid gap-1 border-t border-line pt-5 sm:grid-cols-[7rem_1fr] sm:gap-5">
                      <Text variant="caption" tone="muted">
                        Dado
                      </Text>
                      <Text variant="data">1.248</Text>
                    </div>
                  </div>
                </Card>
                <Card variant="outline">
                  <Text variant="label">Paleta principal</Text>
                  <div className="mt-5 grid gap-10">
                    {colors.map((color) => (
                      <div key={color.name} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "size-9 rounded-full border border-black/5",
                            color.className,
                          )}
                        />
                        <Text
                          as="span"
                          variant="caption"
                          className="flex-1 font-semibold"
                        >
                          {color.name}
                        </Text>
                        <Text
                          as="code"
                          variant="caption"
                          tone="muted"
                          className="font-mono"
                        >
                          {color.value}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="actions"
              title="Botões e badges"
              description="Variantes para hierarquia de ações, estados de carregamento e indicadores curtos."
              hidden={!visibleSections.has("actions")}
            >
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => setClickCount((count) => count + 1)}>
                    Importar pesquisa <Upload className="size-4" />
                  </Button>
                  <Button variant="secondary">
                    Continuar <ArrowRight className="size-4" />
                  </Button>
                  <Button variant="outline">Voltar</Button>
                  <Button variant="ghost">Cancelar</Button>
                  <Button variant="danger">Excluir</Button>
                  <Button loading>Processando</Button>
                  <Button disabled>Indisponível</Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Baixar relatório"
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
                  <Badge tone="brand">Nominal</Badge>
                  <Badge tone="positive">
                    <Check className="size-3" /> Validado
                  </Badge>
                  <Badge tone="warning">Atenção</Badge>
                  <Badge tone="negative">Erro</Badge>
                  <Badge>{clickCount} cliques no botão</Badge>
                </div>
              </Card>
            </ShowcaseSection>

            <ShowcaseSection
              id="surfaces"
              title="Cards e métricas"
              description="Superfícies para agrupar conteúdo sem perder a leveza da composição."
              hidden={!visibleSections.has("surfaces")}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Respostas"
                  value="1.248"
                  change="+8,2%"
                  icon={Users}
                />
                <MetricCard
                  label="Variáveis"
                  value="28"
                  icon={Boxes}
                  tone="positive"
                />
                <MetricCard
                  label="Dados ausentes"
                  value="4,2%"
                  icon={TriangleAlert}
                  tone="warning"
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <Card variant="elevated">
                  <Text variant="label">Card elevado</Text>
                  <Text tone="muted" className="mt-2">
                    Para conteúdo principal e blocos de maior destaque.
                  </Text>
                </Card>
                <Card variant="tinted">
                  <Text variant="label">Card tonal</Text>
                  <Text tone="muted" className="mt-2">
                    Para orientar, contextualizar ou realçar informações.
                  </Text>
                </Card>
                <Card variant="interactive" role="button" tabIndex={0}>
                  <Text variant="label">Card interativo</Text>
                  <Text tone="muted" className="mt-2">
                    Passe o cursor para conferir o estado de interação.
                  </Text>
                </Card>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="forms"
              title="Campos de formulário"
              description="Entradas com rótulo, ajuda, ícone, erro e estados nativos do navegador."
              hidden={!visibleSections.has("forms")}
            >
              <Card>
                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Buscar pergunta"
                    placeholder="Ex.: Qual é sua idade?"
                    hint="Busque pelo texto ou código da pergunta."
                    leadingIcon={<Search className="size-4" />}
                  />
                  <TextField
                    label="Link do Google Sheets"
                    defaultValue="https://docs.google.com/spreadsheets/d/..."
                    error="O link precisa permitir acesso à planilha."
                  />
                  <TextField
                    label="Campo desabilitado"
                    value="Dados importados"
                    disabled
                    readOnly
                  />
                  <div className="flex items-end gap-2">
                    <TextField
                      label="Filtrar categoria"
                      placeholder="Selecione ou digite"
                      className="pr-10"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Aplicar filtro"
                    >
                      <Filter className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </ShowcaseSection>

            <ShowcaseSection
              id="data"
              title="Elementos para gráficos"
              description="Barras, pontos e setores permanecem independentes e recebem tooltips apenas quando associados."
              hidden={!visibleSections.has("data")}
            >
              <Card>
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <Text variant="label">Distribuição por curso</Text>
                    <Text variant="caption" tone="muted" className="mt-1">
                      Valores demonstrativos para conferir o comportamento
                      visual.
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={tooltipsEnabled ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setTooltipsEnabled((enabled) => !enabled)}
                      aria-pressed={tooltipsEnabled}
                    >
                      {tooltipsEnabled ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                      Tooltips{" "}
                      {tooltipsEnabled ? "associados" : "desassociados"}
                    </Button>
                    <div className="flex rounded-full border border-line bg-surface p-1">
                      {(["horizontal", "vertical"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setOrientation(option)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition",
                            orientation === option &&
                              "bg-paper text-brand-700 shadow-sm",
                          )}
                          aria-pressed={orientation === option}
                        >
                          {option === "horizontal" ? "Horizontal" : "Vertical"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    orientation === "horizontal"
                      ? "grid gap-5"
                      : "flex min-h-52 items-end justify-around gap-3 border-b border-line pb-3",
                  )}
                >
                  {chartData.map(({ detail, ...item }) =>
                    tooltipsEnabled ? (
                      <Tooltip<HTMLDivElement>
                        key={`${item.label}-${orientation}`}
                        content={
                          <TooltipDetails
                            label={item.label}
                            value={`${item.value}%`}
                            detail={detail}
                          />
                        }
                      >
                        {(triggerProps) => (
                          <ChartBar
                            {...item}
                            orientation={orientation}
                            barProps={triggerProps}
                          />
                        )}
                      </Tooltip>
                    ) : (
                      <ChartBar
                        key={`${item.label}-${orientation}`}
                        {...item}
                        orientation={orientation}
                      />
                    ),
                  )}
                </div>
              </Card>

              <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
                <Card className="min-w-0 overflow-hidden">
                  <Text variant="label">Gráfico de pontos</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Cada ponto é uma marca isolada; a linha serve apenas como
                    contexto visual.
                  </Text>
                  <div className="mt-6 rounded-xl border border-line bg-surface/45 p-4">
                    <svg
                      viewBox="0 0 368 170"
                      className="h-52 w-full overflow-visible"
                      aria-label="Acessos por dia"
                    >
                      {[30, 70, 110, 150].map((y) => (
                        <line
                          key={y}
                          x1="20"
                          x2="348"
                          y1={y}
                          y2={y}
                          className="stroke-line stroke-1"
                        />
                      ))}
                      <polyline
                        points={pointData
                          .map((point) => `${point.x},${point.y}`)
                          .join(" ")}
                        fill="none"
                        className="stroke-brand-200 stroke-2"
                      />
                      {pointData.map((point) =>
                        tooltipsEnabled ? (
                          <Tooltip<SVGCircleElement>
                            key={point.label}
                            content={
                              <TooltipDetails
                                label={point.label}
                                value={point.value}
                                detail={point.detail}
                              />
                            }
                          >
                            {(triggerProps) => (
                              <ChartPoint
                                x={point.x}
                                y={point.y}
                                aria-label={`${point.label}: ${point.value}`}
                                {...triggerProps}
                              />
                            )}
                          </Tooltip>
                        ) : (
                          <ChartPoint
                            key={point.label}
                            x={point.x}
                            y={point.y}
                          />
                        ),
                      )}
                    </svg>
                  </div>
                </Card>

                <Card className="min-w-0">
                  <Text variant="label">Gráfico de setores</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Os setores compartilham o mesmo SVG, mas cada um continua
                    sendo um componente independente.
                  </Text>
                  <div className="mt-5 grid items-center gap-5 sm:grid-cols-[13rem_1fr]">
                    <div className="relative mx-auto size-52">
                      <svg
                        viewBox="0 0 200 200"
                        className="size-full"
                        aria-label="Ferramentas de IA utilizadas"
                      >
                        {sectorData.map((sector) =>
                          tooltipsEnabled ? (
                            <Tooltip<SVGPathElement>
                              key={sector.label}
                              content={
                                <TooltipDetails
                                  label={sector.label}
                                  value={sector.value}
                                  detail={sector.detail}
                                />
                              }
                            >
                              {(triggerProps) => (
                                <ChartSector
                                  {...sector}
                                  aria-label={`${sector.label}: ${sector.value}`}
                                  {...triggerProps}
                                />
                              )}
                            </Tooltip>
                          ) : (
                            <ChartSector key={sector.label} {...sector} />
                          ),
                        )}
                      </svg>
                      <span className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                        <span>
                          <Text variant="data" className="text-2xl">
                            964
                          </Text>
                          <Text variant="caption" tone="muted">
                            respostas
                          </Text>
                        </span>
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {sectorData.map((sector) => (
                        <div
                          key={sector.label}
                          className="flex items-center gap-3"
                        >
                          <span
                            className={cn("size-2.5 rounded-full", {
                              "bg-brand-700": sector.tone === "brand",
                              "bg-brand-500": sector.tone === "warm",
                              "bg-positive": sector.tone === "positive",
                              "bg-brand-200": sector.tone === "soft",
                            })}
                          />
                          <Text
                            as="span"
                            variant="caption"
                            className="flex-1 font-medium"
                          >
                            {sector.label}
                          </Text>
                          <Text
                            as="span"
                            variant="caption"
                            tone="muted"
                            className="tabular-nums"
                          >
                            {sector.value}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </ShowcaseSection>

            <ShowcaseSection
              id="navigation"
              title="Navegação e progresso"
              description="Padrões usados na importação em etapas e na navegação lateral do dashboard."
              hidden={!visibleSections.has("navigation")}
            >
              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <Stepper
                    steps={["Importar", "Configurar", "Finalizar"]}
                    currentStep={currentStep}
                  />
                  <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-line pt-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentStep === 1}
                      onClick={() =>
                        setCurrentStep((step) => Math.max(1, step - 1))
                      }
                    >
                      Voltar
                    </Button>
                    <Text
                      variant="caption"
                      tone="muted"
                      className="min-w-0 text-center"
                    >
                      Etapa {currentStep} de 3
                    </Text>
                    <Button
                      size="sm"
                      disabled={currentStep === 3}
                      onClick={() =>
                        setCurrentStep((step) => Math.min(3, step + 1))
                      }
                    >
                      Continuar <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </Card>
                <Card padding="sm" className="min-w-0">
                  <nav className="grid gap-1" aria-label="Exemplo de navegação">
                    <NavigationItem
                      label="Visão geral"
                      icon={LayoutDashboard}
                      href="#navigation"
                      active
                    />
                    <NavigationItem
                      label="Perguntas"
                      icon={CircleHelp}
                      href="#navigation"
                      count={28}
                    />
                    <NavigationItem
                      label="Filtros"
                      icon={Filter}
                      href="#navigation"
                    />
                    <NavigationItem
                      label="Comparações"
                      icon={ChartNoAxesColumnIncreasing}
                      href="#navigation"
                    />
                    <NavigationItem
                      label="Exportar"
                      icon={Download}
                      href="#navigation"
                    />
                  </nav>
                </Card>
              </div>
            </ShowcaseSection>
          </div>

          <footer className="mt-20 border-t border-line py-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <Text variant="caption" tone="muted">
                UNIFAN Analytics · Biblioteca inicial de componentes
              </Text>
              <Text
                as="code"
                variant="caption"
                tone="accent"
                className="font-mono"
              >
                localhost:5173/components
              </Text>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
