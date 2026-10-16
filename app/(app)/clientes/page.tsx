import Link from "next/link";
import { db } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { dataBR, idade } from "@/lib/fichas";
import { iniciais } from "@/lib/mascaras";
import { Icone } from "@/components/Icone";

export const metadata = { title: "Clientes · Espaço Thaís Helena" };

type Linha = {
  id: string; nome: string; cpf: string | null; telefone: string | null;
  nascimento: string | null; updated_at: string; n_fichas: number;
};

export default async function Clientes({ searchParams }: PageProps<"/clientes">) {
  await exigirLogin();
  const q = String((await searchParams).q ?? "").trim();
  const c = await db();
  const termo = `%${q.toLowerCase()}%`;
  const soDigitos = q.replace(/\D/g, "");
  const r = await c.execute({
    sql: `SELECT cl.id, cl.nome, cl.cpf, cl.telefone, cl.nascimento, cl.updated_at,
                 (SELECT COUNT(*) FROM fichas f WHERE f.cliente_id = cl.id) AS n_fichas
          FROM clientes cl
          WHERE ? = '' OR lower(cl.nome) LIKE ?
             OR (? <> '' AND (replace(replace(replace(cl.cpf,'.',''),'-',''),' ','') LIKE ?
                 OR replace(replace(replace(replace(replace(cl.telefone,'(',''),')',''),'-',''),' ',''),'+','') LIKE ?))
          ORDER BY lower(cl.nome)`,
    args: [q, termo, soDigitos, `%${soDigitos}%`, `%${soDigitos}%`],
  });
  const lista = r.rows as unknown as Linha[];

  return (
    <>
      <div className="cab-pag">
        <div>
          <h1>Clientes</h1>
          <div className="sub">
            {lista.length} {lista.length === 1 ? "cliente" : "clientes"}{q && ` encontrada${lista.length === 1 ? "" : "s"} para “${q}”`}
          </div>
        </div>
        <div className="cab-acoes so-desk">
          <Link className="btn" href="/clientes/nova"><Icone n="mais" s={18} /> Nova cliente</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-corpo" style={{ borderBottom: "1px solid var(--borda)" }}>
          <form className="busca" role="search">
            <Icone n="busca" s={18} />
            <input className="in" type="search" name="q" defaultValue={q} placeholder="Buscar por nome, CPF ou telefone" aria-label="Buscar cliente" />
          </form>
        </div>
        <div className="linhas">
          {lista.map((cl) => {
            const i = idade(cl.nascimento);
            const n = Number(cl.n_fichas);
            return (
              <Link key={cl.id} href={`/clientes/${cl.id}`} className="linha">
                <span className="avatar">{iniciais(cl.nome)}</span>
                <span className="info">
                  <span className="tit" style={{ display: "block" }}>{cl.nome}</span>
                  <span className="meta">
                    {cl.telefone && <span><Icone n="tel" s={13} />{cl.telefone}</span>}
                    {i !== null && <span>{i} anos</span>}
                    <span className="so-desk">Atualizada em {dataBR(cl.updated_at)}</span>
                  </span>
                </span>
                <span className="lado">
                  <span className={`pill${n ? "" : " cinza"}`}>{n} {n === 1 ? "ficha" : "fichas"}</span>
                </span>
                <Icone n="seta" s={18} className="seta" />
              </Link>
            );
          })}
          {!lista.length && (
            <div className="vazio">
              {q ? (
                <><b>Nenhuma cliente encontrada</b>Confira a grafia ou busque pelo telefone.</>
              ) : (
                <>
                  <b>Nenhuma cliente cadastrada ainda</b>Comece cadastrando a primeira.
                  <br /><Link className="btn" href="/clientes/nova"><Icone n="mais" s={18} /> Cadastrar cliente</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
