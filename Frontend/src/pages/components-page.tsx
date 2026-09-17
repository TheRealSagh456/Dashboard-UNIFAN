import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CircleHelp,
  Download,
  Eye,
  EyeOff,
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
  BoxplotChart,
  Button,
  Card,
  CartesianChart,
  ChartBar,
  ChartPoint,
  DataTableSurface,
  DashboardSidebar,
  DonutChart,
  MetricCard,
  NavigationItem,
  PieChart,
  QuestionFilters,
  Stepper,
  Text,
  TextField,
  Tooltip,
  type CategoriaVariavel,
  type TipoVariavel,
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
    keywords: "gráfico barra chart pontos setores pizza boxplot tooltip",
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
  const [dashboardSidebarCollapsed, setDashboardSidebarCollapsed] =
    useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterType, setFilterType] = useState<TipoVariavel | "todos">("todos");
  const [filterCategory, setFilterCategory] = useState<
    CategoriaVariavel | "todas"
  >("todas");
  const filterCategories =
    filterType === "Quantitativa"
      ? (["Discreta", "Contínua"] as const)
      : filterType === "Qualitativa"
        ? (["Nominal", "Ordinal"] as const)
        : (["Discreta", "Contínua", "Nominal", "Ordinal"] as const);

  function changeFilterType(value: TipoVariavel | "todos") {
    setFilterType(value);
    if (
      value !== "todos" &&
      filterCategory !== "todas" &&
      !(
        value === "Quantitativa"
          ? ["Discreta", "Contínua"]
          : ["Nominal", "Ordinal"]
      ).includes(filterCategory)
    ) {
      setFilterCategory("todas");
    }
  }

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
        <div className="mx-auto flex h-17 max-w-375 items-center gap-4 px-4 sm:px-6 lg:px-8">
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

      <div className="relative mx-auto grid max-w-375 lg:grid-cols-[240px_minmax(0,1fr)]">
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
                  <QuestionFilters
                    className="md:col-span-2"
                    query={filterQuery}
                    onQueryChange={setFilterQuery}
                    typeValue={filterType}
                    onTypeChange={changeFilterType}
                    categoryValue={filterCategory}
                    onCategoryChange={setFilterCategory}
                    categories={filterCategories}
                  />
                  <DataTableSurface scrollable={false} className="md:col-span-2">
                    <div role="table" aria-label="Exemplo de tabela compartilhada">
                      <div role="row" className="grid grid-cols-[7rem_1fr] border-b border-line bg-surface/80 text-xs font-bold uppercase tracking-[0.08em] text-muted">
                        <span role="columnheader" className="border-r border-line px-4 py-3">Código</span>
                        <span role="columnheader" className="px-4 py-3">Pergunta</span>
                      </div>
                      <div role="row" className="grid grid-cols-[7rem_1fr] text-sm text-ink hover:bg-brand-50/55">
                        <span role="cell" className="border-r border-line px-4 py-3 font-semibold">Q01</span>
                        <span role="cell" className="px-4 py-3">Qual é a sua idade?</span>
                      </div>
                    </div>
                  </DataTableSurface>
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
                  <Text variant="label">Plano cartesiano reutilizável</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Eixos, escala agradável, coordenadas pontilhadas e animação
                    progressiva fazem parte do mesmo componente.
                  </Text>
                  <CartesianChart
                    className="mt-5"
                    data={[
                      { label: "Segunda", value: 42 },
                      { label: "Terça", value: 68 },
                      { label: "Quarta", value: 55 },
                      { label: "Quinta", value: 94 },
                      { label: "Sexta", value: 81 },
                    ]}
                    variant="line"
                    xLabel="Dia da semana"
                    yLabel="Quantidade"
                    ariaLabel="Acessos por dia da semana"
                  />
                </Card>

                <Card className="min-w-0">
                  <Text variant="label">Gráfico de rosca reutilizável</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Resume categorias exclusivas sem precisar repetir SVG ou
                    lógica de tooltip em cada tela.
                  </Text>
                  <DonutChart
                    className="mt-6"
                    data={[
                      { label: "Discreta", value: 8, tone: "brand" },
                      { label: "Contínua", value: 5, tone: "warm" },
                      { label: "Nominal", value: 9, tone: "positive" },
                      { label: "Ordinal", value: 6, tone: "soft" },
                    ]}
                    centerValue="28"
                    centerLabel="variáveis"
                    ariaLabel="Tipos de variável"
                  />
                </Card>

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
                  <Text variant="label">Gráfico de pizza reutilizável</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    A abertura circular revela os setores. A legenda compacta e
                    a seleção persistente são compartilhadas com o dashboard.
                  </Text>
                  <PieChart
                    className="mt-5"
                    data={[
                      { label: "ChatGPT", value: 608, tone: "brand" },
                      { label: "Gemini", value: 206, tone: "warm" },
                      { label: "Copilot", value: 84, tone: "positive" },
                      { label: "Outras", value: 66, tone: "soft" },
                    ]}
                    ariaLabel="Ferramentas de IA utilizadas"
                  />
                </Card>
                <Card className="min-w-0 overflow-hidden xl:col-span-2">
                  <Text variant="label">Boxplot reutilizável</Text>
                  <Text variant="caption" tone="muted" className="mt-1">
                    Mínimo, extensão até o máximo e caixa aparecem em sequência.
                    Clique nas medidas para fixar o tooltip.
                  </Text>
                  <BoxplotChart
                    className="mt-5"
                    data={{ minimum: 16, firstQuartile: 19, median: 22, thirdQuartile: 27, maximum: 45 }}
                    xLabel="Idade (anos)"
                    ariaLabel="Distribuição de idades em boxplot"
                  />
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
                <Card className="flex flex-col items-center justify-center">
                  <Stepper
                    steps={["Importar", "Configurar", "Finalizar"]}
                    currentStep={currentStep}
                  />
                  <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-10 border-t border-line pt-5">
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
                <Card padding="none" className="min-w-0 overflow-hidden">
                  <div className="h-[28rem]">
                    <DashboardSidebar
                      collapsed={dashboardSidebarCollapsed}
                      onToggle={() =>
                        setDashboardSidebarCollapsed((collapsed) => !collapsed)
                      }
                      footer="Pesquisa sobre tecnologia"
                      items={[
                        {
                          label: "Visão geral",
                          icon: LayoutDashboard,
                          to: "#navigation",
                          active: true,
                        },
                        {
                          label: "Perguntas",
                          icon: CircleHelp,
                          to: "#navigation",
                          count: 28,
                        },
                        {
                          label: "Exportar",
                          icon: Download,
                          to: "#navigation",
                          disabled: true,
                        },
                        {
                          label: "Enviar outra planilha",
                          icon: Upload,
                          to: "#navigation",
                        },
                      ]}
                    />
                  </div>
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
