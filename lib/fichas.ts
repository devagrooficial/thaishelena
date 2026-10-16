import { mascaraTelefone } from "./mascaras";

// Tipos de ficha disponíveis. `arquivo` é o modelo HTML em /templates.
export const TIPOS = {
  anamnese_estrias: {
    nome: "Anamnese — Tratamento de Estrias",
    curto: "Anamnese",
    arquivo: "anamnese_estrias.html",
  },
  orcamento_estrias: {
    nome: "Orçamento — MicroEstrias",
    curto: "Orçamento Estrias",
    arquivo: "orcamento_estrias.html",
  },
  orcamento_flacidez: {
    nome: "Protocolo Flacidez — Ficha e Orçamento",
    curto: "Orçamento Flacidez",
    arquivo: "orcamento_flacidez.html",
  },
  capa: {
    nome: "Capa — Entrega de Documentos",
    curto: "Capa",
    arquivo: "capa.html",
  },
} as const;

export type TipoFicha = keyof typeof TIPOS;

export function isTipo(t: string): t is TipoFicha {
  return t in TIPOS;
}

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  nascimento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  rede_social: string | null;
  sexo: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Ficha = {
  id: string;
  cliente_id: string;
  tipo: TipoFicha;
  titulo: string | null;
  dados: string | null;
  created_at: string;
  updated_at: string;
};

export const FUSO = "America/Sao_Paulo";
// data de hoje (AAAA-MM-DD) no horário de Brasília
export const hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: FUSO });

// Campos da ficha que são preenchidos com o cadastro da cliente na primeira abertura.
export function prefill(tipo: TipoFicha, c: Cliente): Record<string, string | boolean> {
  const n = c.nome ?? "";
  switch (tipo) {
    case "anamnese_estrias":
      return {
        c0: n,
        cpf: c.cpf ?? "",
        c1: c.nascimento ?? "",
        c2: mascaraTelefone(c.telefone ?? ""),
        c3: c.endereco ?? "",
        c4: c.rede_social ?? "",
        s1: c.sexo === "F",
        s2: c.sexo === "M",
        c11: hoje(),
      };
    case "orcamento_estrias":
      return { c0: n, cpf: c.cpf ?? "", c9: c.nascimento ?? "", c1: hoje() };
    case "orcamento_flacidez":
      return { c0: n, c1: hoje() };
    case "capa":
      return { c0: n, c3: hoje() };
  }
}

// ---------- leitura dos dados salvos (para dashboard e resumo) ----------

type Linha = string[];
// mesmo cálculo das fichas: "1.000" = mil, "1.000,50" = mil e cinquenta centavos, "2.5" = dois e meio
const num = (s: string | undefined) => {
  let t = String(s ?? "").replace(/[^\d,.-]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/\.\d{3}$/.test(t)) t = t.replace(/\./g, "");
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : 0;
};

export type Sessao = { data: string; descricao: string; valor: number; status: "Pago" | "Pendente" | "" };

export function sessoesDa(f: Pick<Ficha, "tipo" | "dados">): Sessao[] {
  if (!f.dados) return [];
  let d: { sessoes?: Linha[] };
  try {
    d = JSON.parse(f.dados);
  } catch {
    return [];
  }
  const linhas = (d.sessoes ?? []).filter((l) => l.some((x) => x && x.trim()));
  switch (f.tipo) {
    case "anamnese_estrias":
      return linhas.map((l) => ({ data: l[0] ?? "", descricao: l[1] ?? "", valor: 0, status: "" }));
    case "orcamento_estrias":
      return linhas.map((l) => ({
        data: l[0] ?? "",
        descricao: l[1] ?? "",
        valor: num(l[2]),
        status: l[4] === "Pago" || l[4] === "Pendente" ? l[4] : "",
      }));
    case "orcamento_flacidez":
      return linhas.map((l) => ({
        data: l[0] ?? "",
        descricao: l[1] ?? "",
        valor: num(l[2]),
        status: num(l[2]) > 0 ? "Pago" : "",
      }));
    default:
      return [];
  }
}

export function totalOrcamento(f: Pick<Ficha, "tipo" | "dados">): number {
  if (!f.dados || !f.tipo.startsWith("orcamento")) return 0;
  try {
    const d = JSON.parse(f.dados) as { orc?: Linha[] };
    return (d.orc ?? []).reduce((s, l) => s + num(l[1]) * num(l[2]), 0);
  } catch {
    return 0;
  }
}

// Resumo financeiro de uma ficha. "pendente" = quanto falta receber:
// total do orçamento − total pago; sem orçamento, soma das sessões marcadas como pendentes.
export function financeiro(f: Pick<Ficha, "tipo" | "dados">) {
  const orcado = totalOrcamento(f);
  let pago = 0, marcadoPendente = 0;
  for (const s of sessoesDa(f)) {
    if (s.status === "Pago") pago += s.valor;
    if (s.status === "Pendente") marcadoPendente += s.valor;
  }
  const pendente = orcado > 0 ? Math.max(orcado - pago, 0) : marcadoPendente;
  return { orcado, pago, pendente };
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso: string | null | undefined) => {
  if (!iso) return "";
  // timestamps (created_at/updated_at) estão em UTC → converte para Brasília
  if (iso.length > 10 && !Number.isNaN(Date.parse(iso))) {
    return new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO });
  }
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

export function idade(nasc: string | null) {
  if (!nasc) return null;
  const n = new Date(nasc + "T00:00:00");
  const h = new Date();
  let i = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) i--;
  return i >= 0 ? i : null;
}
