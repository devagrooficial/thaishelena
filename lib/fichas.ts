import { mascaraTelefone } from "./mascaras";

// Tipos de ficha disponíveis. `arquivo` é o modelo HTML em /templates.
// `modelo`: fichas no padrão atual (anamnese/orçamento), que usam a base comum
// (_ficha.css, _ficha.js e as partes em /templates/_partes).
// `legado`: modelos antigos — continuam abrindo as fichas já criadas, mas não aparecem em "Nova ficha".
type DefFicha = {
  nome: string;
  curto: string;
  desc: string;
  arquivo: string;
  modelo?: "anamnese" | "orcamento";
  legado?: boolean;
};

const DEFS = {
  anamnese_microestrias: {
    nome: "Anamnese e Protocolo — Estrias (MicroEstrias)",
    curto: "Anamnese Estrias",
    desc: "Saúde, avaliação, protocolo, sessões, pagamentos e termo",
    arquivo: "anamnese_microestrias.html",
    modelo: "anamnese",
  },
  anamnese_dermalift: {
    nome: "Anamnese e Protocolo — Flacidez (DermaLift)",
    curto: "Anamnese Flacidez",
    desc: "Saúde, avaliação, protocolo, sessões, pagamentos e termo",
    arquivo: "anamnese_dermalift.html",
    modelo: "anamnese",
  },
  anamnese_manchas: {
    nome: "Anamnese e Protocolo — Manchas e Hipercromias (HPI)",
    curto: "Anamnese Manchas",
    desc: "Saúde, avaliação, protocolo, sessões, pagamentos e termo",
    arquivo: "anamnese_manchas.html",
    modelo: "anamnese",
  },
  anamnese_cicatrizes: {
    nome: "Anamnese e Protocolo — Cicatrizes",
    curto: "Anamnese Cicatrizes",
    desc: "Saúde, avaliação, protocolo, sessões, pagamentos e termo",
    arquivo: "anamnese_cicatrizes.html",
    modelo: "anamnese",
  },
  orcamento_microestrias: {
    nome: "Orçamento — Estrias (MicroEstrias)",
    curto: "Orçamento Estrias",
    desc: "Plano, investimento, condições e orientações",
    arquivo: "orcamento_microestrias.html",
    modelo: "orcamento",
  },
  orcamento_dermalift: {
    nome: "Orçamento — Flacidez (DermaLift)",
    curto: "Orçamento Flacidez",
    desc: "Plano, investimento, condições e orientações",
    arquivo: "orcamento_dermalift.html",
    modelo: "orcamento",
  },
  orcamento_manchas: {
    nome: "Orçamento — Manchas e Hipercromias (HPI)",
    curto: "Orçamento Manchas",
    desc: "Plano, investimento, condições e orientações",
    arquivo: "orcamento_manchas.html",
    modelo: "orcamento",
  },
  orcamento_cicatrizes: {
    nome: "Orçamento — Cicatrizes",
    curto: "Orçamento Cicatrizes",
    desc: "Plano, investimento, condições e orientações",
    arquivo: "orcamento_cicatrizes.html",
    modelo: "orcamento",
  },
  capa: {
    nome: "Capa — Entrega de Documentos",
    curto: "Capa",
    desc: "Entrega final de documentos",
    arquivo: "capa.html",
  },
  anamnese_estrias: {
    nome: "Anamnese — Tratamento de Estrias (modelo antigo)",
    curto: "Anamnese (antiga)",
    desc: "Modelo antigo",
    arquivo: "anamnese_estrias.html",
    legado: true,
  },
  orcamento_estrias: {
    nome: "Orçamento — MicroEstrias (modelo antigo)",
    curto: "Orçamento Estrias (antigo)",
    desc: "Modelo antigo",
    arquivo: "orcamento_estrias.html",
    legado: true,
  },
  orcamento_flacidez: {
    nome: "Protocolo Flacidez — Ficha e Orçamento (modelo antigo)",
    curto: "Orçamento Flacidez (antigo)",
    desc: "Modelo antigo",
    arquivo: "orcamento_flacidez.html",
    legado: true,
  },
} satisfies Record<string, DefFicha>;

export type TipoFicha = keyof typeof DEFS;
export const TIPOS: Record<TipoFicha, DefFicha> = DEFS;

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
  // padrão atual: os ids dos campos são os mesmos em todas as anamneses / todos os orçamentos
  if (TIPOS[tipo].modelo === "anamnese") {
    return {
      nome: n,
      cpf: c.cpf ?? "",
      nascimento: c.nascimento ?? "",
      telefone: mascaraTelefone(c.telefone ?? ""),
      endereco: c.endereco ?? "",
      instagram: (c.rede_social ?? "").replace(/^@/, ""),
      sx_f: c.sexo === "F",
      sx_m: c.sexo === "M",
      termo_data: hoje(),
    };
  }
  if (TIPOS[tipo].modelo === "orcamento") {
    return { nome: n, nascimento: c.nascimento ?? "", data_orc: hoje(), data_ass: hoje() };
  }
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
    default:
      return {};
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

// `tipo`: "sessao" = atendimento, "pagamento" = lançamento financeiro,
// "ambos" = linha que é as duas coisas (fichas antigas de orçamento).
export type Sessao = {
  data: string;
  descricao: string;
  valor: number;
  status: "Pago" | "Pendente" | "";
  tipo: "sessao" | "pagamento" | "ambos";
};

const statusDe = (s: string | undefined) => (s === "Pago" || s === "Pendente" ? s : "");

function lerDados(f: Pick<Ficha, "dados">): Record<string, unknown> | null {
  if (!f.dados) return null;
  try {
    return JSON.parse(f.dados);
  } catch {
    return null;
  }
}

export function sessoesDa(f: Pick<Ficha, "tipo" | "dados">): Sessao[] {
  const d = lerDados(f) as { sessoes?: Linha[]; pagamentos?: Linha[] } | null;
  if (!d) return [];
  if (TIPOS[f.tipo]?.modelo === "anamnese") {
    // sessões: [nº, data, região/procedimento, observações] — nº e às vezes a região já vêm preenchidos,
    // então só conta a linha com data ou observação
    const sessoes: Sessao[] = (d.sessoes ?? [])
      .filter((l) => [l[1], l[3]].some((x) => x && x.trim()))
      .map((l) => ({ data: l[1] ?? "", descricao: l[2] ?? "", valor: 0, status: "", tipo: "sessao" }));
    // pagamentos: [data, referência, valor, forma, status] — a referência já vem preenchida
    const pagamentos: Sessao[] = (d.pagamentos ?? [])
      .filter((l) => (l[0] && l[0].trim()) || num(l[2]) > 0)
      .map((l) => ({
        data: l[0] ?? "",
        descricao: `Pagamento · ${l[1] || "parcela"}`,
        valor: num(l[2]),
        status: statusDe(l[4]),
        tipo: "pagamento",
      }));
    return [...sessoes, ...pagamentos];
  }
  const linhas = (d.sessoes ?? []).filter((l) => l.some((x) => x && x.trim()));
  switch (f.tipo) {
    case "anamnese_estrias":
      return linhas.map((l) => ({ data: l[0] ?? "", descricao: l[1] ?? "", valor: 0, status: "", tipo: "sessao" }));
    case "orcamento_estrias":
      return linhas.map((l) => ({
        data: l[0] ?? "",
        descricao: l[1] ?? "",
        valor: num(l[2]),
        status: statusDe(l[4]),
        tipo: "ambos",
      }));
    case "orcamento_flacidez":
      return linhas.map((l) => ({
        data: l[0] ?? "",
        descricao: l[1] ?? "",
        valor: num(l[2]),
        status: num(l[2]) > 0 ? "Pago" : "",
        tipo: "ambos",
      }));
    default:
      return [];
  }
}

// Valor contratado da ficha. No padrão atual o financeiro fica na anamnese (protocolo fechado):
// vale o "Valor total do protocolo". O orçamento novo é só a proposta e não entra na conta,
// para não somar o mesmo tratamento duas vezes. Nas fichas antigas de orçamento vale a soma dos itens.
export function totalOrcamento(f: Pick<Ficha, "tipo" | "dados">): number {
  const d = lerDados(f) as { campos?: Record<string, string>; orc?: Linha[] } | null;
  if (!d) return 0;
  const def = TIPOS[f.tipo];
  if (def?.modelo === "anamnese") return num(d.campos?.valor_total);
  if (def?.legado && f.tipo.startsWith("orcamento")) {
    return (d.orc ?? []).reduce((s, l) => s + num(l[1]) * num(l[2]), 0);
  }
  return 0;
}

// Resumo financeiro de uma ficha. "pendente" = quanto falta receber:
// valor contratado − total pago; sem valor, soma dos lançamentos marcados como pendentes.
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
