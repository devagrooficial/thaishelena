import Link from "next/link";
import { criarCliente } from "../../../actions";
import { ClienteForm } from "@/components/ClienteForm";
import { Icone } from "@/components/Icone";
import { exigirLogin } from "@/lib/sessao";

export const metadata = { title: "Nova cliente · Espaço Thaís Helena" };

export default async function NovaCliente() {
  await exigirLogin();
  return (
    <>
      <div className="cab-pag">
        <div>
          <Link href="/clientes" className="trilha"><Icone n="voltar" s={15} /> Clientes</Link>
          <h1>Nova cliente</h1>
          <div className="sub">Depois de salvar, a pasta dela abre e você já pode criar as fichas.</div>
        </div>
      </div>
      <div className="card">
        <ClienteForm
          action={criarCliente}
          botao="Salvar e abrir pasta"
          cancelar={<Link className="btn sec so-desk" href="/clientes">Cancelar</Link>}
        />
      </div>
    </>
  );
}
