import Link from "next/link";
import { sair } from "../actions";
import { Nav } from "@/components/Nav";
import { Icone } from "@/components/Icone";
import { infoBanco } from "@/lib/db";

function Marca() {
  return (
    <Link href="/" className="marca">
      <span className="logo">TH</span>
      <span>
        <b>Espaço Thaís Helena</b>
        <small>Estria · Cicatriz · Flacidez</small>
      </span>
    </Link>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app">
      <aside className="side">
        <Marca />
        <Nav tipo="lateral" />
        <div className="side-fim">
          <div className={`banco${infoBanco.permanente ? "" : " temp"}`} title={`Banco de dados: ${infoBanco.tipo} — ${infoBanco.local}${infoBanco.variavel ? ` (variável ${infoBanco.variavel})` : ""}`}>
            <span className="ponto" /> Banco: {infoBanco.tipo}
            <small>{infoBanco.local}</small>
          </div>
        <form action={sair}>
          <button className="nav-sair"><Icone n="sair" s={19} /> <span>Sair</span></button>
        </form>
        </div>
      </aside>

      <header className="mtopo">
        <Marca />
        <form action={sair}>
          <button className="btn-icone" aria-label="Sair"><Icone n="sair" /></button>
        </form>
      </header>

      <main className="main">
        {!infoBanco.permanente && (
          <div className="faixa erro alerta-banco" role="alert">
            <b>Atenção: os dados NÃO estão sendo guardados de forma permanente.</b>
            <span>
              O banco em uso ({infoBanco.local}) é criado a cada atualização do sistema, então tudo o que for
              cadastrado some no próximo deploy. Configure um banco fixo nas variáveis <code>BANCO_URL</code> e{" "}
              <code>BANCO_TOKEN</code> do Vercel (veja o README) antes de continuar usando.
            </span>
          </div>
        )}
        {children}
      </main>
      <Nav tipo="inferior" />
    </div>
  );
}
