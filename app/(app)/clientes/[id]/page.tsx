import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import {
  TIPOS, brl, dataBR, financeiro, idade, sessoesDa,
  type Cliente, type Ficha, type TipoFicha,
} from "@/lib/fichas";
import { iniciais, linkWhatsApp } from "@/lib/mascaras";
import { atualizarCliente, criarFicha, duplicarFicha, excluirCliente, excluirFicha } from "../../../actions";
import { ClienteForm } from "@/components/ClienteForm";
import { Confirmar } from "@/components/Confirmar";
import { Icone } from "@/components/Icone";

const DESC: Record<TipoFicha, string> = {
  anamnese_estrias: "Saúde, avaliação, regiões e termo",
  orcamento_estrias: "MicroEstrias · valores e pagamentos",
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
    sql: "SELECT * FROM fichas WHERE cliente_id = ? ORDER BY updated_at DESC",
    args: [id],
  });
  const fichas = rf.rows as unknown as Ficha[];

  let orcado = 0, pago = 0, pendente = 0;
  const historico: { data: string; descricao: string; valor: number; status: string; ficha: string }[] = [];
  for (const f of fichas) {
    const fin = financeiro(f);
    orcado += fin.orcado;
    pago += fin.pago;
    pendente += fin.pendente;
    for (const s of sessoesDa(f)) historico.push({ ...s, ficha: TIPOS[f.tipo]?.curto ?? f.tipo });
  }
  historico.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const anos = idade(cliente.nascimento);
  const zap = linkWhatsApp(cliente.telefone);
  const pct = orcado ? Math.min(100, Math.round((pago / orcado) * 100)) : 0;
  const primeiroNome = cliente.nome.split(" ")[0];

  return (
    <>
      {salvo && <div className="faixa ok"><Icone n="check" s={18} /> Dados da cliente salvos.</div>}
      <Link href="/clientes" className="trilha"><Icone n="voltar" s={15} /> Clientes</Link>

      <div className="pilha">
        <div className="card perfil">
          <span className="avatar g">{iniciais(cliente.nome)}</span>
          <div className="info">
            <h1>{cliente.nome}</h1>
            <div className="chips">
              {zap && (
                <a className="chip zap" href={zap} target="_blank" rel="noreferrer"><Icone n="zap" s={15} /> {cliente.telefone}</a>
              )}
              {!zap && cliente.telefone && <span className="chip"><Icone n="tel" s={15} /> {cliente.telefone}</span>}
              {cliente.cpf && <span className="chip">CPF {cliente.cpf}</span>}
              {anos !== null && <span className="chip"><Icone n="calendario" s={15} /> {anos} anos · {dataBR(cliente.nascimento)}</span>}
              {cliente.rede_social && <span className="chip">{cliente.rede_social}</span>}
              {cliente.email && <a className="chip" href={`mailto:${cliente.email}`}>{cliente.email}</a>}
            </div>
            {cliente.observacoes && <p className="muted" style={{ margin: "10px 0 0", whiteSpace: "pre-line" }}>{cliente.observacoes}</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-cab"><h2>Nova ficha para {primeiroNome}</h2></div>
          <div className="card-corpo">
            <div className="novas">
              {(Object.keys(TIPOS) as TipoFicha[]).map((t) => (
                <form key={t} action={criarFicha.bind(null, cliente.id, t)}>
                  <button>
                    <span className="ic"><Icone n="ficha" s={18} /></span>
                    <b>{TIPOS[t].curto}</b>
                    <small>{DESC[t]}</small>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-cab">
            <h2>Fichas</h2>
            <span className="muted">{fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}</span>
          </div>
          <div className="linhas" style={{ marginTop: 10 }}>
            {fichas.map((f) => {
              const n = sessoesDa(f).length;
              return (
                <div key={f.id} className="linha ficha">
                  <a href={`/f/${f.id}`} className="avatar ic-ficha" style={{ borderRadius: 12 }} aria-hidden tabIndex={-1}>
                    <Icone n="ficha" s={19} />
                  </a>
                  <a href={`/f/${f.id}`} className="info">
                    <span className="tit" style={{ display: "block" }}>{f.titulo || TIPOS[f.tipo]?.nome}</span>
                    <span className="meta">
                      <span>Editada {dataBR(f.updated_at)}</span>
                      {n > 0 && <span>{n} {n === 1 ? "sessão" : "sessões"}</span>}
                      {!f.dados && <span className="pill cinza">em branco</span>}
                    </span>
                  </a>
                  <div className="ficha-acoes">
                    <a className="btn peq" href={`/f/${f.id}`}>Abrir</a>
                    <form action={duplicarFicha.bind(null, f.id)}>
                      <button className="btn-icone peq" title="Duplicar ficha" aria-label="Duplicar ficha"><Icone n="copiar" s={17} /></button>
                    </form>
                    <form action={excluirFicha.bind(null, f.id, cliente.id)}>
                      <Confirmar className="btn-icone peq perigo" titulo="Excluir ficha" msg="Excluir esta ficha? Os dados preenchidos serão perdidos.">
                        <Icone n="lixo" s={17} />
                      </Confirmar>
                    </form>
                  </div>
                </div>
              );
            })}
            {!fichas.length && (
              <div className="vazio"><b>Nenhuma ficha ainda</b>Escolha um modelo acima para começar.</div>
            )}
          </div>
        </div>

        <div className="duas">
          <div className="card">
            <div className="card-cab"><h2>Histórico de sessões</h2></div>
            <div className="linhas" style={{ marginTop: 10 }}>
              {historico.slice(0, 12).map((s, i) => (
                <div key={i} className="linha">
                  <span className="info">
                    <span className="tit" style={{ display: "block", fontWeight: 600 }}>{s.descricao || s.ficha}</span>
                    <span className="meta"><span>{dataBR(s.data) || "Sem data"}</span><span>{s.ficha}</span></span>
                  </span>
                  <span className="lado">
                    {s.valor ? <b className="num">{brl(s.valor)}</b> : null}
                    {s.status && (
                      <div><span className={`pill ${s.status === "Pago" ? "ok" : "erro"}`}>{s.status.toLowerCase()}</span></div>
                    )}
                  </span>
                </div>
              ))}
              {!historico.length && <div className="vazio">Nenhuma sessão registrada nas fichas.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-cab"><h2>Financeiro</h2>{orcado > 0 && <span className="muted">{pct}% pago</span>}</div>
            <div className="card-corpo">
              {orcado > 0 && <div className="barra"><span style={{ width: `${pct}%` }} /></div>}
              <div className="fin">
                <div><span>Total orçado</span><b>{brl(orcado)}</b></div>
                <div><span>Pago</span><b style={{ color: "var(--ok)" }}>{brl(pago)}</b></div>
                <div><span>Falta receber</span><b style={{ color: pendente ? "var(--erro)" : undefined }}>{brl(pendente)}</b></div>
              </div>
              <p className="muted" style={{ margin: "10px 0 0" }}>Falta receber = total orçado − total pago, somando as fichas de orçamento.</p>
            </div>
          </div>
        </div>

        <details className="card">
          <summary>
            <span><h2 style={{ display: "inline" }}>Dados cadastrais</h2> <span className="muted">· editar</span></span>
            <Icone n="seta" s={18} className="gira" />
          </summary>
          <ClienteForm action={atualizarCliente.bind(null, cliente.id)} cliente={cliente} botao="Salvar alterações" />
          <div className="zona-perigo">
            <span className="muted">Excluir remove a cliente e todas as fichas dela.</span>
            <form action={excluirCliente.bind(null, cliente.id)}>
              <Confirmar msg={`Excluir ${cliente.nome} e TODAS as fichas dela? Isso não pode ser desfeito.`}>
                <Icone n="lixo" s={16} /> Excluir cliente
              </Confirmar>
            </form>
          </div>
        </details>
      </div>
    </>
  );
}
