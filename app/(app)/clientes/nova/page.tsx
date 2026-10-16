import Link from "next/link";
import { criarCliente } from "../../../actions";
import { ClienteForm } from "@/components/ClienteForm";
import { exigirLogin } from "@/lib/sessao";

export const metadata = { title: "Nova cliente · Espaço Thaís Helena" };

export default async function NovaCliente() {
  await exigirLogin();
  return (
    <>
      <div className="topo">
        <div>
          <h1>Nova cliente</h1>
          <div className="muted">Depois de salvar, você já pode abrir as fichas dela.</div>
        </div>
        <Link className="btn sec" href="/clientes">Cancelar</Link>
      </div>
      <div className="card">
        <ClienteForm action={criarCliente} botao="Salvar e abrir pasta da cliente" />
      </div>
    </>
  );
}
