import Link from "next/link";
import { db } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { FUSO, TIPOS, brl, dataBR, hoje, sessoesDa, type Ficha } from "@/lib/fichas";

export const metadata = { title: "Dashboard · Espaço Thaís Helena" };

type Linha = Ficha & { nome: string };

export default async function Dashboard() {
  await exigirLogin();
  const c = await db();
  const [rc, rf, rn] = await Promise.all([
    c.execute("SELECT COUNT(*) AS n FROM clientes"),
    c.execute(`SELECT f.*, cl.nome FROM fichas f JOIN clientes cl ON cl.id = f.cliente_id ORDER BY f.updated_at DESC`),
    c.execute("SELECT id, nome, telefone, created_at FROM clientes ORDER BY created_at DESC LIMIT 6"),
  ]);
  const totalClientes = Number(rc.rows[0].n);
  const fichas = rf.rows as unknown as Linha[];
  const novas = rn.rows as unknown as { id: string; nome: string; telefone: string | null; created_at: string }[];

  const mes = hoje().slice(0, 7);
  let recebidoMes = 0, pendenteTotal = 0;
  const pendencias: { cliente: string; clienteId: string; data: string; descricao: string; valor: number }[] = [];
  const clientesAtivos = new Set<string>();

  for (const f of fichas) {
    for (const s of sessoesDa(f)) {
      if (s.data.startsWith(mes)) {
        clientesAtivos.add(f.cliente_id);
        if (s.status === "Pago") recebidoMes += s.valor;
      }
      if (s.status === "Pendente") {
        pendenteTotal += s.valor;
        pendencias.push({ cliente: f.nome, clienteId: f.cliente_id, data: s.data, descricao: s.descricao, valor: s.valor });
      }
    }
  }
  pendencias.sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", timeZone: FUSO });

  return (
    <>
      <div className="topo">
        <div>
          <h1>Olá, Thaís 💗</h1>
          <div className="muted">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: FUSO })}
          </div>
        </div>
        <div className="acoes">
          <form action="/clientes" className="busca">
            <input className="in" name="q" placeholder="Buscar cliente…" />
          </form>
          <Link className="btn" href="/clientes/nova">+ Nova cliente</Link>
        </div>
      </div>

      <div className="grid-kpi">
        <div className="card kpi"><div className="rot">Clientes cadastradas</div><div className="val">{totalClientes}</div></div>
        <div className="card kpi"><div className="rot">Clientes atendidas em {nomeMes}</div><div className="val">{clientesAtivos.size}</div></div>
        <div className="card kpi"><div className="rot">Recebido em {nomeMes}</div><div className="val">{brl(recebidoMes)}</div></div>
        <div className="card kpi"><div className="rot">Pendente a receber</div><div className={`val${pendenteTotal ? " alerta" : ""}`}>{brl(pendenteTotal)}</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Fichas editadas recentemente</h2>
          <table className="lista">
            <tbody>
              {fichas.slice(0, 8).map((f) => (
                <tr key={f.id}>
                  <td>
                    <a href={`/f/${f.id}`}><b>{f.nome}</b></a>
                    <div className="muted">{TIPOS[f.tipo]?.curto ?? f.tipo}</div>
                  </td>
                  <td className="num muted">{dataBR(f.updated_at)}</td>
                </tr>
              ))}
              {!fichas.length && <tr><td className="vazio">Nenhuma ficha ainda.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Pagamentos pendentes</h2>
            <table className="lista">
              <tbody>
                {pendencias.slice(0, 8).map((p, i) => (
                  <tr key={i}>
                    <td>
                      <Link href={`/clientes/${p.clienteId}`}><b>{p.cliente}</b></Link>
                      <div className="muted">{[dataBR(p.data), p.descricao].filter(Boolean).join(" · ")}</div>
                    </td>
                    <td className="num"><span className="pill pend">{brl(p.valor)}</span></td>
                  </tr>
                ))}
                {!pendencias.length && <tr><td className="vazio">Nada pendente 🎉</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Últimas clientes cadastradas</h2>
            <table className="lista">
              <tbody>
                {novas.map((n) => (
                  <tr key={n.id}>
                    <td><Link href={`/clientes/${n.id}`}><b>{n.nome}</b></Link><div className="muted">{n.telefone}</div></td>
                    <td className="num muted">{dataBR(n.created_at)}</td>
                  </tr>
                ))}
                {!novas.length && (
                  <tr><td className="vazio"><Link href="/clientes/nova">Cadastre a primeira cliente</Link></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
