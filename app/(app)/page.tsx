import Link from "next/link";
import { db, infoBanco } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { FUSO, TIPOS, brl, dataBR, financeiro, hoje, sessoesDa, type Ficha } from "@/lib/fichas";
import { iniciais } from "@/lib/mascaras";
import { Icone } from "@/components/Icone";

export const metadata = { title: "Início · Espaço Thaís Helena" };

type Linha = Ficha & { nome: string };

function saudacao() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: FUSO }));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function dataExtenso() {
  const t = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: FUSO });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default async function Dashboard() {
  await exigirLogin();
  const c = await db();
  const [rc, rf, rn] = await Promise.all([
    c.execute("SELECT COUNT(*) AS n FROM clientes"),
    c.execute(`SELECT f.*, cl.nome FROM fichas f JOIN clientes cl ON cl.id = f.cliente_id ORDER BY f.updated_at DESC`),
    c.execute(`SELECT cl.id, cl.nome, cl.telefone, cl.created_at,
                 (SELECT COUNT(*) FROM fichas f WHERE f.cliente_id = cl.id) AS n
               FROM clientes cl ORDER BY cl.created_at DESC LIMIT 5`),
  ]);
  const totalClientes = Number(rc.rows[0].n);
  const fichas = rf.rows as unknown as Linha[];
  const novas = rn.rows as unknown as { id: string; nome: string; telefone: string | null; created_at: string; n: number }[];

  const mes = hoje().slice(0, 7);
  let recebidoMes = 0, pendenteTotal = 0;
  const pendencias: { cliente: string; clienteId: string; fichaId: string; ficha: string; falta: number; orcado: number }[] = [];
  const clientesAtivos = new Set<string>();

  for (const f of fichas) {
    for (const s of sessoesDa(f)) {
      if (s.data.startsWith(mes)) {
        clientesAtivos.add(f.cliente_id);
        if (s.status === "Pago") recebidoMes += s.valor;
      }
    }
    const fin = financeiro(f);
    if (fin.pendente > 0) {
      pendenteTotal += fin.pendente;
      pendencias.push({
        cliente: f.nome, clienteId: f.cliente_id, fichaId: f.id,
        ficha: TIPOS[f.tipo]?.curto ?? f.tipo, falta: fin.pendente, orcado: fin.orcado,
      });
    }
  }
  pendencias.sort((a, b) => b.falta - a.falta);
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", timeZone: FUSO });

  const kpis = [
    { rot: "Clientes cadastradas", val: String(totalClientes), ic: "clientes", cls: "" },
    { rot: `Atendidas em ${nomeMes}`, val: String(clientesAtivos.size), ic: "calendario", cls: "" },
    { rot: `Recebido em ${nomeMes}`, val: brl(recebidoMes), ic: "dinheiro", cls: "ok" },
    { rot: "Falta receber", val: brl(pendenteTotal), ic: "alerta", cls: pendenteTotal ? "erro" : "" },
  ];

  return (
    <>
      <div className="cab-pag">
        <div>
          <h1>{saudacao()}, Thaís</h1>
          <div className="sub">{dataExtenso()}</div>
        </div>
        <div className="cab-acoes">
          <form action="/clientes" className="busca" role="search" style={{ minWidth: 240 }}>
            <Icone n="busca" s={18} />
            <input className="in" type="search" name="q" placeholder="Buscar cliente" aria-label="Buscar cliente" />
          </form>
          <Link className="btn so-desk" href="/clientes/nova"><Icone n="mais" s={18} /> Nova cliente</Link>
        </div>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.rot} className="card kpi">
            <span className={`ic ${k.cls}`}><Icone n={k.ic} s={19} /></span>
            <div>
              <div className="val">{k.val}</div>
              <div className="rot">{k.rot}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="duas">
        <div className="card">
          <div className="card-cab"><h2>Continuar de onde parou</h2><Link href="/clientes" className="muted">Ver clientes</Link></div>
          <div className="linhas" style={{ marginTop: 10 }}>
            {fichas.slice(0, 7).map((f) => (
              <a key={f.id} href={`/f/${f.id}`} className="linha">
                <span className="avatar">{iniciais(f.nome)}</span>
                <span className="info">
                  <span className="tit" style={{ display: "block" }}>{f.nome}</span>
                  <span className="meta"><span>{TIPOS[f.tipo]?.curto ?? f.tipo}</span><span>Editada {dataBR(f.updated_at)}</span></span>
                </span>
                <Icone n="seta" s={18} className="seta" />
              </a>
            ))}
            {!fichas.length && (
              <div className="vazio">
                <b>Nenhuma ficha ainda</b>Cadastre uma cliente e crie a primeira ficha.
                <br /><Link className="btn" href="/clientes/nova"><Icone n="mais" s={18} /> Nova cliente</Link>
              </div>
            )}
          </div>
        </div>

        <div className="pilha">
          <div className="card">
            <div className="card-cab"><h2>Falta receber</h2>{pendencias.length > 0 && <span className="pill erro">{pendencias.length}</span>}</div>
            <div className="linhas" style={{ marginTop: 10 }}>
              {pendencias.slice(0, 6).map((p) => (
                <a key={p.fichaId} href={`/f/${p.fichaId}`} className="linha">
                  <span className="info">
                    <span className="tit" style={{ display: "block" }}>{p.cliente}</span>
                    <span className="meta"><span>{p.ficha}</span>{p.orcado > 0 && <span>de {brl(p.orcado)}</span>}</span>
                  </span>
                  <span className="lado">
                    <b className="num" style={{ color: "var(--erro)" }}>{brl(p.falta)}</b>
                    <div className="muted">falta receber</div>
                  </span>
                </a>
              ))}
              {!pendencias.length && <div className="vazio">Nenhum pagamento pendente.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-cab"><h2>Últimas cadastradas</h2></div>
            <div className="linhas" style={{ marginTop: 10 }}>
              {novas.map((n) => (
                <Link key={n.id} href={`/clientes/${n.id}`} className="linha">
                  <span className="avatar">{iniciais(n.nome)}</span>
                  <span className="info">
                    <span className="tit" style={{ display: "block" }}>{n.nome}</span>
                    <span className="meta"><span>{n.telefone || "Sem telefone"}</span><span>{dataBR(n.created_at)}</span></span>
                  </span>
                  <Icone n="seta" s={18} className="seta" />
                </Link>
              ))}
              {!novas.length && <div className="vazio">Nenhuma cliente ainda.</div>}
            </div>
          </div>
        </div>
      </div>
      <div className={`banco so-mob${infoBanco.permanente ? "" : " temp"}`} style={{ marginTop: 20 }}>
        <span className="ponto" /> Banco: {infoBanco.tipo}
        <small>{infoBanco.local}</small>
      </div>
    </>
  );
}
