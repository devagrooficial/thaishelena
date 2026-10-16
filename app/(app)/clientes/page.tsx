import Link from "next/link";
import { db } from "@/lib/db";
import { exigirLogin } from "@/lib/sessao";
import { dataBR, idade } from "@/lib/fichas";

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
      <div className="topo">
        <div>
          <h1>Clientes</h1>
          <div className="muted">{lista.length} {lista.length === 1 ? "cliente" : "clientes"}{q && ` para “${q}”`}</div>
        </div>
        <Link className="btn" href="/clientes/nova">+ Nova cliente</Link>
      </div>
      <div className="card stack">
        <form className="busca">
          <input className="in" name="q" defaultValue={q} placeholder="Buscar por nome, CPF ou telefone…" autoFocus />
          <button className="btn sec">Buscar</button>
        </form>
        <table className="lista">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="esconde-mob">Telefone</th>
              <th className="esconde-mob">Idade</th>
              <th className="num">Fichas</th>
              <th className="esconde-mob">Última atualização</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((cl) => (
              <tr key={cl.id}>
                <td><Link href={`/clientes/${cl.id}`}><b>{cl.nome}</b></Link></td>
                <td className="esconde-mob">{cl.telefone}</td>
                <td className="esconde-mob">{idade(cl.nascimento) ?? ""}</td>
                <td className="num">{Number(cl.n_fichas)}</td>
                <td className="esconde-mob muted">{dataBR(cl.updated_at)}</td>
              </tr>
            ))}
            {!lista.length && (
              <tr><td colSpan={5} className="vazio">
                {q ? "Nenhuma cliente encontrada." : <>Nenhuma cliente cadastrada ainda. <Link href="/clientes/nova">Cadastrar a primeira</Link></>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
