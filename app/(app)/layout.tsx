import Link from "next/link";
import { sair } from "../actions";
import { Nav } from "@/components/Nav";
import { Icone } from "@/components/Icone";

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
        <form action={sair} className="side-fim">
          <button className="nav-sair"><Icone n="sair" s={19} /> <span>Sair</span></button>
        </form>
      </aside>

      <header className="mtopo">
        <Marca />
        <form action={sair}>
          <button className="btn-icone" aria-label="Sair"><Icone n="sair" /></button>
        </form>
      </header>

      <main className="main">{children}</main>
      <Nav tipo="inferior" />
    </div>
  );
}
