import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import {
  TIPOS, brl, dataBR, idade, sessoesDa, totalOrcamento,
  type Cliente, type Ficha, type TipoFicha,
} from "@/lib/fichas";
import { atualizarCliente, criarFicha, duplicarFicha, excluirCliente, excluirFicha } from "../../../actions";
import { ClienteForm } from "@/components/ClienteForm";
import { Confirmar } from "@/components/Confirmar";

const DESC: Record<TipoFicha, string> = {
  anamnese_estrias: "Saúde, avaliação, regiões, termo",
  orcamento_estrias: "Valores e pagamentos",
  orcamento_flacidez: "Dermalift · valores e sessões",
  capa: "Entrega final de documentos",
};

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const r = await (await db()).execute({ sql: "SELECT nome FROM clientes WHERE id = ?", args: [id] });
  return { title: `${r.rows[0]?.nome ?? "Cliente"} · Espaço Thaís Helena` };
}

export default async function ClientePage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  await exigirLogin();
  const { id } = await params;
  const salvo = (await searchParams).salvo;
  const c = await db();
  const rc = await c.execute({ sql: "SELECT * FROM clientes WHERE id = ?", args: [id] });
  const cliente = rc.rows[0] as unknown as Cliente | undefined;
  if (!cliente) notFound();
  const rf = await c.execute({
    sql: "SELECT * FROM fichas WHERE cliente_id = ? ORDER BY created_at DESC",
    args: [id],
  });
  const fichas = rf.rows as unknown as Ficha[];

  // resumo financeiro e histórico de sessões
  let orcado = 0, pago = 0, pendente = 0;
  const historico: { data: string; descricao: string; valor: number; status: string; ficha: string }[] = [];
  for (const f of fichas) {
    orcado += totalOrcamento(f);
    for (const s of sessoesDa(f)) {
      if (s.status === "Pago") pago += s.valor;
      if (s.status === "Pendente") pendente += s.valor;
      historico.push({ ...s, ficha: TIPOS[f.tipo]?.curto ?? f.tipo });
    }
  }
  historico.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const id_ = idade(cliente.nascimento);

  return (
    <>
      {salvo && <div className="aviso">Dados da cliente salvos.</div>}
      <div className="topo">
        <div>
          <div className="muted"><Link href="/clientes">Clientes</Link> /</div>
          <h1>{cliente.nome}</h1>
          <div className="muted">
            {[
              cliente.telefone,
              cliente.cpf && `CPF ${cliente.cpf}`,
              id_ !== null && `${id_} anos`,
              cliente.rede_social,
            ].filter(Boolean).join(" · ") || "Sem dados de contato"}
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <h2>Nova ficha para {cliente.nome.split(" ")[0]}</h2>
          <div className="novas">
            {(Object.keys(TIPOS) as TipoFicha[]).map((t) => (
              <form key={t} action={criarFicha.bind(null, cliente.id, t)}>
                <button>
                  {TIPOS[t].curto}
                  <small>{DESC[t]}</small>
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Fichas ({fichas.length})</h2>
          <table className="lista">
            <thead>
              <tr>
                <th>Ficha</th>
                <th className="esconde-mob">Criada</th>
                <th className="esconde-mob">Última edição</th>
                <th className="num">Sessões</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fichas.map((f) => (
                <tr key={f.id}>
                  <td>
                    <a href={`/f/${f.id}`}><b>{f.titulo || TIPOS[f.tipo]?.nome}</b></a>
                    {!f.dados && <> <span className="pill">em branco</span></>}
                  </td>
                  <td className="esconde-mob muted">{dataBR(f.created_at)}</td>
                  <td className="esconde-mob muted">{dataBR(f.updated_at)}</td>
                  <td className="num">{sessoesDa(f).length || ""}</td>
                  <td>
                    <div className="acoes" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                      <a className="btn peq" href={`/f/${f.id}`}>Abrir</a>
                      <form action={duplicarFicha.bind(null, f.id)}>
                        <button className="btn sec peq" title="Criar uma cópia desta ficha">Duplicar</button>
                      </form>
                      <form action={excluirFicha.bind(null, f.id, cliente.id)}>
                        <Confirmar msg="Excluir esta ficha? Os dados preenchidos serão perdidos.">Excluir</Confirmar>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {!fichas.length && (
                <tr><td colSpan={5} className="vazio">Nenhuma ficha ainda — escolha uma acima para começar.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid-2">
          <div className="card">
            <h2>Financeiro</h2>
            <table className="lista">
              <tbody>
                <tr><td>Total orçado</td><td className="num"><b>{brl(orcado)}</b></td></tr>
                <tr><td>Total pago</td><td className="num" style={{ color: "var(--ok)" }}><b>{brl(pago)}</b></td></tr>
                <tr><td>Pendente</td><td className="num" style={{ color: pendente ? "var(--alerta)" : undefined }}><b>{brl(pendente)}</b></td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ marginBottom: 0 }}>Calculado a partir das tabelas de orçamento e de pagamentos das fichas.</p>
          </div>
          <div className="card">
            <h2>Histórico de sessões</h2>
            {historico.length ? (
              <table className="lista">
                <tbody>
                  {historico.slice(0, 12).map((s, i) => (
                    <tr key={i}>
                      <td className="muted" style={{ width: 95 }}>{dataBR(s.data) || "—"}</td>
                      <td>{s.descricao || <span className="muted">{s.ficha}</span>}</td>
                      <td className="num">
                        {s.valor ? brl(s.valor) : ""}{" "}
                        {s.status === "Pendente" && <span className="pill pend">pendente</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="vazio">Nenhuma sessão registrada nas fichas.</div>
            )}
          </div>
        </div>

        <details className="card">
          <summary style={{ cursor: "pointer" }}><h2 style={{ display: "inline" }}>Dados cadastrais</h2> <span className="muted">(clique para editar)</span></summary>
          <div style={{ marginTop: 16 }}>
            <ClienteForm action={atualizarCliente.bind(null, cliente.id)} cliente={cliente} botao="Salvar alterações" />
            <p className="muted">Fichas novas já vêm preenchidas com estes dados.</p>
          </div>
          <hr style={{ border: 0, borderTop: "1px solid #f7d3e1", margin: "18px 0" }} />
          <form action={excluirCliente.bind(null, cliente.id)}>
            <Confirmar msg={`Excluir ${cliente.nome} e TODAS as fichas dela? Isso não pode ser desfeito.`}>
              Excluir cliente e fichas
            </Confirmar>
          </form>
        </details>
      </div>
    </>
  );
}
