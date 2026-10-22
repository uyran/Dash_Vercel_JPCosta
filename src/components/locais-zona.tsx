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

export function LocaisZona() {
  const [cidade, setCidade] = useState(INICIAL.nome);
  const [zonaSel, setZonaSel] = useState(INICIAL.zonaLider);
  const [ordem, setOrdem] = useState<Ordem>("votos");
  const info = POR_NOME.get(cidade) ?? INICIAL;
  const zona = info.zonas.find((z) => z.zona === zonaSel) ?? null;
  const linhas = useMemo(() => {
    if (!zona) return [];
    const ls = [...zona.locais];
    if (ordem === "local") ls.sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
    else if (ordem === "endereco") ls.sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
    else if (ordem === "bairro") ls.sort((a, b) => (a[7] || "").localeCompare(b[7] || "", "pt-BR"));
    else ls.sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0], "pt-BR"));
    return ls;
  }, [zona, ordem]);

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
          className="rounded-md border bg-background px-3 py-2 text-sm"
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

      <div className="mb-4 flex flex-wrap gap-2">
        {info.zonas.map((z) => {
          const marcada = z.zona === zonaSel;
          return (
            <label key={z.zona} className="inline-flex">
              <input
                type="radio"
                name="zona-locais"
                className="peer sr-only"
                checked={marcada}
                onChange={() => setZonaSel(z.zona)}
              />
              <span
                data-active={marcada}
                className="btn-3d px-3 py-1.5 text-xs peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
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
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="ordem-locais"
                      className="peer sr-only"
                      checked={ordem === "local"}
                      onChange={() => setOrdem("local")}
                    />
                    <span
                      data-active={ordem === "local"}
                      className="btn-3d group relative peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    >
                      Local de votação
                      <AjudaOrdem />
                    </span>
                  </label>
                </th>
                <th className="py-2 px-4 text-center">
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="ordem-locais"
                      className="peer sr-only"
                      checked={ordem === "votos"}
                      onChange={() => setOrdem("votos")}
                    />
                    <span
                      data-active={ordem === "votos"}
                      className="btn-3d group relative peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    >
                      Votos
                      <AjudaOrdem />
                    </span>
                  </label>
                </th>
                <th className="py-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="ordem-locais"
                      className="peer sr-only"
                      checked={ordem === "endereco"}
                      onChange={() => setOrdem("endereco")}
                    />
                    <span
                      data-active={ordem === "endereco"}
                      className="btn-3d group relative peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    >
                      Endereço
                      <AjudaOrdem />
                    </span>
                  </label>
                </th>
                <th className="py-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="ordem-locais"
                      className="peer sr-only"
                      checked={ordem === "bairro"}
                      onChange={() => setOrdem("bairro")}
                    />
                    <span
                      data-active={ordem === "bairro"}
                      className="btn-3d group relative peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                    >
                      Bairro
                      <AjudaOrdem />
                    </span>
                  </label>
                </th>
                <th className="w-[140px] py-2 text-center">
                  <span className="inline-flex items-center rounded-full border-2 border-border px-[0.7rem] py-1 text-[11px] font-semibold leading-[1.25] text-muted-foreground">
                    Seções
                  </span>
                </th>
                <th className="py-2 pl-5 pr-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border-2 border-border px-[0.7rem] py-1 text-[11px] font-semibold leading-[1.25] text-muted-foreground">
                    Aptos
                  </span>
                </th>
                <th className="py-2 pl-5 pr-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border-2 border-border px-[0.7rem] py-1 text-[11px] font-semibold leading-[1.25] text-muted-foreground">
                    Comparec.
                  </span>
                </th>
                <th className="py-2 pl-5 pr-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border-2 border-border px-[0.7rem] py-1 text-[11px] font-semibold leading-[1.25] text-muted-foreground">
                    Abst.
                  </span>
                </th>
                <th className="py-2 pl-5 pr-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full border-2 border-border px-[0.7rem] py-1 text-[11px] font-semibold leading-[1.25] text-muted-foreground">
                    Nominais
                  </span>
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
