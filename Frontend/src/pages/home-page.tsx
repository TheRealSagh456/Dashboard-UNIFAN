import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calculator,
  Download,
  Equal,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  Menu,
  Sigma,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  DashboardSidebar,
  DonutChart,
  MetricCard,
  QuestionFilters,
  Tag,
  Text,
  type DashboardSidebarItem,
} from "../components";
import {
  perguntasDashboard,
  pesquisaDemo,
  totalRespostasValidas,
  type CategoriaPergunta,
  type PerguntaDashboard,
  type TipoGrafico,
  type TipoPergunta,
} from "../feats/home/dashboard-data";
import { TabelaFrequencias } from "../feats/home/frequency-table";
import { VisualizacaoPergunta } from "../feats/home/question-charts";
import { cn } from "../lib/cn";

const todasCategorias: CategoriaPergunta[] = [
  "Discreta",
  "Contínua",
  "Nominal",
  "Ordinal",
];

const categoriasPorTipo: Record<TipoPergunta, CategoriaPergunta[]> = {
  Quantitativa: ["Discreta", "Contínua"],
  Qualitativa: ["Nominal", "Ordinal"],
};

function normalizarBusca(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function caminhoPerguntas(pesquisaId: string) {
  return `/home/${pesquisaId}/perguntas`;
}

function caminhoPergunta(pesquisaId: string, perguntaId: string) {
  return `${caminhoPerguntas(pesquisaId)}/${perguntaId}`;
}

function CartaoPergunta({
  pergunta,
  pesquisaId,
}: {
  pergunta: PerguntaDashboard;
  pesquisaId: string;
}) {
  return (
    <Link
      to={caminhoPergunta(pesquisaId, pergunta.id)}
      className="group flex min-h-48 flex-col rounded-2xl border border-line bg-paper p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge tone="brand">{pergunta.codigo}</Badge>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Tag tag={pergunta.tipo} className="px-2 py-1 text-xs" />
          <Tag tag={pergunta.categoria} className="px-2 py-1 text-xs" />
        </div>
      </div>
      <div className="my-5 flex flex-1 items-center justify-center">
        <Text as="h3" variant="h3" className="line-clamp-3 text-center">
          {pergunta.enunciado}
        </Text>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <Text variant="caption" tone="muted">
          {totalRespostasValidas(pergunta).toLocaleString("pt-BR")} respostas · {pergunta.graficos.length} visualizações
        </Text>
        <ArrowRight className="size-4 text-brand-600 transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}

function VisaoGeral({ pesquisaId }: { pesquisaId: string }) {
  const navigate = useNavigate();
  const ausenciasPorPergunta = perguntasDashboard
    .map((pergunta) => ({
      pergunta,
      ausentes: pesquisaDemo.totalRespostas - totalRespostasValidas(pergunta),
    }))
    .filter((item) => item.ausentes > 0)
    .sort((a, b) => b.ausentes - a.ausentes);
  const totalAusencias = ausenciasPorPergunta.reduce(
    (total, item) => total + item.ausentes,
    0,
  );
  const totalEsperado =
    pesquisaDemo.totalRespostas * perguntasDashboard.length;
  const percentualAusencias = (totalAusencias / totalEsperado) * 100;
  const categoriasDonut = todasCategorias.map((categoria) => ({
      label: categoria,
      value: perguntasDashboard.filter(
        (pergunta) => pergunta.categoria === categoria,
      ).length,
    }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Text variant="eyebrow" tone="accent">Visão geral</Text>
          <Text as="h1" variant="h1" className="mt-3">Resumo da pesquisa</Text>
          <Text tone="muted" className="mt-2">
            Principais indicadores do arquivo processado em {pesquisaDemo.importadoEm}.
          </Text>
        </div>
        <Button variant="outline" onClick={() => navigate(caminhoPerguntas(pesquisaId))}>
          Ver todas as perguntas
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Indicadores da pesquisa">
        <MetricCard label="Respostas recebidas" value="1.000" icon={Users} />
        <MetricCard label="Perguntas importadas" value="25" icon={ListChecks} tone="positive" />
        <MetricCard
          label={`${percentualAusencias.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% dos dados esperados`}
          value={String(totalAusencias)}
          icon={TriangleAlert}
          tone="warning"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="flex h-full flex-col">
          <Text as="h2" variant="h3">Tipos de variável</Text>
          <Text variant="caption" tone="muted" className="mt-1">
            Distribuição das perguntas entre as quatro categorias confirmadas.
          </Text>
          <DonutChart
            data={categoriasDonut}
            centerValue={String(perguntasDashboard.length)}
            centerLabel="perguntas"
            className="mt-5 flex-1 justify-center"
            layout="stacked"
            size="large"
          />
        </Card>

        <Card className="h-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text as="h2" variant="h3">Perguntas com respostas ausentes</Text>
              <Text variant="caption" tone="muted" className="mt-1">
                {ausenciasPorPergunta.length} perguntas possuem pelo menos uma ausência.
              </Text>
            </div>
            <Badge tone="warning">{totalAusencias} ausências</Badge>
          </div>
          <div className="mt-5 grid gap-2">
            {ausenciasPorPergunta.slice(0, 6).map(({ pergunta, ausentes }) => (
              <Link
                key={pergunta.id}
                to={caminhoPergunta(pesquisaId, pergunta.id)}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-line hover:bg-brand-50"
              >
                <span className="text-xs font-bold text-brand-700">{pergunta.codigo}</span>
                <span className="min-w-0">
                  <Text as="span" variant="caption" className="block truncate">{pergunta.enunciado}</Text>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface">
                    <span className="block h-full min-w-1 rounded-full bg-brand-500" style={{ width: `${(ausentes / pesquisaDemo.totalRespostas) * 100}%` }} />
                  </span>
                </span>
                <Text as="strong" variant="caption" className="tabular-nums">{ausentes}</Text>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}

function CatalogoPerguntas({ pesquisaId }: { pesquisaId: string }) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoPergunta | "todos">("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaPergunta | "todas">("todas");
  const categoriasDisponiveis =
    filtroTipo === "todos" ? todasCategorias : categoriasPorTipo[filtroTipo];
  const perguntasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca);
    return perguntasDashboard.filter((pergunta) => {
      const correspondeBusca = normalizarBusca(
        `${pergunta.codigo} ${pergunta.enunciado} ${pergunta.tipo} ${pergunta.categoria}`,
      ).includes(termo);
      const correspondeTipo = filtroTipo === "todos" || pergunta.tipo === filtroTipo;
      const correspondeCategoria = filtroCategoria === "todas" || pergunta.categoria === filtroCategoria;
      return correspondeBusca && correspondeTipo && correspondeCategoria;
    });
  }, [busca, filtroCategoria, filtroTipo]);

  function alterarFiltroTipo(value: TipoPergunta | "todos") {
    setFiltroTipo(value);
    if (
      value !== "todos" &&
      filtroCategoria !== "todas" &&
      !categoriasPorTipo[value].includes(filtroCategoria)
    ) {
      setFiltroCategoria("todas");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
        <div>
          <Text variant="eyebrow" tone="accent">Perguntas</Text>
          <Text as="h1" variant="h1" className="mt-3">Escolha uma pergunta</Text>
          <Text tone="muted" className="mt-3 max-w-2xl">
            Explore todas as perguntas importadas ou encontre uma diretamente pelo código e pelo enunciado.
          </Text>
        </div>
        <QuestionFilters
          query={busca}
          onQueryChange={setBusca}
          typeValue={filtroTipo}
          onTypeChange={alterarFiltroTipo}
          categoryValue={filtroCategoria}
          onCategoryChange={setFiltroCategoria}
          categories={categoriasDisponiveis}
          searchLabel="Buscar pergunta"
          placeholder="Digite o código ou parte da pergunta..."
        />
      </section>

      <section className="mt-10">
        <Text tone="muted">
          {perguntasFiltradas.length} de {perguntasDashboard.length} disponíveis
        </Text>

        {perguntasFiltradas.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {perguntasFiltradas.map((pergunta) => (
              <CartaoPergunta key={pergunta.id} pergunta={pergunta} pesquisaId={pesquisaId} />
            ))}
          </div>
        ) : (
          <Card variant="outline" className="mt-6 text-center">
            <Text as="h2" variant="h3">Nenhuma pergunta encontrada</Text>
            <Text tone="muted" className="mt-2">Tente outro termo ou remova o filtro selecionado.</Text>
          </Card>
        )}
      </section>
    </main>
  );
}

function CartoesMedidas({ pergunta }: { pergunta: PerguntaDashboard }) {
  const medidas: Array<{ label: string; value: string; icon: LucideIcon }> = [];
  if (pergunta.medidas.media) medidas.push({ label: "Média", value: pergunta.medidas.media, icon: Calculator });
  if (pergunta.medidas.mediana) medidas.push({ label: "Mediana", value: pergunta.medidas.mediana, icon: Equal });
  if (pergunta.medidas.moda) medidas.push({ label: "Moda", value: pergunta.medidas.moda, icon: BarChart3 });
  if (pergunta.medidas.primeiroQuartil) medidas.push({ label: "Primeiro quartil", value: pergunta.medidas.primeiroQuartil, icon: Sigma });
  if (pergunta.medidas.terceiroQuartil) medidas.push({ label: "Terceiro quartil", value: pergunta.medidas.terceiroQuartil, icon: Sigma });

  return (
    <section>
      <Text as="h2" variant="h3">Medidas estatísticas</Text>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {medidas.map((medida) => (
          <MetricCard key={medida.label} label={medida.label} value={medida.value} icon={medida.icon} />
        ))}
      </div>
    </section>
  );
}

function AnalisePergunta({
  pesquisaId,
  pergunta,
}: {
  pesquisaId: string;
  pergunta: PerguntaDashboard;
}) {
  const [grafico, setGrafico] = useState<TipoGrafico>(pergunta.graficos[0]);
  const navigate = useNavigate();
  const indice = perguntasDashboard.findIndex((item) => item.id === pergunta.id);
  const anterior = perguntasDashboard[indice - 1];
  const proxima = perguntasDashboard[indice + 1];
  const validas = totalRespostasValidas(pergunta);
  const ausentes = pesquisaDemo.totalRespostas - validas;

  function navegar(perguntaId: string) {
    navigate(caminhoPergunta(pesquisaId, perguntaId));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <Link
        to={caminhoPerguntas(pesquisaId)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar para todas as perguntas
      </Link>

      <div className="mt-6 space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Badge tone="brand">{pergunta.codigo}</Badge>
            <div className="flex flex-wrap gap-2">
              <Tag tag={pergunta.tipo} />
              <Tag tag={pergunta.categoria} />
            </div>
          </div>
          <Text as="h1" variant="h2" className="mt-4 max-w-4xl">
            {pergunta.enunciado}
          </Text>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
            <Text variant="caption" tone="muted"><strong className="text-ink">{validas}</strong> respostas válidas</Text>
            <Text variant="caption" tone="muted"><strong className="text-ink">{ausentes}</strong> ausentes</Text>
            {pergunta.unidade && <Text variant="caption" tone="muted">Unidade: <strong className="text-ink">{pergunta.unidade}</strong></Text>}
          </div>
        </Card>

        <CartoesMedidas pergunta={pergunta} />

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Text as="h2" variant="h3">Visualização</Text>
              <Text variant="caption" tone="muted" className="mt-1">
                Passe o cursor ou use o teclado sobre os dados para consultar valores e coordenadas.
              </Text>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Escolher visualização">
              {pergunta.graficos.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={grafico === item ? "secondary" : "ghost"}
                  aria-pressed={grafico === item}
                  onClick={() => setGrafico(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <VisualizacaoPergunta pergunta={pergunta} grafico={grafico} />
        </Card>

        <TabelaFrequencias pergunta={pergunta} />

        <div className="flex items-center justify-between gap-3">
          {anterior ? (
            <Button variant="outline" onClick={() => navegar(anterior.id)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              {anterior.codigo}
            </Button>
          ) : <span />}
          {proxima && (
            <Button onClick={() => navegar(proxima.id)}>
              {proxima.codigo}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function PerguntaNaoEncontrada({ pesquisaId }: { pesquisaId: string }) {
  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center px-4 py-12 text-center">
      <Card>
        <Text as="h1" variant="h2">Pergunta não encontrada</Text>
        <Text tone="muted" className="mt-3">O endereço pode estar incorreto ou a pergunta não faz parte desta pesquisa.</Text>
        <Link to={caminhoPerguntas(pesquisaId)} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para as perguntas
        </Link>
      </Card>
    </main>
  );
}

export function HomePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { pesquisaId = pesquisaDemo.id, perguntaId } = useParams();
  const [menuRecolhido, setMenuRecolhido] = useState(
    () => window.localStorage.getItem("dashboard-menu-recolhido") === "true",
  );
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const pergunta = perguntaId
    ? perguntasDashboard.find((item) => item.id === perguntaId)
    : undefined;
  const emPerguntas = pathname.includes("/perguntas");
  const emCatalogo = emPerguntas && !perguntaId;
  const itens: DashboardSidebarItem[] = [
    {
      label: "Visão geral",
      icon: LayoutDashboard,
      to: `/home/${pesquisaId}`,
      active: !emPerguntas,
    },
    {
      label: "Perguntas",
      icon: ListChecks,
      to: caminhoPerguntas(pesquisaId),
      active: emPerguntas,
      count: perguntasDashboard.length,
    },
    {
      label: "Exportar",
      icon: Download,
      to: "#",
      disabled: true,
    },
    {
      label: "Enviar outra planilha",
      icon: FilePlus2,
      to: "/import",
    },
  ];

  function alternarMenu() {
    setMenuRecolhido((valorAtual) => {
      const novoValor = !valorAtual;
      window.localStorage.setItem("dashboard-menu-recolhido", String(novoValor));
      return novoValor;
    });
  }

  function navegar(to: string) {
    setMenuMobileAberto(false);
    navigate(to);
  }

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <DashboardSidebar
          items={itens}
          collapsed={menuRecolhido}
          onToggle={alternarMenu}
          onNavigate={navegar}
          footer={`${pesquisaDemo.nome} · ${pesquisaDemo.totalRespostas.toLocaleString("pt-BR")} respostas`}
        />
      </aside>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/30"
            aria-label="Fechar menu"
            onClick={() => setMenuMobileAberto(false)}
          />
          <aside className="absolute inset-y-0 left-0 shadow-soft">
            <DashboardSidebar
              items={itens}
              onNavigate={navegar}
              footer={`${pesquisaDemo.nome} · ${pesquisaDemo.totalRespostas.toLocaleString("pt-BR")} respostas`}
            />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMenuMobileAberto(true)} aria-label="Abrir menu">
          <Menu className="size-5" />
        </Button>
        <span className="text-center">
          <Text as="strong" variant="label" tone="accent" className="block tracking-[0.08em]">UNIFAN</Text>
          <Text variant="eyebrow" tone="muted">Analytics</Text>
        </span>
        <Button variant="ghost" size="icon" className="invisible" aria-hidden="true" tabIndex={-1}>
          <X className="size-5" />
        </Button>
      </header>

      <div className={cn("transition-[padding] duration-200", menuRecolhido ? "lg:pl-20" : "lg:pl-64")}>
        {perguntaId ? (
          pergunta ? (
            <AnalisePergunta key={pergunta.id} pesquisaId={pesquisaId} pergunta={pergunta} />
          ) : (
            <PerguntaNaoEncontrada pesquisaId={pesquisaId} />
          )
        ) : emCatalogo ? (
          <CatalogoPerguntas pesquisaId={pesquisaId} />
        ) : (
          <VisaoGeral pesquisaId={pesquisaId} />
        )}
      </div>
    </div>
  );
}
