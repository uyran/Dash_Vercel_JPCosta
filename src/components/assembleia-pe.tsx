import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import raw from "@/data/assembleia-pe-2026.json";

type Cand = {
  sq: string;
  n: string;
  urna: string;
  partido: string;
  v: number;
  st: string;
};
type Bloco = {
  com: string;
  tp: string;
  vag: number;
  v: number;
  cand: Cand[];
};
type Fonte = {
  meta: { ele: string; t: string; dg: string; hg: string; cargo: string };
  uf: string;
  abr: {
    nv: number;
    vv: number;
  };
  agrem: Bloco[];
};

const fonte = raw as unknown as Fonte;

/* Eleição de João Paulo Costa (13444): mesma leitura das listas, compartilhada pelo
   banner e pelo card de destaque. */
type Cargos = Cand & { posEleitos: number; totalEleitos: number };
const todosCands = fonte.agrem.flatMap((a) => a.cand);
const eleitosGeral = todosCands.filter((c) => /^eleit/i.test(c.st)).sort((a, b) => b.v - a.v);
const jpCand = todosCands.find((c) => c.n === "13444") ?? null;
const jp: Cargos | null = jpCand
  ? {
      ...jpCand,
      posEleitos: eleitosGeral.findIndex((c) => c.sq === jpCand.sq) + 1,
      totalEleitos: eleitosGeral.length,
    }
  : null;

const CORES: Record<string, string> = {
  AVANTE: "#36aeba",
  CIDADANIA: "#ec5fa6",
  MDB: "#16a250",
  MISSAO: "#fdbe21",
  MOBILIZA: "#dd3333",
  NOVO: "#ff6600",
  PCDOB: "#b4251d",
  PCO: "#c40823",
  PDT: "#ffad99",
  PL: "#304091",
  PODE: "#23a840",
  PP: "#6391d4",
  PRD: "#007c3c",
  PSD: "#eb8100",
  PSB: "#edd355",
  PSOL: "#e95dd2",
  PSTU: "#620411",
  PT: "#ff3859",
  PV: "#1f9439",
  REDE: "#7dd1d9",
  REPUBLICANOS: "#1f646b",
  SOLIDARIEDADE: "#ff633d",
  UP: "#5e5e5e",
  UNIAO: "#2eccff",
};

const ESPECTRO: Record<string, number> = {
  PCO: 0,
  PSTU: 1,
  UP: 2,
  PSOL: 3,
  REDE: 4,
  PT: 5,
  PCDOB: 6,
  PV: 7,
  CIDADANIA: 8,
  AVANTE: 9,
  PSB: 10,
  PDT: 11,
  MISSAO: 12,
  PODE: 13,
  MDB: 14,
  PRD: 15,
  SOLIDARIEDADE: 16,
  PP: 17,
  REPUBLICANOS: 18,
  UNIAO: 19,
  NOVO: 20,
  PL: 21,
  PSD: 22,
};

const num = (n: number) => n.toLocaleString("pt-BR");
const perc = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

type Partido = {
  chave: string;
  rotulo: string;
  siglas: string[];
  cor: string;
  espectro: number;
  fed: boolean;
  vagas: number;
  votos: number;
  pct: number;
  cands: (Cand & { pos: number; eleito: boolean })[];
};

function BandeiraPE({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 360" className={className} role="img" aria-label="Bandeira de Pernambuco">
      <path fill="#3155A4" d="M0 0h540v216H0z" />
      <path
        d="M69 270 A 129 129 202.5 0 1 471,270"
        style={{ fill: "none" }}
        strokeWidth="12"
        stroke="#C34342"
      />
      <path
        d="M81 270 A 117 117 202.5 0 1 459,270"
        style={{ fill: "none" }}
        strokeWidth="12"
        stroke="#FFB511"
      />
      <path
        d="M93 270 A 105 105 202.5 0 1 447,270"
        style={{ fill: "none" }}
        strokeWidth="12"
        stroke="#00AD4A"
      />
      <path fill="#fff" d="M0 216h540v144H0z" />
      <path d="M270 243v90m-27-58.5h54" strokeWidth="12" stroke="#C34342" fill="none" />
      <path
        fill="#FFB511"
        d="m 270,126 2.93684,9.19249 5.21596,-8.11915 0.45758,9.63937 7.13962,-6.49251 -2.05287,9.42935 8.57673,-4.42341 -4.42341,8.57673 9.42935,-2.05287 -6.49251,7.13962 9.63937,0.45758 -8.11915,5.21596 9.19249,2.93684 -9.19249,2.93684 8.11915,5.21596 -9.63937,0.45758 6.49251,7.13962 -9.42935,-2.05287 4.42341,8.57673 -8.57673,-4.42341 2.05287,9.42935 -7.13962,-6.49251 -0.45758,9.63937 -5.21596,-8.11915 L 270,189 l -2.93684,-9.19249 -5.21596,8.11915 -0.45758,-9.63937 -7.13962,6.49251 2.05287,-9.42935 -8.57673,4.42341 4.42341,-8.57673 -9.42935,2.05287 6.49251,-7.13962 -9.63937,-0.45758 8.11915,-5.21596 L 238.5,157.5 l 9.19249,-2.93684 -8.11915,-5.21596 9.63937,-0.45758 -6.49251,-7.13962 9.42935,2.05287 -4.42341,-8.57673 8.57673,4.42341 -2.05287,-9.42935 7.13962,6.49251 0.45758,-9.63937 5.21596,8.11915z"
      />
      <path
        fill="#FFB511"
        d="M270 18 l8.77283 27-22.96757-16.686918 h28.38948 l-22.96757 16.686917z"
      />
    </svg>
  );
}

type Assento = {
  x: number;
  y: number;
  chave: string;
  cor: string;
  nome: string;
  vagas: number;
  candidato?: { nome: string; partido: string; votos: number; posicao: number } | undefined;
};

/* Texto legivel sobre a cor da bolinha (branco ou escuro conforme luminancia). */
function corTexto(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#1f2937" : "#ffffff";
}

function montarAssentos(blocos: Partido[]): Assento[] {
  const total = blocos.reduce((s, b) => s + b.vagas, 0);
  const raios = [268, 210, 152];
  const soma = raios.reduce((a, b) => a + b, 0);
  const contagens = raios.map((r) => Math.round((total * r) / soma));
  contagens[0] = (contagens[0] ?? 0) + total - contagens.reduce((a, b) => a + b, 0);

  const cx = 300;
  const cy = 292;
  const pontos: { x: number; y: number; ang: number }[] = [];
  raios.forEach((r, ri) => {
    const n = contagens[ri] ?? 0;
    for (let i = 0; i < n; i++) {
      const ang = Math.PI - ((i + 0.5) * Math.PI) / n;
      pontos.push({ x: cx + r * Math.cos(ang), y: cy - r * Math.sin(ang), ang });
    }
  });
  pontos.sort((a, b) => b.ang - a.ang || a.y - b.y);

  const fila = blocos
    .filter((b) => b.vagas > 0)
    .slice()
    .sort((a, b) => a.espectro - b.espectro || b.vagas - a.vagas);

  const assentos: Assento[] = [];
  fila.forEach((b) => {
    /* Cadeira i do partido = iº eleito mais votado do bloco. */
    const eleitos = b.cands.filter((c) => c.eleito);
    for (let i = 0; i < b.vagas; i++) {
      const p = pontos[assentos.length];
      if (!p) break;
      const cand = eleitos[i];
      assentos.push({
        x: p.x,
        y: p.y,
        chave: b.chave,
        cor: b.cor,
        nome: b.rotulo,
        vagas: b.vagas,
        candidato: cand
          ? {
              nome: cand.urna,
              partido: b.fed && cand.partido ? `${cand.partido} (${b.rotulo})` : b.rotulo,
              votos: cand.v,
              posicao: cand.pos,
            }
          : undefined,
      });
    }
  });
  return assentos;
}

export function TituloAssembleiaPE() {
  return (
    <div className="space-y-5">
      {/* Cabeçalho destaque: bandeira de fundo com o candidato e o resultado. */}
      {jp && (
        <header
          className="relative overflow-hidden rounded-2xl bg-nav bg-cover bg-center px-6 py-7 text-primary-foreground shadow-md sm:px-8"
          style={{
            backgroundImage:
              "url('https://agrestina.pe.gov.br/wp-content/uploads/2026/02/agrestinafoto.jpg')",
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-nav/90 via-nav/75 to-nav/40"
          />
          <BandeiraPE className="pointer-events-none absolute -right-6 -top-8 h-40 w-60 rotate-6 opacity-15" />
          <div className="relative flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">João Paulo Costa</h1>
            <span className="rounded-full bg-primary-foreground/25 px-4 py-1 text-2xl font-black tracking-tight sm:text-3xl">
              13444
            </span>
            <span className="text-lg font-semibold opacity-90">Deputado Estadual · PT/PE</span>
          </div>
          <p className="relative mt-2 flex flex-wrap items-center gap-x-2 text-base font-medium opacity-95 sm:text-lg">
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            Eleito, o {jp.posEleitos}º mais votado com{" "}
            <strong className="font-black">{num(jp.v)} votos</strong>
          </p>
        </header>
      )}
    </div>
  );
}

export function ComposicaoAssembleiaPE() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <BandeiraPE className="h-10 w-[60px] shrink-0 rounded-sm border shadow-sm" />
      <div className="min-w-0">
        <h2 className="text-[2rem] font-semibold">
          Composição da Assembleia Legislativa de Pernambuco — 2026
        </h2>
      </div>
    </div>
  );
}

export function AssembleiaPE() {
  const [sel, setSel] = useState<string | null>(null);
  const [completa, setCompleta] = useState(false);
  const [balao, setBalao] = useState<{ x: number; y: number; a: Assento } | null>(null);
  const boxPartidosRef = useRef<HTMLDivElement>(null);
  const listasRef = useRef<HTMLDivElement>(null);

  /* Selecionar no grafico ou na tabela: leva o partido ao topo do quadro
     "Cadeiras por partido" e o card equivalente a primeira posicao das listas.
     O foco permanece no elemento clicado. */
  useEffect(() => {
    if (!sel) return;
    const box = boxPartidosRef.current;
    const linha = box?.querySelector<HTMLElement>(`tr[data-chave="${CSS.escape(sel)}"]`);
    if (box && linha) {
      const cabecalho = box.querySelector("thead")?.offsetHeight ?? 0;
      const delta = linha.getBoundingClientRect().top - box.getBoundingClientRect().top - cabecalho;
      box.scrollTo({ top: box.scrollTop + delta, behavior: "smooth" });
    }
    const faixa = listasRef.current;
    const card = faixa?.querySelector<HTMLElement>(`article[data-chave="${CSS.escape(sel)}"]`);
    if (faixa && card) {
      /* So a faixa rola (horizontal); a pagina permanece onde esta. */
      const delta = card.getBoundingClientRect().left - faixa.getBoundingClientRect().left;
      faixa.scrollTo({ left: faixa.scrollLeft + delta, behavior: "smooth" });
    }
  }, [sel]);

  const { blocos, assentos } = useMemo(() => {
    const vv = fonte.abr.vv || 0;
    const blocos: Partido[] = fonte.agrem
      .map((a) => {
        const siglas = a.com
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean);
        const fed = a.tp === "f";
        const siglaCor = siglas[0] ?? "";
        const espectro = Math.min(...siglas.map((s) => ESPECTRO[s] ?? 99));
        const cands = a.cand
          .slice()
          .sort((x, y) => y.v - x.v)
          .map((c, i) => ({ ...c, pos: i + 1, eleito: /^eleit/i.test(c.st) }));
        return {
          chave: siglas.join("/"),
          rotulo: siglas.join("/"),
          siglas,
          cor: CORES[siglaCor] ?? "#94a3b8",
          espectro,
          fed,
          vagas: a.vag,
          votos: a.v,
          pct: vv > 0 ? (a.v / vv) * 100 : 0,
          cands,
        };
      })
      .sort((x, y) => y.vagas - x.vagas || y.votos - x.votos);

    return { blocos, assentos: montarAssentos(blocos) };
  }, []);

  /* Clique em area em branco fora dos quadros interativos tira a selecao. */
  useEffect(() => {
    if (!sel) return;
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Element | null;
      if (!alvo?.closest("[data-zona-selecao]")) setSel(null);
    };
    document.addEventListener("click", aoClicar);
    return () => document.removeEventListener("click", aoClicar);
  }, [sel]);

  const alternar = (chave: string) => setSel((s) => (s === chave ? null : chave));
  const escurecer = (chave: string) => (sel && sel !== chave ? "opacity-35" : "");

  const { abr } = fonte;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <figure className="min-w-0" data-zona-selecao>
          <h3 className="mb-2 text-center font-semibold">
            Distribuição das {num(abr.nv)} cadeiras
          </h3>
          <svg
            viewBox="0 0 600 306"
            className="w-full"
            role="img"
            aria-label="Hemicírculo das cadeiras da Assembleia Legislativa de Pernambuco por partido"
          >
            {assentos.map((s, i) => (
              <circle
                key={`${s.chave}-${i}`}
                cx={s.x}
                cy={s.y}
                r={14}
                fill={s.cor}
                className={`cursor-pointer transition-opacity ${escurecer(s.chave)}`}
                onClick={() => alternar(s.chave)}
                onMouseEnter={(e) => setBalao({ x: e.clientX, y: e.clientY, a: s })}
                onMouseLeave={() => setBalao(null)}
              />
            ))}
            {assentos.map((s, i) =>
              s.candidato ? (
                <text
                  key={`pos-${s.chave}-${i}`}
                  x={s.x}
                  y={s.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`pointer-events-none select-none ${escurecer(s.chave)}`}
                  fontSize={12}
                  fontWeight={700}
                  fill={corTexto(s.cor)}
                >
                  {`${s.candidato.posicao}º`}
                </text>
              ) : null,
            )}
          </svg>
          {balao && (
            <div
              className="pointer-events-none fixed z-50 min-w-44 rounded-lg border bg-popover p-3 text-sm shadow-md"
              style={{
                left: Math.min(balao.x + 14, window.innerWidth - 210),
                top: Math.min(balao.y + 14, window.innerHeight - 110),
              }}
            >
              <p className="font-semibold leading-tight">
                {balao.a.candidato?.nome ?? balao.a.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {balao.a.candidato?.partido ?? "Partido/coligação"}
              </p>
              <p className="mt-1 text-xs">
                {balao.a.candidato ? (
                  <>
                    <strong className="text-sm">{num(balao.a.candidato.votos)}</strong> votos
                  </>
                ) : (
                  `${balao.a.vagas} ${balao.a.vagas === 1 ? "cadeira" : "cadeiras"}`
                )}
              </p>
            </div>
          )}
        </figure>

        <div className="min-w-0" data-zona-selecao>
          <h3 className="mb-2 text-center font-semibold">Cadeiras por partido</h3>
          <div
            ref={boxPartidosRef}
            className="max-h-[16.5rem] overflow-auto rounded-lg border shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="sticky top-0 z-10 border-b bg-card py-2">Partido ou federação</th>
                  <th className="sticky top-0 z-10 border-b bg-card py-2 text-right">Cadeiras</th>
                  <th className="sticky top-0 z-10 border-b bg-card py-2 text-right">Votos</th>
                  <th className="sticky top-0 z-10 border-b bg-card py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {blocos.map((b) => (
                  <tr
                    key={b.chave}
                    data-chave={b.chave}
                    tabIndex={-1}
                    onClick={() => alternar(b.chave)}
                    className={`cursor-pointer border-b hover:bg-muted ${sel === b.chave ? "bg-muted" : ""} ${escurecer(b.chave)}`}
                  >
                    <td className="py-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm align-middle"
                        style={{ background: b.cor }}
                      />
                      <span className="ml-2 align-middle">{b.rotulo}</span>
                    </td>
                    <td className="py-2 text-right font-semibold">{num(b.vagas)}</td>
                    <td className="py-2 text-right">{num(b.votos)}</td>
                    <td className="py-2 text-right text-muted-foreground">{perc(b.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div data-zona-selecao>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Listagem dos candidatos por partido</h3>
          <Button variant="outline" size="sm" onClick={() => setCompleta((c) => !c)}>
            {completa ? "Mostrar só o começo das listas" : "Ver listas completas"}
          </Button>
        </div>
        <div ref={listasRef} className="flex gap-4 overflow-x-auto pb-2">
          {blocos.map((b) => {
            const limite = Math.max(5, b.vagas + 2);
            const mostrar = completa ? b.cands : b.cands.slice(0, limite);
            const ultimoEleito = b.cands.reduce((acc, c, i) => (c.eleito ? i : acc), -1);
            return (
              <article
                key={b.chave}
                data-chave={b.chave}
                className={`w-[250px] shrink-0 rounded-lg border-2 border-foreground/20 bg-card transition-opacity ${sel === b.chave ? "border-primary! ring-1 ring-primary" : ""} ${escurecer(b.chave)}`}
              >
                <header
                  className="border-b p-3"
                  style={{
                    borderTop: `4px solid ${b.cor}`,
                    background: `color-mix(in oklab, ${b.cor} 14%, transparent)`,
                  }}
                >
                  <p className="font-semibold leading-tight">{b.rotulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.vagas} {b.vagas === 1 ? "cadeira" : "cadeiras"} · {num(b.votos)} votos ·{" "}
                    {perc(b.pct)}
                  </p>
                </header>
                <ol className="max-h-[370px] divide-y overflow-y-auto">
                  {mostrar.map((c, i) => (
                    <Fragment key={c.sq}>
                      {i === ultimoEleito + 1 && ultimoEleito >= 0 && (
                        <li className="bg-danger/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Suplente
                        </li>
                      )}
                      <li className={`px-3 py-1.5 ${c.n === "13444" ? "bg-primary/10" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                            {c.pos}.
                          </span>
                          <span
                            className={`min-w-0 flex-1 truncate text-sm ${c.n === "13444" ? "font-semibold" : ""}`}
                            title={c.urna}
                          >
                            {c.urna}
                          </span>
                          {c.eleito ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-success"
                              aria-label="Eleito"
                            />
                          ) : (
                            <span className="w-3.5 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
                          {b.fed && <span className="truncate">{c.partido}</span>}
                          <span className="ml-auto shrink-0">{num(c.v)} votos</span>
                        </div>
                      </li>
                    </Fragment>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
      </div>

      <p className="mt-2! flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Desenvolvido por uyrancosta@gmail.com</span>
        <span>Dados oficiais do TSE / Mapas: Electomaps</span>
      </p>
    </section>
  );
}
