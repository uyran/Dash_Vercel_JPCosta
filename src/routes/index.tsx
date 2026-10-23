import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AjudaOrdem } from "@/components/ajuda-ordem";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AssembleiaPE,
  ComposicaoAssembleiaPE,
  TituloAssembleiaPE,
} from "@/components/assembleia-pe";
import { LocaisZona } from "@/components/locais-zona";
import raw from "@/data/votos.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel Eleitoral — João Paulo Costa (2022 x 2026)" },
      {
        name: "description",
        content:
          "Comparativo de votos de João Paulo Costa (13444) para Deputado Estadual em 2022 e 2026, por cidade, zona e local de votação.",
      },
      { property: "og:title", content: "Painel Eleitoral — João Paulo Costa" },
      { property: "og:description", content: "Votação 2022 x 2026 por cidade e zona eleitoral." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Row = [string, number, number, number];
const rows = raw as Row[];
const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (a: number, b: number) =>
  a === 0
    ? b > 0
      ? "novo"
      : "—"
    : `${(((b - a) / a) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

type City = { cidade: string; v22: number; v26: number; diff: number; pctText: string };
type CityBase = Omit<City, "pctText">;

/* Colunas ordenáveis da tabela "Votos por cidade". */
type OrdemCidade = "cidade" | "v22" | "v26" | "diff" | "pct";
type Ordenacao = { chave: OrdemCidade; dir: "asc" | "desc" };

/* Valor numérico usado na ordenação das colunas de números. */
const valorOrd = (c: City, chave: OrdemCidade): number => {
  if (chave === "cidade") return 0;
  if (chave === "pct")
    return c.v22 === 0 ? (c.v26 > 0 ? Number.POSITIVE_INFINITY : 0) : (c.v26 - c.v22) / c.v22;
  return c[chave];
};

const pctText = (c: CityBase) =>
  c.v22 === 0 ? (c.v26 > 0 ? "novo" : "—") : `${c.diff > 0 ? "+" : ""}${pct(c.v22, c.v26)}`;

const ABREVIA: Record<string, string> = {
  "JABOATÃO DOS GUARARAPES": "JABOATÃO",
  "VITÓRIA DE SANTO ANTÃO": "VITÓRIA DE STO ANTÃO",
  "CABO DE SANTO AGOSTINHO": "CABO DE STO AGOST.",
  "BELÉM DO SÃO FRANCISCO": "BELÉM DO S. FRANCISCO",
  "SANTA MARIA DO CAMBUCÁ": "STA MARIA DO CAMBUCÁ",
};
const nomeCidade = (c: string) => ABREVIA[c] ?? c;

/* Larguras aproximadas do Inter (em fração de em), para estimar o espaço que
   os rótulos ocupam no eixo sem cortar nenhum nome. */
const LARGURA_EM: Record<string, number> = {
  A: 0.667,
  B: 0.672,
  C: 0.672,
  D: 0.706,
  E: 0.611,
  F: 0.583,
  G: 0.717,
  H: 0.739,
  I: 0.296,
  J: 0.478,
  K: 0.651,
  L: 0.556,
  M: 0.853,
  N: 0.739,
  O: 0.756,
  P: 0.651,
  Q: 0.769,
  R: 0.672,
  S: 0.617,
  T: 0.617,
  U: 0.717,
  V: 0.651,
  W: 1.039,
  X: 0.634,
  Y: 0.617,
  Z: 0.606,
  " ": 0.273,
  "-": 0.396,
  ".": 0.273,
};

/* Estimativa da largura do rótulo da cidade no eixo. */
function larguraTexto(texto: string, fontSize = 10) {
  const semAcentos = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let w = 0;
  for (const ch of semAcentos) w += (LARGURA_EM[ch] ?? 0.68) * fontSize;
  return w;
}

/* Corta o nome com "…" quando ele não cabe na faixa disponível do eixo. */
function cortarNome(nome: string, maxPx: number, fontSize: number) {
  if (larguraTexto(nome, fontSize) <= maxPx) return nome;
  let s = nome;
  while (s.length > 1 && larguraTexto(`${s}…`, fontSize) > maxPx) s = s.slice(0, -1).trimEnd();
  return `${s}…`;
}

function useData() {
  return useMemo(() => {
    const m = new Map<string, CityBase>();
    for (const [c, , ano, v] of rows) {
      const o = m.get(c) ?? { cidade: c, v22: 0, v26: 0, diff: 0 };
      if (ano === 2022) o.v22 += v;
      else o.v26 += v;
      o.diff = o.v26 - o.v22;
      m.set(c, o);
    }
    const cities = [...m.values()]
      .map((c) => ({ ...c, pctText: pctText(c) }))
      .sort((a, b) => a.cidade.localeCompare(b.cidade));
    const t22 = cities.reduce((s, c) => s + c.v22, 0);
    const t26 = cities.reduce((s, c) => s + c.v26, 0);
    return { cities, t22, t26 };
  }, []);
}

export function Card({
  label,
  value,
  sub,
  tone,
  details,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
  details?: ReactNode;
  bg?: string;
}) {
  const [open, setOpen] = useState(false);
  const [byClick, setByClick] = useState(false);
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const clickable = Boolean(details);

  const togglePorClique = () => {
    setByClick(true);
    setOpen((o) => !o);
  };

  /* Enquanto o clique está no comando do balão, nenhum evento do hover
     (timers de abertura/fechamento do Radix) pode alterar a visibilidade. */
  const onHoverOpenChange = (next: boolean) => {
    if (byClick) return;
    setOpen(next);
  };

  const fecharPorClique = () => {
    setByClick(false);
    setOpen(false);
  };

  const content = (
    <div
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={label}
      aria-expanded={clickable ? open : undefined}
      onClick={clickable ? togglePorClique : undefined}
      onPointerLeave={clickable ? () => setByClick(false) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePorClique();
              } else if (e.key === "Escape") {
                e.preventDefault();
                fecharPorClique();
              }
            }
          : undefined
      }
      className={[
        "h-full rounded-xl border p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        bg ?? "bg-card",
        clickable
          ? "cursor-pointer select-none shadow-[0_4px_0_0_rgba(0,0,0,0.18)] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.18)] active:translate-y-[3px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
          : "shadow-sm",
        open
          ? "translate-y-[3px] shadow-[0_1px_0_0_rgba(0,0,0,0.18)] hover:translate-y-[3px] hover:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]"
          : "",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {clickable ? (
          <>
            {label}: <span className="normal-case">(Clique)</span>
          </>
        ) : (
          label
        )}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );

  if (!details) return content;

  if (canHover) {
    return (
      <HoverCard open={open} onOpenChange={onHoverOpenChange} openDelay={150}>
        <HoverCardTrigger asChild>{content}</HoverCardTrigger>
        <HoverCardContent
          className="w-[440px] max-w-[calc(100vw-32px)] bg-hovercard"
          collisionPadding={16}
        >
          <p className="mb-3 font-semibold">{label}</p>
          <div className="max-h-80 overflow-auto">{details}</div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <div className="relative h-full">
      {content}
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[440px] max-w-[calc(100vw-32px)] rounded-md border bg-hovercard p-4 shadow-md">
          <p className="mb-3 font-semibold">{label}</p>
          <div className="max-h-80 overflow-auto">{details}</div>
        </div>
      )}
    </div>
  );
}

type LabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: string | number;
};

function BarPctLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value,
  color,
}: LabelProps & { color: string }) {
  const text = typeof value === "string" ? value : "";
  if (!text) return null;
  const neg = width < 0;
  return (
    <text
      x={x + width + (neg ? -6 : 6)}
      y={y + height / 2}
      dy="0.35em"
      textAnchor={neg ? "end" : "start"}
      fontSize={10}
      fontWeight={600}
      fill={color}
    >
      {text}
    </text>
  );
}

function VoteTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: City }[];
}) {
  const city = payload?.[0]?.payload;
  if (!active || !city) return null;
  return (
    <div className="max-w-[calc(100vw-32px)] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md">
      <p className="mb-2 font-semibold">{nomeCidade(city.cidade)}</p>
      <p className="flex flex-wrap gap-x-5">
        <span>
          2022: <strong>{fmt(city.v22)}</strong>
        </span>
        <span>
          2026: <strong>{fmt(city.v26)}</strong>
        </span>
      </p>
      <p className="mt-2">
        Diferença:{" "}
        <strong className={city.diff >= 0 ? "text-success" : "text-danger"}>
          {city.diff > 0 ? "+" : ""}
          {fmt(city.diff)}
        </strong>
      </p>
    </div>
  );
}

function BarraShape(arg: unknown) {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    fill = "currentColor",
    fillOpacity = 1,
    pctText: pct = "",
    background,
  } = (arg ?? {}) as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: string;
    fillOpacity?: number;
    pctText?: string;
    background?: { x?: number; y?: number; width?: number; height?: number };
  };
  const bx = background?.x ?? Math.min(x, x + width);
  const by = background?.y ?? y;
  const bw = background?.width ?? Math.abs(width);
  const bh = background?.height ?? height;
  return (
    <g>
      <rect x={bx} y={by} width={bw} height={bh} fill="transparent" pointerEvents="all" />
      <rect
        x={Math.min(x, x + width)}
        y={y}
        width={Math.abs(width)}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
      />
      <BarPctLabel x={x} y={y} width={width} height={height} value={pct} color={fill} />
    </g>
  );
}

function TickCidade({
  payload,
  x = 0,
  y = 0,
  textAnchor = "end",
  fill = "#666",
  fontSize,
  className,
  maxPx,
}: {
  payload?: { value?: unknown };
  x?: number;
  y?: number;
  textAnchor?: "start" | "middle" | "end";
  fill?: string;
  fontSize?: number;
  className?: string;
  maxPx?: number;
}) {
  const label = typeof payload?.value === "string" ? payload.value : "";
  if (!label) return null;
  const nome = nomeCidade(label);
  const texto = maxPx ? cortarNome(nome, maxPx, fontSize ?? 10) : nome;
  return (
    <text
      x={x}
      y={y}
      dy="0.35em"
      textAnchor={textAnchor}
      fill={fill}
      fontSize={fontSize}
      className={className}
    >
      {texto}
    </text>
  );
}

/* Traço curto do eixo de cidades e folga de segurança da estimativa de largura
   (a folga cobre diferenças de renderização da fonte). */
const TICK_EIXO = 4;
const FOLGA_EIXO = 6;

function Chart({
  title,
  data,
  color,
  margemDireita = 74,
}: {
  title: string;
  data: City[];
  color: string;
  margemDireita?: number;
}) {
  const [page, setPage] = useState(0);
  const porPagina = 15;
  const lastPage = Math.max(0, Math.ceil(data.length / porPagina) - 1);
  const visible = data.slice(page * porPagina, (page + 1) * porPagina);

  /* Largura real do gráfico: em telas estreitas (celular) o eixo de cidades é
     reduzido, a fonte diminui e os nomes muito compridos são cortados com "…",
     liberando espaço para a faixa das barras. No desktop nada muda. */
  const caixaRef = useRef<HTMLDivElement>(null);
  const [larguraCaixa, setLarguraCaixa] = useState(0);
  useEffect(() => {
    const el = caixaRef.current;
    if (!el) return;
    const medir = () => setLarguraCaixa(el.getBoundingClientRect().width);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const estreito = larguraCaixa > 0 && larguraCaixa < 560;
  const fsTick = estreito ? 8 : 10;
  const margemDir = estreito ? Math.min(margemDireita, 44) : margemDireita;
  const tetoEixo = estreito ? Math.max(56, Math.round(larguraCaixa * 0.45)) : 180;

  /* Largura do eixo: só o necessário para o nome mais comprido da lista,
     aproximando o gráfico da margem esquerda sem cortar nenhum rótulo. */
  const nomes = estreito ? visible : data;
  const necessaria = Math.max(0, ...nomes.map((c) => larguraTexto(nomeCidade(c.cidade), fsTick)));
  const larguraEixo = Math.min(
    tetoEixo,
    Math.max(estreito ? 44 : 50, Math.ceil(necessaria * 1.015) + FOLGA_EIXO + TICK_EIXO),
  );

  return (
    <div className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="default"
            size="icon"
            className="bg-nav text-nav-foreground hover:bg-nav/90"
            aria-label={`Retroceder — ${title}`}
            title="15 cidades anteriores"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="bg-nav text-nav-foreground hover:bg-nav/90"
            aria-label={`Avançar — ${title}`}
            title="Próximas 15 cidades"
            disabled={page === lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mb-3 flex justify-end">
        <span className="mr-[74px] text-xs text-muted-foreground" aria-live="polite">
          {page * porPagina + 1}–{Math.min((page + 1) * porPagina, data.length)} de {data.length}
        </span>
      </div>
      <div ref={caixaRef} className="w-full">
        <ResponsiveContainer width="100%" height={440}>
          <BarChart data={visible} layout="vertical" margin={{ left: 0, right: margemDir }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              fontSize={11}
              domain={[(min: number) => (min < 0 ? min * 1.45 : min), (max: number) => max]}
            />
            <YAxis
              type="category"
              dataKey="cidade"
              width={larguraEixo}
              fontSize={fsTick}
              interval={0}
              tickSize={TICK_EIXO}
              tickMargin={0}
              tick={<TickCidade maxPx={larguraEixo - TICK_EIXO} />}
            />
            <Tooltip content={<VoteTooltip />} />
            <Bar
              dataKey="diff"
              name="Diferença"
              fill={color}
              isAnimationActive={false}
              shape={BarraShape}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Dashboard() {
  const { cities, t22, t26 } = useData();
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<Ordenacao>({ chave: "cidade", dir: "asc" });

  const up = cities.filter((c) => c.diff >= 0).sort((a, b) => b.diff - a.diff);
  const down = cities.filter((c) => c.diff < 0).sort((a, b) => a.diff - b.diff);
  const diff = t26 - t22;
  const grew = cities.filter((c) => c.diff > 0).length;
  const fell = cities.filter((c) => c.diff < 0).length;
  const newCities = cities.filter((c) => c.v22 === 0 && c.v26 > 0);
  const zero22 = newCities.length;
  const best26 = [...cities].sort((a, b) => b.v26 - a.v26)[0];

  /* Acrescenta cidades (do maior para o menor) enquanto o acumulado de 2026
     se aproximar de 80% dos votos. */
  const ordenadas = [...cities].sort((a, b) => b.v26 - a.v26);
  const acumulado: City[] = [];
  let somaTop = 0;
  let melhorN = 0;
  let melhorDist = Number.POSITIVE_INFINITY;
  for (const c of ordenadas) {
    acumulado.push(c);
    somaTop += c.v26;
    const dist = Math.abs((t26 > 0 ? somaTop / t26 : 0) * 100 - 80);
    if (dist < melhorDist) {
      melhorDist = dist;
      melhorN = acumulado.length;
    } else {
      break;
    }
  }
  const top = acumulado.slice(0, melhorN);
  const topTotal = top.reduce((s, c) => s + c.v26, 0);
  const topShare = t26 > 0 ? topTotal / t26 : 0;

  /* 1º clique na coluna: ordem crescente; clique seguinte: inverte a ordem. */
  const ordenarPor = (chave: OrdemCidade) =>
    setSort((s) =>
      s.chave === chave ? { chave, dir: s.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" },
    );

  const thBotao = (chave: OrdemCidade, rotulo: string) => (
    <button
      type="button"
      onClick={() => ordenarPor(chave)}
      aria-label={`Ordenar por ${rotulo}`}
      aria-pressed={sort.chave === chave}
      data-active={sort.chave === chave}
      className="btn-3d th-btn group relative focus-visible:ring-2 focus-visible:ring-ring"
    >
      {rotulo}
      <span aria-hidden="true" className="text-[9px] opacity-80">
        {sort.chave === chave ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
      <AjudaOrdem />
    </button>
  );

  const list = useMemo(() => {
    const base = filter ? cities.filter((c) => c.cidade === filter) : cities;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...base].sort((a, b) =>
      sort.chave === "cidade"
        ? dir * a.cidade.localeCompare(b.cidade, "pt-BR")
        : dir * (valorOrd(a, sort.chave) - valorOrd(b, sort.chave)) ||
          a.cidade.localeCompare(b.cidade, "pt-BR"),
    );
  }, [cities, filter, sort]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-8">
      <TituloAssembleiaPE />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Votos 2022" value={fmt(t22)} bg="bg-primary/15" />
        <Card label="Votos 2026" value={fmt(t26)} bg="bg-primary/15" />
        <Card
          label="Diferença"
          value={`${diff > 0 ? "+" : ""}${fmt(diff)}`}
          tone={diff >= 0 ? "up" : "down"}
          sub="votos"
          bg="bg-nav/10"
        />
        <Card
          label="Variação %"
          value={pct(t22, t26)}
          tone={diff >= 0 ? "up" : "down"}
          bg="bg-nav/10"
        />
        <Card
          label="Cidades com crescimento"
          value={fmt(grew)}
          tone="up"
          sub={`${fell} com queda`}
          bg="bg-success/15"
        />
        <Card
          label="Novas cidades"
          value={fmt(zero22)}
          sub="0 votos em 2022, votos em 2026"
          bg="bg-chart-4/40"
          details={
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left">Cidade</th>
                  <th className="pb-2 text-right">2022</th>
                  <th className="pb-2 text-right">2026</th>
                </tr>
              </thead>
              <tbody>
                {newCities.map((c) => (
                  <tr key={c.cidade} className="border-b">
                    <td className="py-2 pr-3">{c.cidade}</td>
                    <td className="text-right">{fmt(c.v22)}</td>
                    <td className="pl-3 text-right">{fmt(c.v26)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
        <Card
          label="Maior votação 2026"
          value={best26?.cidade ?? "—"}
          sub={`${fmt(best26?.v26 ?? 0)} votos`}
          bg="bg-danger/10"
        />
        <Card
          label={`Concentração top ${top.length}`}
          value={`${(topShare * 100).toFixed(1)}%`}
          sub="dos votos de 2026"
          bg="bg-hovercard"
          details={
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left">Cidade</th>
                  <th className="pb-2 text-right">2026</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.cidade} className="border-b">
                    <td className="py-2 pr-3">{c.cidade}</td>
                    <td className="text-right">{fmt(c.v26)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="pt-3">Total</td>
                  <td className="pt-3 text-right">{fmt(topTotal)}</td>
                </tr>
              </tfoot>
            </table>
          }
        />
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <Chart
          title="Cidades com maior crescimento numérico de votos"
          data={up}
          color="var(--success)"
        />
        <Chart
          title="Cidades com maior queda numérica de votos"
          data={down}
          color="var(--danger)"
          margemDireita={8}
        />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-[2rem] font-semibold">Votos por cidade</h3>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <span className="whitespace-nowrap">Cidade</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Escolher cidade"
              className="rounded-md border-2 border-nav/40 bg-nav/10 px-4 py-2 text-sm font-medium shadow-sm"
            >
              <option value="">Todas as cidades</option>
              {cities.map((c) => (
                <option key={c.cidade}>{c.cidade}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">{thBotao("cidade", "Cidade")}</th>
                <th className="px-5 py-2 text-center">{thBotao("v22", "2022")}</th>
                <th className="px-5 py-2 text-center">{thBotao("v26", "2026")}</th>
                <th className="px-5 py-2 text-center">{thBotao("diff", "Dif.")}</th>
                <th className="px-5 py-2 text-center">{thBotao("pct", "%")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.cidade} className="border-b hover:bg-muted">
                  <td className="py-2">{c.cidade}</td>
                  <td className="px-5 py-2 text-center whitespace-nowrap">{fmt(c.v22)}</td>
                  <td className="px-5 py-2 text-center whitespace-nowrap">{fmt(c.v26)}</td>
                  <td
                    className={`px-5 py-2 text-center whitespace-nowrap font-semibold ${c.diff >= 0 ? "text-success" : "text-danger"}`}
                  >
                    {c.diff > 0 ? "+" : ""}
                    {fmt(c.diff)}
                  </td>
                  <td className="px-5 py-2 text-center whitespace-nowrap text-muted-foreground">
                    {pct(c.v22, c.v26)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LocaisZona />

      <ComposicaoAssembleiaPE />

      <AssembleiaPE />
    </main>
  );
}
