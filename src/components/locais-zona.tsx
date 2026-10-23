import { useMemo, useState } from "react";
import { AjudaOrdem } from "@/components/ajuda-ordem";
import locaisRaw from "@/data/locais-zona-2026.json";
import votosRaw from "@/data/votos.json";

type Local = [string, string, number, number, number, number, number, string, string, number[]];
type CidadesJson = Record<string, Record<string, Local[]>>;

const locais = locaisRaw as unknown as CidadesJson;
const fmt = (n: number) => n.toLocaleString("pt-BR");

type VotoRow = [string, number, number, number];
const votos = votosRaw as VotoRow[];

const TOTAIS: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const [c, , ano, v] of votos) {
    if (ano !== 2022) m[c] = (m[c] ?? 0) + v;
  }
  return m;
})();

type Zona = { zona: string; total: number; locais: Local[] };
type Cidade = { nome: string; total: number; zonas: Zona[]; zonaLider: string; liderTotal: number };

const CIDADES: Cidade[] = Object.entries(locais)
  .map(([nome, zmap]) => {
    const zonas: Zona[] = Object.entries(zmap)
      .map(([z, ls]) => ({ zona: z, total: ls.reduce((s, l) => s + l[2], 0), locais: ls }))
      .sort((a, b) => Number(a.zona) - Number(b.zona));
    const total = zonas.reduce((s, z) => s + z.total, 0);
    const lider = zonas.reduce((best, z) => (z.total > best.total ? z : best));
    return { nome, total, zonas, zonaLider: lider.zona, liderTotal: lider.total };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const POR_NOME = new Map(CIDADES.map((c) => [c.nome, c]));
const INICIAL = CIDADES.reduce((best, c) => (c.total > best.total ? c : best));

type Ordem = "local" | "votos" | "endereco" | "bairro";
type Ordenacao = { chave: Ordem; dir: "asc" | "desc" };

/* Grid fixo dos botões de zona, igual ao da cidade de Recife (maior número de
   zonas): assim todos os botões têm o mesmo tamanho em qualquer cidade.
   No celular, no máximo duas colunas. */
const ZONA_GRID = "grid-cols-2 sm:grid-cols-4 md:grid-cols-6";

function ThBotao({
  chave,
  rotulo,
  ordem,
  onClick,
}: {
  chave: Ordem;
  rotulo: string;
  ordem: Ordenacao;
  onClick: (chave: Ordem) => void;
}) {
  const ativo = ordem.chave === chave;
  return (
    <button
      type="button"
      onClick={() => onClick(chave)}
      aria-label={`Ordenar por ${rotulo}`}
      aria-pressed={ativo}
      data-active={ativo}
      className="btn-3d th-btn group relative focus-visible:ring-2 focus-visible:ring-ring"
    >
      {rotulo}
      <span aria-hidden="true" className="text-[9px] opacity-80">
        {ativo ? (ordem.dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
      <AjudaOrdem />
    </button>
  );
}

/* Título de coluna sem ordenação: mesma aparência dos botões, sem ação. */
function ThEstatico({ rotulo }: { rotulo: string }) {
  return (
    <span aria-disabled="true" className="btn-3d th-btn select-none">
      {rotulo}
    </span>
  );
}

export function LocaisZona() {
  const [cidade, setCidade] = useState(INICIAL.nome);
  const [zonaSel, setZonaSel] = useState(INICIAL.zonaLider);
  const [ordem, setOrdem] = useState<Ordenacao>({ chave: "votos", dir: "desc" });
  const info = POR_NOME.get(cidade) ?? INICIAL;
  const zona = info.zonas.find((z) => z.zona === zonaSel) ?? null;

  const linhas = useMemo(() => {
    if (!zona) return [];
    const ls = [...zona.locais];
    const dir = ordem.dir === "asc" ? 1 : -1;
    if (ordem.chave === "local")
      ls.sort((a, b) => dir * a[0].localeCompare(b[0], "pt-BR") || dir * (a[2] - b[2]));
    else if (ordem.chave === "endereco")
      ls.sort((a, b) => dir * a[1].localeCompare(b[1], "pt-BR") || dir * (a[2] - b[2]));
    else if (ordem.chave === "bairro")
      ls.sort(
        (a, b) => dir * (a[7] || "").localeCompare(b[7] || "", "pt-BR") || dir * (a[2] - b[2]),
      );
    else ls.sort((a, b) => dir * (a[2] - b[2]) || a[0].localeCompare(b[0], "pt-BR"));
    return ls;
  }, [zona, ordem]);

  /* 1º clique na coluna: ordem crescente; clique seguinte: inverte a ordem. */
  const ordenarPor = (chave: Ordem) =>
    setOrdem((s) =>
      s.chave === chave ? { chave, dir: s.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" },
    );

  const trocar = (nome: string) => {
    const c = POR_NOME.get(nome);
    if (!c) return;
    setCidade(nome);
    setZonaSel(c.zonaLider);
  };

  const total26 = TOTAIS[cidade] ?? 0;

  return (
    <section className="relative rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-[2rem] font-semibold">Votos por zona e local de votação em 2026</h3>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <select
          value={cidade}
          onChange={(e) => trocar(e.target.value)}
          aria-label="Escolher cidade"
          className="rounded-lg border-[3px] border-nav bg-nav/10 px-4 py-2 text-sm font-semibold text-foreground shadow-md outline-none focus-visible:ring-2 focus-visible:ring-nav/50 focus-visible:ring-offset-1"
        >
          {CIDADES.map((c) => (
            <option key={c.nome}>{c.nome}</option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-md border bg-background px-3 py-2 text-sm">
          <span className="text-foreground">
            Total de votos em 2026: <strong>{fmt(total26)}</strong>
          </span>
          <span className="text-foreground">
            Nº de Zona(s): <strong>{info.zonas.length}</strong>
          </span>
          <span className="text-foreground">
            Mais votada:{" "}
            <strong>
              Zona {info.zonaLider} — {fmt(info.liderTotal)} votos
            </strong>
          </span>
        </div>
      </div>

      <div className={`mb-4 grid gap-2 ${ZONA_GRID}`}>
        {info.zonas.map((z) => {
          const marcada = z.zona === zonaSel;
          return (
            <label key={z.zona} className="flex">
              <input
                type="radio"
                name="zona-locais"
                className="peer sr-only"
                checked={marcada}
                onChange={() => setZonaSel(z.zona)}
              />
              <span
                data-active={marcada}
                className="btn-3d w-full justify-center px-2 py-1.5 text-xs peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
              >
                Zona {z.zona} - {fmt(z.total)}
              </span>
            </label>
          );
        })}
      </div>

      {!zona ? (
        <p className="text-sm text-muted-foreground">Selecione uma zona.</p>
      ) : (
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2">
                  <ThBotao chave="local" rotulo="Local" ordem={ordem} onClick={ordenarPor} />
                </th>
                <th className="px-4 py-2 text-center">
                  <ThBotao chave="votos" rotulo="Votos" ordem={ordem} onClick={ordenarPor} />
                </th>
                <th className="py-2 text-center">
                  <ThBotao chave="endereco" rotulo="End." ordem={ordem} onClick={ordenarPor} />
                </th>
                <th className="py-2">
                  <ThBotao chave="bairro" rotulo="Bairro" ordem={ordem} onClick={ordenarPor} />
                </th>
                <th className="py-2 text-center">
                  <ThEstatico rotulo="Seções" />
                </th>
                <th className="py-2 text-center whitespace-nowrap">
                  <ThEstatico rotulo="Aptos" />
                </th>
                <th className="py-2 text-center whitespace-nowrap">
                  <ThEstatico rotulo="Comparec." />
                </th>
                <th className="py-2 text-center whitespace-nowrap">
                  <ThEstatico rotulo="Abst." />
                </th>
                <th className="py-2 text-center whitespace-nowrap">
                  <ThEstatico rotulo="Nominais" />
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={`${l[0]}-${i}`} className="border-b">
                  <td className="py-2 pr-3">{l[0]}</td>
                  <td className="py-2 px-4 text-center font-semibold">{fmt(l[2])}</td>
                  <td className="pl-3 text-muted-foreground">{l[1]}</td>
                  <td className="pl-3 text-muted-foreground">{l[7] || "—"}</td>
                  <td
                    className="py-2 whitespace-nowrap pl-3 text-center text-muted-foreground"
                    title={l[9].join(", ")}
                  >
                    {l[9].length > 0 ? `${l[9].length} seções` : "—"}
                  </td>
                  <td className="py-2 pl-5 pr-2 text-center whitespace-nowrap">{fmt(l[3])}</td>
                  <td className="py-2 pl-5 pr-2 text-center whitespace-nowrap">{fmt(l[4])}</td>
                  <td className="py-2 pl-5 pr-2 text-center whitespace-nowrap">{fmt(l[5])}</td>
                  <td className="py-2 pl-5 pr-2 text-center whitespace-nowrap">{fmt(l[6])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
